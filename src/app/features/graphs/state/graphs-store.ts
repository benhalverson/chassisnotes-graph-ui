import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { GraphsRepository } from '../../../core/db/repositories/graphs-repository';
import type {
  GraphRecord,
  TemplateRecord,
} from '../../../core/models/graph.models';

type GraphsState = {
  graphs: GraphRecord[];
  templates: TemplateRecord[];
  loading: boolean;
  mutating: boolean;
  error: string | null;
  pendingDeleteGraphId: string | null;
};

const initialState: GraphsState = {
  graphs: [],
  templates: [],
  loading: false,
  mutating: false,
  error: null,
  pendingDeleteGraphId: null,
};

/**
 * Library-level state for saved graphs and starter templates.
 *
 * This store is used by the graph library UI to list persisted graphs,
 * create new graphs from templates, duplicate existing graphs, and manage
 * delete confirmation flow. It does not own the live ngDiagram editor model.
 */
export const GraphsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    defaultTemplate: computed(() => store.templates()[0] ?? null),
    pendingDeleteGraph: computed(() => {
      const pendingId = store.pendingDeleteGraphId();

      return store.graphs().find((graph) => graph.id === pendingId) ?? null;
    }),
  })),
  withMethods((store) => {
    const graphsRepository = inject(GraphsRepository);

    return {
      async loadLibrary(): Promise<void> {
        patchState(store, { loading: true, error: null });

        try {
          const [graphs, templates] = await Promise.all([
            graphsRepository.listGraphs(),
            graphsRepository.listTemplates(),
          ]);

          patchState(store, { graphs, templates, loading: false });
        } catch (error) {
          patchState(store, {
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to load graph library.',
          });
        }
      },

      async createFromTemplate(
        templateId: string,
      ): Promise<GraphRecord | null> {
        patchState(store, { mutating: true, error: null });

        try {
          const graph =
            await graphsRepository.createGraphFromTemplate(templateId);
          const graphs = await graphsRepository.listGraphs();

          patchState(store, { graphs, mutating: false });

          return graph;
        } catch (error) {
          patchState(store, {
            mutating: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to create graph.',
          });

          return null;
        }
      },

      async duplicateGraph(graphId: string): Promise<GraphRecord | null> {
        patchState(store, { mutating: true, error: null });

        try {
          const graph = await graphsRepository.duplicateGraph(graphId);
          const graphs = await graphsRepository.listGraphs();

          patchState(store, { graphs, mutating: false });

          return graph;
        } catch (error) {
          patchState(store, {
            mutating: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to duplicate graph.',
          });

          return null;
        }
      },

      requestDelete(graphId: string): void {
        patchState(store, { pendingDeleteGraphId: graphId });
      },

      cancelDelete(): void {
        patchState(store, { pendingDeleteGraphId: null });
      },

      async confirmDelete(): Promise<void> {
        const graphId = store.pendingDeleteGraphId();

        if (!graphId) {
          return;
        }

        patchState(store, { mutating: true, error: null });

        try {
          await graphsRepository.deleteGraph(graphId);
          const graphs = await graphsRepository.listGraphs();

          patchState(store, {
            graphs,
            mutating: false,
            pendingDeleteGraphId: null,
          });
        } catch (error) {
          patchState(store, {
            mutating: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to delete graph.',
          });
        }
      },
    };
  }),
);
