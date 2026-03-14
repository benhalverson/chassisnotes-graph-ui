import { Injectable } from '@angular/core';
import type {
  ConfidenceLevel,
  GraphEdgeRecord,
  GraphNodeRecord,
  GraphNodeType,
  GraphPhaseTag,
  PersistedGraphDocument,
  RelationshipType,
} from '../../../core/models/graph.models';
import {
  CONFIDENCE_LEVELS,
  EVIDENCE_TYPES,
  GRAPH_NODE_TYPES,
  GRAPH_PHASE_TAGS,
  RELATIONSHIP_TYPES,
} from '../../../core/models/graph.models';

export interface RelationshipValidationResult {
  readonly valid: boolean;
  readonly errors: string[];
  readonly allowedRelationshipTypes: readonly RelationshipType[];
}

export interface GraphDocumentValidationIssue {
  readonly path: string;
  readonly message: string;
}

type EdgeValidationInput = Pick<
  GraphEdgeRecord,
  'relationshipType' | 'label' | 'sourceNodeId' | 'targetNodeId'
> & {
  sourceType: GraphNodeType;
  targetType: GraphNodeType;
};

const allowedTargetsBySource = {
  condition: ['setup', 'symptom'],
  setup: ['symptom', 'outcome'],
  symptom: ['experiment'],
  experiment: ['outcome', 'symptom'],
  outcome: ['symptom'],
  group: [],
} as const satisfies Record<GraphNodeType, readonly GraphNodeType[]>;

const phaseTagSet = new Set<string>(GRAPH_PHASE_TAGS);
const confidenceSet = new Set<string>(CONFIDENCE_LEVELS);
const relationshipTypeSet = new Set<string>(RELATIONSHIP_TYPES);
const evidenceTypeSet = new Set<string>(EVIDENCE_TYPES);
const graphNodeTypeSet = new Set<string>(GRAPH_NODE_TYPES);

@Injectable({
  providedIn: 'root',
})
export class RelationshipRules {
  getAllowedTargets(sourceType: GraphNodeType): readonly GraphNodeType[] {
    return allowedTargetsBySource[sourceType];
  }

  getAllowedRelationshipTypes(
    sourceType: GraphNodeType,
    targetType: GraphNodeType,
  ): readonly RelationshipType[] {
    return getAllowedRelationshipTypes(sourceType, targetType);
  }

  validateConnection(input: EdgeValidationInput): RelationshipValidationResult {
    return validateRelationshipConnection(input);
  }

  validateGraphDocument(
    document: PersistedGraphDocument,
  ): GraphDocumentValidationIssue[] {
    return validateGraphDocument(document);
  }

  assertValidGraphDocument(document: PersistedGraphDocument): void {
    assertValidGraphDocument(document);
  }
}

export function getAllowedRelationshipTypes(
  sourceType: GraphNodeType,
  targetType: GraphNodeType,
): readonly RelationshipType[] {
  const allowedTargets = allowedTargetsBySource[
    sourceType
  ] as readonly GraphNodeType[];

  if (!allowedTargets.includes(targetType)) {
    return [];
  }

  if (sourceType === 'outcome' && targetType === 'symptom') {
    return ['tradeoff'];
  }

  return RELATIONSHIP_TYPES;
}

