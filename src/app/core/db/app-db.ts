import { Injectable } from '@angular/core';
import Dexie, { type Table } from 'dexie';
import type {
  GraphEdgeRecord,
  GraphNodeRecord,
  GraphRecord,
  RacingEventRecord,
  SessionRecord,
  TemplateRecord,
} from '../models/graph.models';

export interface AppPreferenceRecord {
  key: string;
  value: string;
}

@Injectable({
  providedIn: 'root',
})
export class AppDb extends Dexie {
  readonly graphs!: Table<GraphRecord, string>;
  readonly nodes!: Table<GraphNodeRecord, string>;
  readonly edges!: Table<GraphEdgeRecord, string>;
  readonly templates!: Table<TemplateRecord, string>;
  readonly preferences!: Table<AppPreferenceRecord, string>;
  readonly sessions!: Table<SessionRecord, string>;
  readonly events!: Table<RacingEventRecord, string>;

  constructor() {
    super('chassisnotes_relationships');

    this.version(1).stores({
      graphs: 'id, updatedAt, [surface+classType], [chassis+classType]',
      nodes: 'id, graphId, [graphId+type], [graphId+subtype]',
      edges:
        'id, graphId, [graphId+relationshipType], [graphId+sourceNodeId], [graphId+targetNodeId]',
      templates: 'id, name, updatedAt',
    });

    this.version(2).stores({
      graphs: 'id, updatedAt, [surface+classType], [chassis+classType]',
      nodes: 'id, graphId, [graphId+type], [graphId+subtype]',
      edges:
        'id, graphId, [graphId+relationshipType], [graphId+sourceNodeId], [graphId+targetNodeId]',
      templates: 'id, name, updatedAt',
      preferences: 'key',
    });

    this.version(3).stores({
      graphs: 'id, updatedAt, [surface+classType], [chassis+classType]',
      nodes: 'id, graphId, [graphId+type], [graphId+subtype]',
      edges:
        'id, graphId, [graphId+relationshipType], [graphId+sourceNodeId], [graphId+targetNodeId]',
      templates: 'id, name, updatedAt',
      preferences: 'key',
      sessions: 'id, graphId, updatedAt',
      events: 'id, sessionId, graphId, type',
    });
  }
}
