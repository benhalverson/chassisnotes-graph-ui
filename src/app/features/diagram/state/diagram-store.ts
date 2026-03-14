import { computed, type Injector, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { initializeModel, type ModelAdapter } from 'ng-diagram';
import { GraphsRepository } from '../../../core/db/repositories/graphs-repository';
import type {
  ConfidenceLevel,
  EvidenceType,
  GraphEdgeRecord,
  GraphNodeRecord,
  GraphNodeType,
  GraphPhaseTag,
  GraphPosition,
  GraphRecord,
  PersistedGraphDocument,
  RelationshipType,
} from '../../../core/models/graph.models';
import { RelationshipRules } from '../data-access/relationship-rules';

export type DiagramSelection =
  | { kind: 'node'; id: string }
  | { kind: 'edge'; id: string }
  | null;

type DiagramState = {
  graph: GraphRecord | null;
  nodes: GraphNodeRecord[];
  edges: GraphEdgeRecord[];
  selection: DiagramSelection;
  filters: DiagramFilters;
  loading: boolean;
  mutating: boolean;
  error: string | null;
  validationError: string | null;
};

export type DiagramFilters = {
  nodeTypes: GraphNodeType[];
  phaseTags: GraphPhaseTag[];
  confidenceLevels: ConfidenceLevel[];
  evidenceTypes: EvidenceType[];
  highlightSelectionNeighborhood: boolean;
};

export type DiagramFilterState = {
  matchedNodeIds: string[];
  matchedEdgeIds: string[];
  highlightedNodeIds: string[];
  highlightedEdgeIds: string[];
  dimmedNodeIds: string[];
  dimmedEdgeIds: string[];
};

function createInitialFilters(): DiagramFilters {
  return {
    nodeTypes: [],
    phaseTags: [],
    confidenceLevels: [],
    evidenceTypes: [],
    highlightSelectionNeighborhood: true,
  };
}

function createInitialState(): DiagramState {
  return {
    graph: null,
    nodes: [],
    edges: [],
    selection: null,
    filters: createInitialFilters(),
    loading: false,
    mutating: false,
    error: null,
    validationError: null,
  };
}

/**
 * Editor-facing state for the currently opened persisted graph document.
 *
 * This store loads graph records from the repository, exposes the selected
 * node or edge for inspector UIs, and persists document-level edits such as
 * node changes and drag position updates. The live canvas runtime is owned by
 * ngDiagram; this store represents the persisted document state around it.
 */
export const DiagramStore = signalStore(
  { providedIn: 'root' },
  withState(createInitialState()),
  withComputed((store) => {
    const filterState = computed<DiagramFilterState>(() =>
      computeDiagramFilterState(
        store.nodes(),
        store.edges(),
        store.selection(),
        store.filters(),
      ),
    );

    return {
      graphTitle: computed(() => store.graph()?.name ?? 'Graph editor'),
      hasActiveGraph: computed(() => store.graph() !== null),
      filterState,
      selectedNode: computed(() => {
        const selection = store.selection();

        if (selection?.kind !== 'node') {
          return null;
        }

        return store.nodes().find((node) => node.id === selection.id) ?? null;
      }),
      selectedEdge: computed(() => {
        const selection = store.selection();

        if (selection?.kind !== 'edge') {
          return null;
        }

        return store.edges().find((edge) => edge.id === selection.id) ?? null;
      }),
      matchedNodeIds: computed(() => filterState().matchedNodeIds),
      matchedEdgeIds: computed(() => filterState().matchedEdgeIds),
      highlightedNodeIds: computed(() => filterState().highlightedNodeIds),
      highlightedEdgeIds: computed(() => filterState().highlightedEdgeIds),
      dimmedNodeIds: computed(() => filterState().dimmedNodeIds),
      dimmedEdgeIds: computed(() => filterState().dimmedEdgeIds),
    };
  }),
  withMethods((store) => {
    const graphsRepository = inject(GraphsRepository);
    const relationshipRules = inject(RelationshipRules);

    const patchFilters = (filters: DiagramFilters): void => {
      patchState(store, {
        filters,
        validationError: null,
      });
    };

    const persistGraphDocument = async (
      graph: GraphRecord,
      nodes: GraphNodeRecord[],
      edges: GraphEdgeRecord[],
      selection: DiagramSelection,
    ): Promise<void> => {
      patchState(store, {
        mutating: true,
        error: null,
        validationError: null,
      });

      try {
        const updatedGraph = await graphsRepository.saveGraphDocument({
          graph,
          nodes,
          edges,
        });

        patchState(store, {
          graph: updatedGraph,
          nodes,
          edges,
          selection,
          mutating: false,
          validationError: null,
        });
      } catch (error) {
        patchState(store, {
          mutating: false,
          error:
            error instanceof Error ? error.message : 'Failed to save graph.',
        });
      }
    };

    return {
      async loadGraph(graphId: string): Promise<void> {
        patchState(store, {
          loading: true,
          selection: null,
          filters: createInitialFilters(),
          error: null,
          validationError: null,
        });

        try {
          const graphDocument = await graphsRepository.loadGraph(graphId);

          if (!graphDocument) {
            patchState(store, {
              loading: false,
              graph: null,
              nodes: [],
              edges: [],
              selection: null,
              filters: createInitialFilters(),
              error: 'Graph not found.',
            });

            return;
          }

          patchState(store, {
            loading: false,
            graph: graphDocument.graph,
            nodes: graphDocument.nodes,
            edges: graphDocument.edges,
            selection: null,
            filters: createInitialFilters(),
            error: null,
            validationError: null,
          });
        } catch (error) {
          patchState(store, {
            loading: false,
            error:
              error instanceof Error ? error.message : 'Failed to load graph.',
          });
        }
      },

      updateSelection(nodeIds: string[], edgeIds: string[]): void {
        const currentSelection = store.selection();
        const nextSelection =
          nodeIds[0] !== undefined
            ? ({ kind: 'node', id: nodeIds[0] } as const)
            : edgeIds[0] !== undefined
              ? ({ kind: 'edge', id: edgeIds[0] } as const)
              : null;

        if (
          currentSelection?.kind === nextSelection?.kind &&
          currentSelection?.id === nextSelection?.id
        ) {
          return;
        }

        patchState(store, {
          selection: nextSelection,
          validationError: null,
        });
      },

      clearSelection(): void {
        patchState(store, {
          selection: null,
          validationError: null,
        });
      },

      clearValidationError(): void {
        patchState(store, { validationError: null });
      },

      setFilters(filters: Partial<DiagramFilters>): void {
        patchFilters({
          ...store.filters(),
          ...filters,
        });
      },

      resetFilters(): void {
        patchFilters(createInitialFilters());
      },

      toggleNodeTypeFilter(type: GraphNodeType, enabled: boolean): void {
        patchFilters({
          ...store.filters(),
          nodeTypes: toggleFilterValue(
            store.filters().nodeTypes,
            type,
            enabled,
          ),
        });
      },

      togglePhaseTagFilter(tag: GraphPhaseTag, enabled: boolean): void {
        patchFilters({
          ...store.filters(),
          phaseTags: toggleFilterValue(store.filters().phaseTags, tag, enabled),
        });
      },

      toggleConfidenceFilter(
        confidence: ConfidenceLevel,
        enabled: boolean,
      ): void {
        patchFilters({
          ...store.filters(),
          confidenceLevels: toggleFilterValue(
            store.filters().confidenceLevels,
            confidence,
            enabled,
          ),
        });
      },

      toggleEvidenceTypeFilter(
        evidenceType: EvidenceType,
        enabled: boolean,
      ): void {
        patchFilters({
          ...store.filters(),
          evidenceTypes: toggleFilterValue(
            store.filters().evidenceTypes,
            evidenceType,
            enabled,
          ),
        });
      },

      setSelectionNeighborhoodHighlight(enabled: boolean): void {
        patchFilters({
          ...store.filters(),
          highlightSelectionNeighborhood: enabled,
        });
      },

      async addNode(type: GraphNodeType): Promise<void> {
        const graph = store.graph();

        if (!graph || type === 'group') {
          return;
        }

        const node = createDefaultNode(graph.id, type, store.nodes());
        const nodes = [...store.nodes(), node];
        const selection = { kind: 'node', id: node.id } as const;

        await persistGraphDocument(graph, nodes, store.edges(), selection);
      },

      async createEdge(
        sourceNodeId: string,
        targetNodeId: string,
        relationshipType?: RelationshipType,
      ): Promise<boolean> {
        const graph = store.graph();

        if (!graph) {
          return false;
        }

        const sourceNode = store
          .nodes()
          .find((node) => node.id === sourceNodeId);
        const targetNode = store
          .nodes()
          .find((node) => node.id === targetNodeId);

        if (!sourceNode || !targetNode) {
          patchState(store, {
            validationError:
              'Both source and target nodes must exist before creating an edge.',
          });

          return false;
        }

        const allowedRelationshipTypes =
          relationshipRules.getAllowedRelationshipTypes(
            sourceNode.type,
            targetNode.type,
          );

        if (allowedRelationshipTypes.length === 0) {
          patchState(store, {
            validationError: `Connections from ${sourceNode.type} to ${targetNode.type} are not allowed.`,
          });

          return false;
        }

        const nextRelationshipType =
          relationshipType ?? allowedRelationshipTypes[0];
        const validationResult = relationshipRules.validateConnection({
          sourceType: sourceNode.type,
          targetType: targetNode.type,
          relationshipType: nextRelationshipType,
          label: nextRelationshipType,
          sourceNodeId,
          targetNodeId,
        });

        if (!validationResult.valid) {
          patchState(store, {
            validationError: validationResult.errors.join(' '),
          });

          return false;
        }

        const timestamp = new Date().toISOString();
        const edge: GraphEdgeRecord = {
          id: createId('edge'),
          graphId: graph.id,
          sourceNodeId,
          targetNodeId,
          relationshipType: nextRelationshipType,
          label: nextRelationshipType,
          description: '',
          confidence: 'low',
          phaseTags: [],
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        const edges = [...store.edges(), edge];

        await persistGraphDocument(graph, store.nodes(), edges, {
          kind: 'edge',
          id: edge.id,
        });

        return true;
      },

      async updateNode(
        nodeId: string,
        changes: Partial<
          Pick<
            GraphNodeRecord,
            'title' | 'subtype' | 'description' | 'confidence' | 'phaseTags'
          >
        >,
      ): Promise<void> {
        const graph = store.graph();

        if (!graph) {
          return;
        }

        const nodes = store.nodes();
        const targetNode = nodes.find((node) => node.id === nodeId);

        if (!targetNode) {
          return;
        }

        const timestamp = new Date().toISOString();
        const updatedNodes = nodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                ...changes,
                updatedAt: timestamp,
              }
            : node,
        );

        await persistGraphDocument(
          { ...graph, updatedAt: timestamp },
          updatedNodes,
          store.edges(),
          store.selection(),
        );
      },

      async updateEdge(
        edgeId: string,
        changes: Partial<
          Pick<
            GraphEdgeRecord,
            | 'relationshipType'
            | 'label'
            | 'description'
            | 'confidence'
            | 'phaseTags'
            | 'evidenceType'
          >
        >,
      ): Promise<boolean> {
        const graph = store.graph();

        if (!graph) {
          return false;
        }

        const edges = store.edges();
        const targetEdge = edges.find((edge) => edge.id === edgeId);

        if (!targetEdge) {
          return false;
        }

        const sourceNode = store
          .nodes()
          .find((node) => node.id === targetEdge.sourceNodeId);
        const targetNode = store
          .nodes()
          .find((node) => node.id === targetEdge.targetNodeId);

        if (!sourceNode || !targetNode) {
          patchState(store, {
            validationError: 'The selected edge references a missing node.',
          });

          return false;
        }

        const nextEdge = {
          ...targetEdge,
          ...changes,
          label:
            changes.label?.trim() ??
            changes.relationshipType ??
            targetEdge.label,
        } satisfies GraphEdgeRecord;

        const validationResult = relationshipRules.validateConnection({
          sourceType: sourceNode.type,
          targetType: targetNode.type,
          relationshipType: nextEdge.relationshipType,
          label: nextEdge.label,
          sourceNodeId: nextEdge.sourceNodeId,
          targetNodeId: nextEdge.targetNodeId,
        });

        if (!validationResult.valid) {
          patchState(store, {
            validationError: validationResult.errors.join(' '),
          });

          return false;
        }

        const timestamp = new Date().toISOString();
        const updatedEdges = edges.map((edge) =>
          edge.id === edgeId
            ? {
                ...nextEdge,
                updatedAt: timestamp,
              }
            : edge,
        );

        await persistGraphDocument(
          { ...graph, updatedAt: timestamp },
          store.nodes(),
          updatedEdges,
          store.selection(),
        );

        return true;
      },

      async deleteSelectedNode(): Promise<void> {
        const graph = store.graph();
        const selection = store.selection();

        if (!graph || selection?.kind !== 'node') {
          return;
        }

        const timestamp = new Date().toISOString();
        const remainingNodes = store
          .nodes()
          .filter((node) => node.id !== selection.id);
        const remainingEdges = store
          .edges()
          .filter(
            (edge) =>
              edge.sourceNodeId !== selection.id &&
              edge.targetNodeId !== selection.id,
          );

        await persistGraphDocument(
          { ...graph, updatedAt: timestamp },
          remainingNodes,
          remainingEdges,
          null,
        );
      },

      async deleteSelectedEdge(): Promise<void> {
        const graph = store.graph();
        const selection = store.selection();

        if (!graph || selection?.kind !== 'edge') {
          return;
        }

        const timestamp = new Date().toISOString();
        const remainingEdges = store
          .edges()
          .filter((edge) => edge.id !== selection.id);

        await persistGraphDocument(
          { ...graph, updatedAt: timestamp },
          store.nodes(),
          remainingEdges,
          null,
        );
      },

      async syncNodePositions(
        positions: ReadonlyArray<{ id: string; position: GraphPosition }>,
      ): Promise<void> {
        const graph = store.graph();

        if (!graph || positions.length === 0) {
          return;
        }

        const positionMap = new Map(
          positions.map((entry) => [entry.id, entry.position] as const),
        );
        let hasChanges = false;
        const timestamp = new Date().toISOString();
        const updatedNodes = store.nodes().map((node) => {
          const nextPosition = positionMap.get(node.id);

          if (!nextPosition) {
            return node;
          }

          if (
            node.position.x === nextPosition.x &&
            node.position.y === nextPosition.y
          ) {
            return node;
          }

          hasChanges = true;

          return {
            ...node,
            position: nextPosition,
            updatedAt: timestamp,
          };
        });

        if (!hasChanges) {
          return;
        }

        await persistGraphDocument(
          { ...graph, updatedAt: timestamp },
          updatedNodes,
          store.edges(),
          store.selection(),
        );
      },

      clear(): void {
        patchState(store, createInitialState());
      },
    };
  }),
);

