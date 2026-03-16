export type GraphClassType = '2wd-buggy';

export const GRAPH_SCHEMA_VERSION = 1;

export type GraphSurface = 'carpet';

export type GraphNodeType =
  | 'setup'
  | 'symptom'
  | 'outcome'
  | 'condition'
  | 'experiment'
  | 'group';

export const GRAPH_NODE_TYPES = [
  'setup',
  'symptom',
  'outcome',
  'condition',
  'experiment',
  'group',
] as const satisfies readonly GraphNodeType[];

export type GraphPhaseTag =
  | 'entry'
  | 'mid'
  | 'exit'
  | 'bumps'
  | 'jumps'
  | 'braking'
  | 'on-power';

export const GRAPH_PHASE_TAGS = [
  'entry',
  'mid',
  'exit',
  'bumps',
  'jumps',
  'braking',
  'on-power',
] as const satisfies readonly GraphPhaseTag[];

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export const CONFIDENCE_LEVELS = [
  'low',
  'medium',
  'high',
] as const satisfies readonly ConfidenceLevel[];

export type RelationshipType =
  | 'can increase'
  | 'can reduce'
  | 'influences'
  | 'tested'
  | 'observed'
  | 'tradeoff'
  | 'depends on';

export const RELATIONSHIP_TYPES = [
  'can increase',
  'can reduce',
  'influences',
  'tested',
  'observed',
  'tradeoff',
  'depends on',
] as const satisfies readonly RelationshipType[];

export type EvidenceType = 'theory' | 'observed' | 'repeated-test';

export const EVIDENCE_TYPES = [
  'theory',
  'observed',
  'repeated-test',
] as const satisfies readonly EvidenceType[];

export interface GraphPosition {
  x: number;
  y: number;
}

export interface GraphSize {
  width: number;
  height: number;
}

export interface GraphRecord {
  id: string;
  name: string;
  slug: string;
  chassis: string;
  classType: GraphClassType;
  surface: GraphSurface;
  notes: string;
  templateId?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface GraphNodeRecord {
  id: string;
  graphId: string;
  type: GraphNodeType;
  subtype: string;
  title: string;
  description: string;
  tags: string[];
  phaseTags: GraphPhaseTag[];
  confidence: ConfidenceLevel;
  position: GraphPosition;
  size?: GraphSize;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface GraphEdgeRecord {
  id: string;
  graphId: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationshipType: RelationshipType;
  label: string;
  description: string;
  confidence: ConfidenceLevel;
  phaseTags: GraphPhaseTag[];
  evidenceType?: EvidenceType;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateGraphMetadata {
  name: string;
  chassis: string;
  classType: GraphClassType;
  surface: GraphSurface;
  notes: string;
}

export interface TemplateNodeRecord {
  id: string;
  type: GraphNodeType;
  subtype: string;
  title: string;
  description: string;
  tags: string[];
  phaseTags: GraphPhaseTag[];
  confidence: ConfidenceLevel;
  position: GraphPosition;
  size?: GraphSize;
  data: Record<string, unknown>;
}

export interface TemplateEdgeRecord {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationshipType: RelationshipType;
  label: string;
  description: string;
  confidence: ConfidenceLevel;
  phaseTags: GraphPhaseTag[];
  evidenceType?: EvidenceType;
}

export interface TemplateGraphData {
  graph: TemplateGraphMetadata;
  nodes: TemplateNodeRecord[];
  edges: TemplateEdgeRecord[];
}

export interface TemplateRecord {
  id: string;
  name: string;
  description: string;
  graphData: TemplateGraphData;
  createdAt: string;
  updatedAt: string;
}

export interface PersistedGraphDocument {
  graph: GraphRecord;
  nodes: GraphNodeRecord[];
  edges: GraphEdgeRecord[];
}

export interface GraphExportPayload {
  schemaVersion: number;
  exportTimestamp: string;
  graph: GraphRecord;
  nodes: GraphNodeRecord[];
  edges: GraphEdgeRecord[];
}

// Session record - groups a set of events
export interface SessionRecord {
  id: string;
  graphId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// Event types
export type RacingEventType =
  | 'record-symptom'
  | 'log-setup-change'
  | 'record-result';

// Event data payloads
export interface RecordSymptomData {
  symptom: string;
  cornerPhase: GraphPhaseTag;
  confidence: ConfidenceLevel;
}

export interface LogSetupChangeData {
  component: string;
  fromValue: string;
  toValue: string;
  reason: string;
}

export interface RecordResultData {
  outcome: string;
  effect: 'improved' | 'worsened' | 'no-change';
  notes: string;
}

// Discriminated union for event data
export type RacingEventData =
  | ({ type: 'record-symptom' } & RecordSymptomData)
  | ({ type: 'log-setup-change' } & LogSetupChangeData)
  | ({ type: 'record-result' } & RecordResultData);

// The persisted event record
export interface RacingEventRecord {
  id: string;
  sessionId: string;
  graphId: string;
  type: RacingEventType;
  data: RecordSymptomData | LogSetupChangeData | RecordResultData;
  createdAt: string;
}
