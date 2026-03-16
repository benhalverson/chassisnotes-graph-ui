import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { EventsRepository } from '../../../core/db/repositories/events-repository';
import { SessionsRepository } from '../../../core/db/repositories/sessions-repository';
import type {
  LogSetupChangeData,
  PersistedGraphDocument,
  RacingEventRecord,
  RacingEventType,
  RecordResultData,
  RecordSymptomData,
  SessionRecord,
} from '../../../core/models/graph.models';
import { EventToGraphService } from '../data-access/event-to-graph';

type EventsState = {
  currentSession: SessionRecord | null;
  events: RacingEventRecord[];
  loading: boolean;
  error: string | null;
};

function createInitialState(): EventsState {
  return {
    currentSession: null,
    events: [],
    loading: false,
    error: null,
  };
}

export const EventsStore = signalStore(
  { providedIn: 'root' },
  withState(createInitialState()),
  withComputed((store) => ({
    hasActiveSession: computed(() => store.currentSession() !== null),
    eventCount: computed(() => store.events().length),
  })),
  withMethods((store) => {
    const sessionsRepository = inject(SessionsRepository);
    const eventsRepository = inject(EventsRepository);
    const eventToGraphService = inject(EventToGraphService);

    return {
      async loadSession(graphId: string): Promise<void> {
        patchState(store, { loading: true, error: null });
        try {
          const sessions = await sessionsRepository.listByGraph(graphId);
          const today = new Date().toISOString().slice(0, 10);
          let session = sessions.find((s) => s.createdAt.startsWith(today)) ?? null;
          if (!session) {
            const timestamp = new Date().toISOString();
            session = {
              id: createId('session'),
              graphId,
              name: `Session ${today}`,
              createdAt: timestamp,
              updatedAt: timestamp,
            };
            await sessionsRepository.put(session);
          }
          const events = await eventsRepository.listBySession(session.id);
          patchState(store, { currentSession: session, events, loading: false });
        } catch (error) {
          patchState(store, {
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to load session.',
          });
        }
      },

      async logEvent(
        eventType: RacingEventType,
        data: RecordSymptomData | LogSetupChangeData | RecordResultData,
        document: PersistedGraphDocument,
      ): Promise<PersistedGraphDocument> {
        const session = store.currentSession();
        if (!session) {
          throw new Error('No active session. Call loadSession() first.');
        }

        const timestamp = new Date().toISOString();
        const event: RacingEventRecord = {
          id: createId('event'),
          sessionId: session.id,
          graphId: document.graph.id,
          type: eventType,
          data,
          createdAt: timestamp,
        };

        await eventsRepository.put(event);

        patchState(store, { events: [...store.events(), event] });

        const result = eventToGraphService.applyEvent(event, document);

        return {
          graph: { ...document.graph, updatedAt: timestamp },
          nodes: result.nodes,
          edges: result.edges,
        };
      },

      clearSession(): void {
        patchState(store, createInitialState());
      },
    };
  }),
);

function createId(prefix: string): string {
  const randomValue = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${randomValue}`;
}
