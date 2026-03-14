import { Injectable } from '@angular/core';
import Dexie, { type Table } from 'dexie';
import type {
  GraphEdgeRecord,
  GraphNodeRecord,
  GraphRecord,
  TemplateRecord,
} from '../models/graph.models';

@Injectable({
  providedIn: 'root',
})
export class AppDb extends Dexie {
  readonly graphs!: Table<GraphRecord, string>;
  readonly nodes!: Table<GraphNodeRecord, string>;
  readonly edges!: Table<GraphEdgeRecord, string>;
  readonly templates!: Table<TemplateRecord, string>;

  constructor() {
    super('chassisnotes_relationships');

    this.version(1).stores({
      graphs: 'id, updatedAt, [surface+classType], [chassis+classType]',
      nodes: 'id, graphId, [graphId+type], [graphId+subtype]',
      edges:
        'id, graphId, [graphId+relationshipType], [graphId+sourceNodeId], [graphId+targetNodeId]',
      templates: 'id, name, updatedAt',
    });
  }
}
