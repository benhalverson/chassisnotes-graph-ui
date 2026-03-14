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
  GraphEdgeRecord,
  GraphNodeRecord,
  GraphNodeType,
  GraphPosition,
  GraphRecord,
  PersistedGraphDocument,
} from '../../../core/models/graph.models';

export type DiagramSelection =
  | { kind: 'node'; id: string }
  | { kind: 'edge'; id: string }
  | null;

type DiagramState = {
  graph: GraphRecord | null;
  nodes: GraphNodeRecord[];
  edges: GraphEdgeRecord[];
  selection: DiagramSelection;
  loading: boolean;
  mutating: boolean;
  error: string | null;
};

const initialState: DiagramState = {
  graph: null,
  nodes: [],
  edges: [],
  selection: null,
  loading: false,
  mutating: false,
  error: null,
};

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
  withState(initialState),
  withComputed((store) => ({
    graphTitle: computed(() => store.graph()?.name ?? 'Graph editor'),
    hasActiveGraph: computed(() => store.graph() !== null),
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
  })),
  withMethods((store) => {
    const graphsRepository = inject(GraphsRepository);

    const persistGraphDocument = async (
      graph: GraphRecord,
      nodes: GraphNodeRecord[],
      edges: GraphEdgeRecord[],
      selection: DiagramSelection,
    ): Promise<void> => {
      patchState(store, { mutating: true, error: null });

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
        patchState(store, { loading: true, error: null });

        try {
          const graphDocument = await graphsRepository.loadGraph(graphId);

          if (!graphDocument) {
            patchState(store, {
              loading: false,
              graph: null,
              nodes: [],
              edges: [],
              selection: null,
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

        patchState(store, { selection: nextSelection });
      },

      clearSelection(): void {
        patchState(store, { selection: null });
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
        patchState(store, initialState);
      },
    };
  }),
);

export function buildDiagramModel(
  graphDocument: PersistedGraphDocument,
  selection: DiagramSelection,
  injector?: Injector,
): ModelAdapter {
  return initializeModel(
    {
      nodes: createDiagramNodes(graphDocument.nodes, selection),
      edges: createDiagramEdges(
        graphDocument.nodes,
        graphDocument.edges,
        selection,
      ),
    },
    injector,
  );
}

export function syncDiagramModel(
  model: ModelAdapter,
  graphDocument: PersistedGraphDocument,
  selection: DiagramSelection,
): void {
  model.updateNodes(createDiagramNodes(graphDocument.nodes, selection));
  model.updateEdges(
    createDiagramEdges(graphDocument.nodes, graphDocument.edges, selection),
  );
}

function createDiagramNodes(
  graphNodes: readonly GraphNodeRecord[],
  selection: DiagramSelection,
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
      },
    }));
}

function createDiagramEdges(
  graphNodes: readonly GraphNodeRecord[],
  graphEdges: readonly GraphEdgeRecord[],
  selection: DiagramSelection,
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
      sourcePort: 'port-right',
      target: edge.targetNodeId,
      targetPort: 'port-left',
      selected: selection?.kind === 'edge' && selection.id === edge.id,
      data: {
        label: edge.label || edge.relationshipType,
        relationshipType: edge.relationshipType,
        evidenceType: edge.evidenceType,
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