export function buildDiagramModel(
  graphDocument: PersistedGraphDocument,
  selection: DiagramSelection,
  filterState: DiagramFilterState,
  injector?: Injector,
): ModelAdapter {
  return initializeModel(
    {
      nodes: createDiagramNodes(graphDocument.nodes, selection, filterState),
      edges: createDiagramEdges(
        graphDocument.nodes,
        graphDocument.edges,
        selection,
        filterState,
      ),
    },
    injector,
  );
}

export function syncDiagramModel(
  model: ModelAdapter,
  graphDocument: PersistedGraphDocument,
  selection: DiagramSelection,
  filterState: DiagramFilterState,
): void {
  model.updateNodes(
    createDiagramNodes(graphDocument.nodes, selection, filterState),
  );
  model.updateEdges(
    createDiagramEdges(
      graphDocument.nodes,
      graphDocument.edges,
      selection,
      filterState,
    ),
  );
}

function createDiagramNodes(
  graphNodes: readonly GraphNodeRecord[],
  selection: DiagramSelection,
  filterState: DiagramFilterState,
) {
  return graphNodes
    .filter((node) => node.id.trim().length > 0)
    .map((node) => ({
      id: node.id,
      position: {
        x: Number.isFinite(node.position.x) ? node.position.x : 0,
        y: Number.isFinite(node.position.y) ? node.position.y : 0,
      },
      type: 'graph-node',
      selected: selection?.kind === 'node' && selection.id === node.id,
      data: {
        ...node.data,
        type: node.type,
        label: node.title,
        category: capitalizeLabel(node.type),
        subtype: node.subtype,
        description: node.description,
        phaseTags: node.phaseTags,
        confidence: node.confidence,
        isDimmed: filterState.dimmedNodeIds.includes(node.id),
        isHighlighted: filterState.highlightedNodeIds.includes(node.id),
      },
    }));
}

