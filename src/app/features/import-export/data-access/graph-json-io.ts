import { Injectable } from '@angular/core';
import type {
  GraphExportPayload,
  GraphRecord,
  PersistedGraphDocument,
} from '../../../core/models/graph.models';
import { GRAPH_SCHEMA_VERSION } from '../../../core/models/graph.models';

@Injectable({
  providedIn: 'root',
})
export class GraphJsonIo {
  toExportPayload(
    document: PersistedGraphDocument,
    exportTimestamp = new Date().toISOString(),
  ): GraphExportPayload {
    return {
      schemaVersion: GRAPH_SCHEMA_VERSION,
      exportTimestamp,
      graph: structuredClone(document.graph),
      nodes: structuredClone(document.nodes),
      edges: structuredClone(document.edges),
    };
  }

  stringify(payload: GraphExportPayload): string {
    return JSON.stringify(payload, null, 2);
  }

  parse(rawJson: string): unknown {
    try {
      return JSON.parse(rawJson) as unknown;
    } catch {
      throw new Error('The selected file does not contain valid JSON.');
    }
  }

  buildFilename(graph: Pick<GraphRecord, 'slug' | 'name'>): string {
    const baseName = graph.slug.trim() || graph.name.trim() || 'graph-export';

    return `${sanitizeFileSegment(baseName)}.json`;
  }
}

function sanitizeFileSegment(value: string): string {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'graph-export';
}
