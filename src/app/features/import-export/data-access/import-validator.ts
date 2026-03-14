import { Injectable } from '@angular/core';
import type {
  GraphEdgeRecord,
  GraphExportPayload,
  GraphNodeRecord,
  GraphRecord,
  PersistedGraphDocument,
} from '../../../core/models/graph.models';
import { GRAPH_SCHEMA_VERSION } from '../../../core/models/graph.models';
import { validateGraphDocument } from '../../diagram/data-access/relationship-rules';

export interface ImportValidationResult {
  valid: boolean;
  errors: string[];
  payload: GraphExportPayload | null;
}

@Injectable({
  providedIn: 'root',
})
export class ImportValidator {
  validate(candidate: unknown): ImportValidationResult {
    const errors: string[] = [];

    if (!isRecord(candidate)) {
      return {
        valid: false,
        errors: ['Import data must be a JSON object.'],
        payload: null,
      };
    }

    const schemaVersion = readRequiredNumber(
      candidate,
      'schemaVersion',
      'schemaVersion',
      errors,
    );
    const exportTimestamp = readRequiredString(
      candidate,
      'exportTimestamp',
      'exportTimestamp',
      errors,
    );
    const graph = readGraphRecord(candidate['graph'], 'graph', errors);
    const nodes = readNodeRecords(candidate['nodes'], 'nodes', errors);
    const edges = readEdgeRecords(candidate['edges'], 'edges', errors);

    if (schemaVersion !== GRAPH_SCHEMA_VERSION) {
      errors.push(
        `Unsupported schema version: ${String(schemaVersion)}. Expected ${GRAPH_SCHEMA_VERSION}.`,
      );
    }

    if (errors.length > 0 || !graph || !nodes || !edges) {
      return {
        valid: false,
        errors,
        payload: null,
      };
    }

    const payload: GraphExportPayload = {
      schemaVersion,
      exportTimestamp,
      graph,
      nodes,
      edges,
    };

    const documentIssues = validateGraphDocument({
      graph: payload.graph,
      nodes: payload.nodes,
      edges: payload.edges,
    });

    if (documentIssues.length > 0) {
      errors.push(...documentIssues.map((issue) => `${issue.path}: ${issue.message}`));
    }

    return {
      valid: errors.length === 0,
      errors,
      payload: errors.length === 0 ? payload : null,
    };
  }

  prepareImport(
    candidate: unknown,
    importedAt = new Date().toISOString(),
  ): PersistedGraphDocument {
    const validation = this.validate(candidate);

    if (!validation.valid || !validation.payload) {
      throw new Error(validation.errors.join('\n'));
    }

    return createImportedDocument(validation.payload, importedAt);
  }
}

