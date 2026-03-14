export type GraphClassType = '2wd-buggy';

export type GraphSurface = 'carpet';

export type GraphNodeType =
  | 'setup'
  | 'symptom'
  | 'outcome'
  | 'condition'
  | 'experiment'
  | 'group';

export type GraphPhaseTag =
  | 'entry'
  | 'mid'
  | 'exit'
  | 'bumps'
  | 'jumps'
  | 'braking'
  | 'on-power';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export type RelationshipType =
  | 'can increase'
  | 'can reduce'
  | 'influences'
  | 'tested'
  | 'observed'
  | 'tradeoff'
  | 'depends on';

export type EvidenceType = 'theory' | 'observed' | 'repeated-test';

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
