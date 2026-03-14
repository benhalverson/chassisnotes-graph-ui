import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { initializeModel, type ModelAdapter } from 'ng-diagram';
import { GraphsRepository } from '../../../core/db/repositories/graphs-repository';
import type { PersistedGraphDocument } from '../../../core/models/graph.models';

type DiagramState = {
  graph: PersistedGraphDocument['graph'] | null;
  model: ModelAdapter | null;
  loading: boolean;
  error: string | null;
};

const initialState: DiagramState = {
  graph: null,
  model: null,
  loading: false,
  error: null,
};

export const DiagramStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    graphTitle: computed(() => store.graph()?.name ?? 'Graph editor'),
  })),
  withMethods((store) => {
    const graphsRepository = inject(GraphsRepository);

    return {
      async loadGraph(graphId: string): Promise<void> {
        patchState(store, { loading: true, error: null });

        try {
          const graphDocument = await graphsRepository.loadGraph(graphId);

          if (!graphDocument) {
            patchState(store, {
              loading: false,
              graph: null,
              model: null,
              error: 'Graph not found.',
            });

            return;
          }

          patchState(store, {
            loading: false,
            graph: graphDocument.graph,
            model: toDiagramModel(graphDocument),
          });
        } catch (error) {
          patchState(store, {
            loading: false,
            error:
              error instanceof Error ? error.message : 'Failed to load graph.',
          });
        }
      },

      clear(): void {
        patchState(store, initialState);
      },
    };
  }),
);

function toDiagramModel(graphDocument: PersistedGraphDocument): ModelAdapter {
  return initializeModel({
    nodes: graphDocument.nodes.map((node) => ({
      id: node.id,
      position: node.position,
      data: {
        ...node.data,
        label: node.title,
        category: capitalizeLabel(node.type),
        subtype: node.subtype,
        confidence: node.confidence,
      },
    })),
    edges: graphDocument.edges.map((edge) => ({
      id: edge.id,
      source: edge.sourceNodeId,
      sourcePort: 'port-right',
      target: edge.targetNodeId,
      targetPort: 'port-left',
      data: {
        label: edge.label,
        relationshipType: edge.relationshipType,
        evidenceType: edge.evidenceType,
      },
    })),
  });
}

function capitalizeLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