function createDiagramEdges(
  graphNodes: readonly GraphNodeRecord[],
  graphEdges: readonly GraphEdgeRecord[],
  selection: DiagramSelection,
  filterState: DiagramFilterState,
) {
  const nodeIds = new Set(
    graphNodes
      .filter((node) => node.id.trim().length > 0)
      .map((node) => node.id),
  );

  return graphEdges
    .filter(
      (edge) =>
        edge.id.trim().length > 0 &&
        nodeIds.has(edge.sourceNodeId) &&
        nodeIds.has(edge.targetNodeId),
    )
    .map((edge) => ({
      id: edge.id,
      source: edge.sourceNodeId,
      type: 'graph-edge',
      sourcePort: 'port-right',
      target: edge.targetNodeId,
      targetPort: 'port-left',
      selected: selection?.kind === 'edge' && selection.id === edge.id,
      data: {
        label: edge.label || edge.relationshipType,
        relationshipType: edge.relationshipType,
        evidenceType: edge.evidenceType,
        confidence: edge.confidence,
        isDimmed: filterState.dimmedEdgeIds.includes(edge.id),
        isHighlighted: filterState.highlightedEdgeIds.includes(edge.id),
      },
    }));
}

function createDefaultNode(
  graphId: string,
  type: Exclude<GraphNodeType, 'group'>,
  nodes: readonly GraphNodeRecord[],
): GraphNodeRecord {
  const timestamp = new Date().toISOString();
  const typeCount = nodes.filter((node) => node.type === type).length;

  return {
    id: createId('node'),
    graphId,
    type,
    subtype: defaultSubtype(type),
    title: `${capitalizeLabel(type)} ${typeCount + 1}`,
    description: '',
    tags: [],
    phaseTags: [],
    confidence: defaultConfidence(type),
    position: defaultPosition(nodes.length),
    data: {},
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function defaultSubtype(type: Exclude<GraphNodeType, 'group'>): string {
  switch (type) {
    case 'setup':
      return 'suspension';
    case 'symptom':
      return 'handling';
    case 'outcome':
      return 'balance';
    case 'condition':
      return 'track';
    case 'experiment':
      return 'test';
  }
}

function defaultConfidence(
  type: Exclude<GraphNodeType, 'group'>,
): ConfidenceLevel {
  return type === 'experiment' ? 'medium' : 'low';
}

function defaultPosition(index: number): GraphPosition {
  const columnCount = 3;

  return {
    x: 96 + (index % columnCount) * 280,
    y: 96 + Math.floor(index / columnCount) * 176,
  };
}

function createId(prefix: string): string {
  const randomValue =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${prefix}-${randomValue}`;
}

function capitalizeLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function toggleFilterValue<T>(
  values: readonly T[],
  value: T,
  enabled: boolean,
): T[] {
  if (enabled) {
    return values.includes(value) ? [...values] : [...values, value];
  }

  return values.filter((entry) => entry !== value);
}

function computeDiagramFilterState(
  nodes: readonly GraphNodeRecord[],
  edges: readonly GraphEdgeRecord[],
  selection: DiagramSelection,
  filters: DiagramFilters,
): DiagramFilterState {
  const matchedNodeIds = new Set<string>();

  nodes.forEach((node) => {
    if (matchesNodeFilters(node, filters)) {
      matchedNodeIds.add(node.id);
    }
  });

  const matchedEdgeIds = new Set<string>();

  edges.forEach((edge) => {
    if (
      matchedNodeIds.has(edge.sourceNodeId) &&
      matchedNodeIds.has(edge.targetNodeId) &&
      matchesEdgeFilters(edge, filters)
    ) {
      matchedEdgeIds.add(edge.id);
    }
  });

  const highlightedNodeIds = new Set<string>(matchedNodeIds);
  const highlightedEdgeIds = new Set<string>(matchedEdgeIds);

  if (filters.highlightSelectionNeighborhood) {
    if (selection?.kind === 'node') {
      highlightedNodeIds.add(selection.id);

      edges.forEach((edge) => {
        if (
          edge.sourceNodeId === selection.id ||
          edge.targetNodeId === selection.id
        ) {
          highlightedEdgeIds.add(edge.id);
          highlightedNodeIds.add(edge.sourceNodeId);
          highlightedNodeIds.add(edge.targetNodeId);
        }
      });
    }

    if (selection?.kind === 'edge') {
      highlightedEdgeIds.add(selection.id);

      const selectedEdge = edges.find((edge) => edge.id === selection.id);

      if (selectedEdge) {
        highlightedNodeIds.add(selectedEdge.sourceNodeId);
        highlightedNodeIds.add(selectedEdge.targetNodeId);
      }
    }
  }

  const dimmedNodeIds = nodes
    .filter((node) => !highlightedNodeIds.has(node.id))
    .map((node) => node.id);
  const dimmedEdgeIds = edges
    .filter((edge) => !highlightedEdgeIds.has(edge.id))
    .map((edge) => edge.id);

  return {
    matchedNodeIds: [...matchedNodeIds],
    matchedEdgeIds: [...matchedEdgeIds],
    highlightedNodeIds: [...highlightedNodeIds],
    highlightedEdgeIds: [...highlightedEdgeIds],
    dimmedNodeIds,
    dimmedEdgeIds,
  };
}

function matchesNodeFilters(
  node: GraphNodeRecord,
  filters: DiagramFilters,
): boolean {
  return (
    matchesFilterList(filters.nodeTypes, node.type) &&
    matchesFilterList(filters.confidenceLevels, node.confidence) &&
    matchesFilterIntersection(filters.phaseTags, node.phaseTags)
  );
}

function matchesEdgeFilters(
  edge: GraphEdgeRecord,
  filters: DiagramFilters,
): boolean {
  return (
    matchesFilterList(filters.confidenceLevels, edge.confidence) &&
    matchesFilterIntersection(filters.phaseTags, edge.phaseTags) &&
    matchesOptionalFilterList(filters.evidenceTypes, edge.evidenceType)
  );
}

function matchesFilterList<T>(filters: readonly T[], value: T): boolean {
  return filters.length === 0 || filters.includes(value);
}

function matchesOptionalFilterList<T>(
  filters: readonly T[],
  value: T | undefined,
): boolean {
  return (
    filters.length === 0 || (value !== undefined && filters.includes(value))
  );
}

function matchesFilterIntersection<T>(
  filters: readonly T[],
  values: readonly T[],
): boolean {
  return (
    filters.length === 0 || values.some((value) => filters.includes(value))
  );
}