export function validateRelationshipConnection(
  input: EdgeValidationInput,
): RelationshipValidationResult {
  const allowedRelationshipTypes = getAllowedRelationshipTypes(
    input.sourceType,
    input.targetType,
  );
  const errors: string[] = [];

  if (input.sourceNodeId === input.targetNodeId) {
    errors.push('Self-referential edges are not allowed.');
  }

  if (allowedRelationshipTypes.length === 0) {
    errors.push(
      `Connections from ${input.sourceType} to ${input.targetType} are not allowed.`,
    );
  }

  if (!relationshipTypeSet.has(input.relationshipType)) {
    errors.push(`Unknown relationship type: ${input.relationshipType}.`);
  } else if (!allowedRelationshipTypes.includes(input.relationshipType)) {
    errors.push(
      `Relationship type ${input.relationshipType} is not allowed for ${input.sourceType} → ${input.targetType}.`,
    );
  }

  const normalizedLabel = input.label.trim();

  if (normalizedLabel.length === 0) {
    errors.push('Relationship labels are required.');
  } else if (!relationshipTypeSet.has(normalizedLabel)) {
    errors.push(`Unknown relationship label: ${normalizedLabel}.`);
  }

  if (
    input.sourceType === 'outcome' &&
    input.targetType === 'symptom' &&
    input.relationshipType !== 'tradeoff'
  ) {
    errors.push(
      'Outcome → symptom edges must be explicitly modeled as tradeoffs.',
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    allowedRelationshipTypes,
  };
}

export function validateGraphDocument(
  document: PersistedGraphDocument,
): GraphDocumentValidationIssue[] {
  const issues: GraphDocumentValidationIssue[] = [];
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  const nodesById = new Map<string, GraphNodeRecord>();

  if (document.graph.id.trim().length === 0) {
    issues.push({
      path: 'graph.id',
      message: 'Graph id is required.',
    });
  }

  document.nodes.forEach((node, index) => {
    const path = `nodes[${index}]`;

    if (node.id.trim().length === 0) {
      issues.push({ path: `${path}.id`, message: 'Node id is required.' });
    } else if (nodeIds.has(node.id)) {
      issues.push({
        path: `${path}.id`,
        message: `Duplicate node id: ${node.id}.`,
      });
    } else {
      nodeIds.add(node.id);
      nodesById.set(node.id, node);
    }

    if (node.graphId !== document.graph.id) {
      issues.push({
        path: `${path}.graphId`,
        message: 'Node graph id must match the document graph id.',
      });
    }

    if (!graphNodeTypeSet.has(node.type)) {
      issues.push({
        path: `${path}.type`,
        message: `Unknown node type: ${node.type}.`,
      });
    }

    if (node.title.trim().length === 0) {
      issues.push({
        path: `${path}.title`,
        message: 'Node title is required.',
      });
    }

    pushPhaseTagIssues(path, node.phaseTags, issues);
    pushConfidenceIssue(path, node.confidence, issues);
  });

  document.edges.forEach((edge, index) => {
    const path = `edges[${index}]`;

    if (edge.id.trim().length === 0) {
      issues.push({ path: `${path}.id`, message: 'Edge id is required.' });
    } else if (edgeIds.has(edge.id)) {
      issues.push({
        path: `${path}.id`,
        message: `Duplicate edge id: ${edge.id}.`,
      });
    } else {
      edgeIds.add(edge.id);
    }

    if (edge.graphId !== document.graph.id) {
      issues.push({
        path: `${path}.graphId`,
        message: 'Edge graph id must match the document graph id.',
      });
    }

    const sourceNode = nodesById.get(edge.sourceNodeId);
    const targetNode = nodesById.get(edge.targetNodeId);

    if (!sourceNode) {
      issues.push({
        path: `${path}.sourceNodeId`,
        message: `Source node not found: ${edge.sourceNodeId}.`,
      });
    }

    if (!targetNode) {
      issues.push({
        path: `${path}.targetNodeId`,
        message: `Target node not found: ${edge.targetNodeId}.`,
      });
    }

    pushConfidenceIssue(path, edge.confidence, issues);
    pushPhaseTagIssues(path, edge.phaseTags, issues);

    if (edge.evidenceType && !evidenceTypeSet.has(edge.evidenceType)) {
      issues.push({
        path: `${path}.evidenceType`,
        message: `Unknown evidence type: ${edge.evidenceType}.`,
      });
    }

    if (sourceNode && targetNode) {
      const validationResult = validateRelationshipConnection({
        sourceType: sourceNode.type,
        targetType: targetNode.type,
        relationshipType: edge.relationshipType,
        label: edge.label,
        sourceNodeId: edge.sourceNodeId,
        targetNodeId: edge.targetNodeId,
      });

      validationResult.errors.forEach((message) => {
        issues.push({ path, message });
      });
    }
  });

  return issues;
}

export function assertValidGraphDocument(
  document: PersistedGraphDocument,
): void {
  const issues = validateGraphDocument(document);

  if (issues.length === 0) {
    return;
  }

  throw new Error(
    issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n'),
  );
}

function pushPhaseTagIssues(
  path: string,
  phaseTags: readonly GraphPhaseTag[],
  issues: GraphDocumentValidationIssue[],
): void {
  phaseTags.forEach((phaseTag, index) => {
    if (!phaseTagSet.has(phaseTag)) {
      issues.push({
        path: `${path}.phaseTags[${index}]`,
        message: `Unknown phase tag: ${phaseTag}.`,
      });
    }
  });
}

function pushConfidenceIssue(
  path: string,
  confidence: ConfidenceLevel,
  issues: GraphDocumentValidationIssue[],
): void {
  if (confidenceSet.has(confidence)) {
    return;
  }

  issues.push({
    path: `${path}.confidence`,
    message: `Unknown confidence level: ${confidence}.`,
  });
}