function createImportedDocument(
  payload: GraphExportPayload,
  timestamp: string,
): PersistedGraphDocument {
  const graphId = createId('graph');
  const nodeIdMap = new Map(
    payload.nodes.map((node) => [node.id, createId('node')] as const),
  );

  const importedGraph: GraphRecord = {
    ...payload.graph,
    id: graphId,
    name: `${payload.graph.name} Imported`,
    slug: createSlug(`${payload.graph.name}-imported-${graphId.slice(0, 8)}`),
    createdAt: timestamp,
    updatedAt: timestamp,
    version: GRAPH_SCHEMA_VERSION,
  };

  const importedNodes: GraphNodeRecord[] = payload.nodes.map((node) => ({
    ...node,
    id: nodeIdMap.get(node.id) ?? createId('node'),
    graphId,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));

  const importedEdges: GraphEdgeRecord[] = payload.edges.map((edge) => ({
    ...edge,
    id: createId('edge'),
    graphId,
    sourceNodeId: nodeIdMap.get(edge.sourceNodeId) ?? edge.sourceNodeId,
    targetNodeId: nodeIdMap.get(edge.targetNodeId) ?? edge.targetNodeId,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));

  return {
    graph: importedGraph,
    nodes: importedNodes,
    edges: importedEdges,
  };
}

function readGraphRecord(
  candidate: unknown,
  path: string,
  errors: string[],
): GraphRecord | null {
  if (!isRecord(candidate)) {
    errors.push(`${path} must be an object.`);

    return null;
  }

  return {
    id: readRequiredString(candidate, 'id', `${path}.id`, errors),
    name: readRequiredString(candidate, 'name', `${path}.name`, errors),
    slug: readRequiredString(candidate, 'slug', `${path}.slug`, errors),
    chassis: readRequiredString(
      candidate,
      'chassis',
      `${path}.chassis`,
      errors,
    ),
    classType: readRequiredString(
      candidate,
      'classType',
      `${path}.classType`,
      errors,
    ) as GraphRecord['classType'],
    surface: readRequiredString(
      candidate,
      'surface',
      `${path}.surface`,
      errors,
    ) as GraphRecord['surface'],
    notes: readRequiredString(candidate, 'notes', `${path}.notes`, errors),
    templateId: readOptionalString(candidate, 'templateId', `${path}.templateId`, errors),
    createdAt: readRequiredString(
      candidate,
      'createdAt',
      `${path}.createdAt`,
      errors,
    ),
    updatedAt: readRequiredString(
      candidate,
      'updatedAt',
      `${path}.updatedAt`,
      errors,
    ),
    version: readRequiredNumber(candidate, 'version', `${path}.version`, errors),
  };
}

function readNodeRecords(
  candidate: unknown,
  path: string,
  errors: string[],
): GraphNodeRecord[] | null {
  if (!Array.isArray(candidate)) {
    errors.push(`${path} must be an array.`);

    return null;
  }

  return candidate.map((entry, index) => readNodeRecord(entry, `${path}[${index}]`, errors));
}

function readNodeRecord(
  candidate: unknown,
  path: string,
  errors: string[],
): GraphNodeRecord {
  if (!isRecord(candidate)) {
    errors.push(`${path} must be an object.`);

    return createFallbackNodeRecord();
  }

  return {
    id: readRequiredString(candidate, 'id', `${path}.id`, errors),
    graphId: readRequiredString(candidate, 'graphId', `${path}.graphId`, errors),
    type: readRequiredString(candidate, 'type', `${path}.type`, errors) as GraphNodeRecord['type'],
    subtype: readRequiredString(candidate, 'subtype', `${path}.subtype`, errors),
    title: readRequiredString(candidate, 'title', `${path}.title`, errors),
    description: readRequiredString(
      candidate,
      'description',
      `${path}.description`,
      errors,
    ),
    tags: readStringArray(candidate, 'tags', `${path}.tags`, errors),
    phaseTags: readStringArray(
      candidate,
      'phaseTags',
      `${path}.phaseTags`,
      errors,
    ) as GraphNodeRecord['phaseTags'],
    confidence: readRequiredString(
      candidate,
      'confidence',
      `${path}.confidence`,
      errors,
    ) as GraphNodeRecord['confidence'],
    position: readPosition(candidate['position'], `${path}.position`, errors),
    size: readOptionalSize(candidate['size'], `${path}.size`, errors),
    data: readDataRecord(candidate['data'], `${path}.data`, errors),
    createdAt: readRequiredString(
      candidate,
      'createdAt',
      `${path}.createdAt`,
      errors,
    ),
    updatedAt: readRequiredString(
      candidate,
      'updatedAt',
      `${path}.updatedAt`,
      errors,
    ),
  };
}

function readEdgeRecords(
  candidate: unknown,
  path: string,
  errors: string[],
): GraphEdgeRecord[] | null {
  if (!Array.isArray(candidate)) {
    errors.push(`${path} must be an array.`);

    return null;
  }

  return candidate.map((entry, index) => readEdgeRecord(entry, `${path}[${index}]`, errors));
}

function readEdgeRecord(
  candidate: unknown,
  path: string,
  errors: string[],
): GraphEdgeRecord {
  if (!isRecord(candidate)) {
    errors.push(`${path} must be an object.`);

    return createFallbackEdgeRecord();
  }

  return {
    id: readRequiredString(candidate, 'id', `${path}.id`, errors),
    graphId: readRequiredString(candidate, 'graphId', `${path}.graphId`, errors),
    sourceNodeId: readRequiredString(
      candidate,
      'sourceNodeId',
      `${path}.sourceNodeId`,
      errors,
    ),
    targetNodeId: readRequiredString(
      candidate,
      'targetNodeId',
      `${path}.targetNodeId`,
      errors,
    ),
    relationshipType: readRequiredString(
      candidate,
      'relationshipType',
      `${path}.relationshipType`,
      errors,
    ) as GraphEdgeRecord['relationshipType'],
    label: readRequiredString(candidate, 'label', `${path}.label`, errors),
    description: readRequiredString(
      candidate,
      'description',
      `${path}.description`,
      errors,
    ),
    confidence: readRequiredString(
      candidate,
      'confidence',
      `${path}.confidence`,
      errors,
    ) as GraphEdgeRecord['confidence'],
    phaseTags: readStringArray(
      candidate,
      'phaseTags',
      `${path}.phaseTags`,
      errors,
    ) as GraphEdgeRecord['phaseTags'],
    evidenceType: readOptionalString(
      candidate,
      'evidenceType',
      `${path}.evidenceType`,
      errors,
    ) as GraphEdgeRecord['evidenceType'],
    createdAt: readRequiredString(
      candidate,
      'createdAt',
      `${path}.createdAt`,
      errors,
    ),
    updatedAt: readRequiredString(
      candidate,
      'updatedAt',
      `${path}.updatedAt`,
      errors,
    ),
  };
}

function readPosition(
  candidate: unknown,
  path: string,
  errors: string[],
): GraphNodeRecord['position'] {
  if (!isRecord(candidate)) {
    errors.push(`${path} must be an object.`);

    return { x: 0, y: 0 };
  }

  return {
    x: readRequiredNumber(candidate, 'x', `${path}.x`, errors),
    y: readRequiredNumber(candidate, 'y', `${path}.y`, errors),
  };
}

function readOptionalSize(
  candidate: unknown,
  path: string,
  errors: string[],
): GraphNodeRecord['size'] {
  if (candidate === undefined) {
    return undefined;
  }

  if (!isRecord(candidate)) {
    errors.push(`${path} must be an object when provided.`);

    return undefined;
  }

  return {
    width: readRequiredNumber(candidate, 'width', `${path}.width`, errors),
    height: readRequiredNumber(candidate, 'height', `${path}.height`, errors),
  };
}

function readDataRecord(
  candidate: unknown,
  path: string,
  errors: string[],
): Record<string, unknown> {
  if (!isRecord(candidate)) {
    errors.push(`${path} must be an object.`);

    return {};
  }

  return candidate;
}

function readStringArray(
  source: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[],
): string[] {
  const value = source[key];

  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array of strings.`);

    return [];
  }

  return value.flatMap((entry, index) => {
    if (typeof entry === 'string') {
      return [entry];
    }

    errors.push(`${path}[${index}] must be a string.`);

    return [];
  });
}

function readRequiredString(
  source: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[],
): string {
  const value = source[key];

  if (typeof value === 'string') {
    return value;
  }

  errors.push(`${path} must be a string.`);

  return '';
}

function readOptionalString(
  source: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[],
): string | undefined {
  const value = source[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value;
  }

  errors.push(`${path} must be a string when provided.`);

  return undefined;
}

function readRequiredNumber(
  source: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[],
): number {
  const value = source[key];

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  errors.push(`${path} must be a finite number.`);

  return 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function createFallbackNodeRecord(): GraphNodeRecord {
  return {
    id: '',
    graphId: '',
    type: 'setup',
    subtype: '',
    title: '',
    description: '',
    tags: [],
    phaseTags: [],
    confidence: 'low',
    position: { x: 0, y: 0 },
    data: {},
    createdAt: '',
    updatedAt: '',
  };
}

function createFallbackEdgeRecord(): GraphEdgeRecord {
  return {
    id: '',
    graphId: '',
    sourceNodeId: '',
    targetNodeId: '',
    relationshipType: 'influences',
    label: '',
    description: '',
    confidence: 'low',
    phaseTags: [],
    createdAt: '',
    updatedAt: '',
  };
}

function createId(prefix: string): string {
  const randomValue =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${prefix}-${randomValue}`;
}

function createSlug(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'graph';
}
