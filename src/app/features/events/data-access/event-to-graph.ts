import { Injectable } from '@angular/core';
import type {
  ConfidenceLevel,
  GraphEdgeRecord,
  GraphNodeRecord,
  GraphPhaseTag,
  LogSetupChangeData,
  PersistedGraphDocument,
  RacingEventRecord,
  RecordResultData,
  RecordSymptomData,
} from '../../../core/models/graph.models';

export interface EventApplicationResult {
  nodes: GraphNodeRecord[];
  edges: GraphEdgeRecord[];
}

@Injectable({
  providedIn: 'root',
})
export class EventToGraphService {
  applyEvent(event: RacingEventRecord, document: PersistedGraphDocument): EventApplicationResult {
    const nodes = [...document.nodes];
    const edges = [...document.edges];
    const graphId = document.graph.id;
    const timestamp = event.createdAt;

    switch (event.type) {
      case 'record-symptom':
        return this.applyRecordSymptom(event.data as RecordSymptomData, graphId, nodes, edges, timestamp);
      case 'log-setup-change':
        return this.applyLogSetupChange(event.data as LogSetupChangeData, graphId, nodes, edges, timestamp);
      case 'record-result':
        return this.applyRecordResult(event.data as RecordResultData, graphId, nodes, edges, timestamp);
      default:
        return { nodes, edges };
    }
  }

  private applyRecordSymptom(
    data: RecordSymptomData,
    graphId: string,
    nodes: GraphNodeRecord[],
    edges: GraphEdgeRecord[],
    timestamp: string,
  ): EventApplicationResult {
    const updatedNodes = [...nodes];
    const updatedEdges = [...edges];

    // Find or create condition node for corner phase
    let conditionNode = updatedNodes.find(
      (n) => n.type === 'condition' && n.title.toLowerCase() === data.cornerPhase.toLowerCase()
    );
    if (!conditionNode) {
      conditionNode = createNode(graphId, 'condition', '', data.cornerPhase, '', [data.cornerPhase], data.confidence, timestamp, updatedNodes);
      updatedNodes.push(conditionNode);
    }

    // Find or create symptom node
    let symptomNode = updatedNodes.find(
      (n) => n.type === 'symptom' && n.title.toLowerCase() === data.symptom.toLowerCase()
    );
    if (!symptomNode) {
      symptomNode = createNode(graphId, 'symptom', '', data.symptom, '', [data.cornerPhase], data.confidence, timestamp, updatedNodes);
      updatedNodes.push(symptomNode);
    } else {
      // Update phaseTags and confidence if the node already exists
      const idx = updatedNodes.indexOf(symptomNode);
      const merged: GraphPhaseTag[] = Array.from(new Set([...symptomNode.phaseTags, data.cornerPhase])) as GraphPhaseTag[];
      symptomNode = { ...symptomNode, phaseTags: merged, confidence: data.confidence as ConfidenceLevel, updatedAt: timestamp };
      updatedNodes[idx] = symptomNode;
    }

    // Create condition→symptom edge if not already present
    const edgeExists = updatedEdges.some(
      (e) => e.sourceNodeId === conditionNode!.id && e.targetNodeId === symptomNode!.id
    );
    if (!edgeExists) {
      updatedEdges.push(createEdge(graphId, conditionNode.id, symptomNode.id, 'influences', [data.cornerPhase], timestamp));
    }

    return { nodes: updatedNodes, edges: updatedEdges };
  }

  private applyLogSetupChange(
    data: LogSetupChangeData,
    graphId: string,
    nodes: GraphNodeRecord[],
    edges: GraphEdgeRecord[],
    timestamp: string,
  ): EventApplicationResult {
    const updatedNodes = [...nodes];
    const updatedEdges = [...edges];

    // Find or create symptom node from reason
    let symptomNode = updatedNodes.find(
      (n) => n.type === 'symptom' && n.title.toLowerCase() === data.reason.toLowerCase()
    );
    if (!symptomNode) {
      symptomNode = createNode(graphId, 'symptom', '', data.reason, '', [], 'low', timestamp, updatedNodes);
      updatedNodes.push(symptomNode);
    }

    // Create experiment node
    const experimentTitle = `${data.component}: ${data.fromValue} → ${data.toValue}`;
    const experimentNode = createNode(graphId, 'experiment', data.component, experimentTitle, `Changed from ${data.fromValue} to ${data.toValue}`, [], 'low', timestamp, updatedNodes);
    updatedNodes.push(experimentNode);

    // Find or create setup node
    let setupNode = updatedNodes.find(
      (n) => n.type === 'setup' && n.title.toLowerCase() === data.component.toLowerCase()
    );
    if (!setupNode) {
      setupNode = createNode(graphId, 'setup', '', data.component, '', [], 'low', timestamp, updatedNodes);
      updatedNodes.push(setupNode);
    }

    // Create symptom→experiment edge ('observed')
    updatedEdges.push(createEdge(graphId, symptomNode.id, experimentNode.id, 'observed', [], timestamp));
    // Create experiment→setup edge ('tested')
    updatedEdges.push(createEdge(graphId, experimentNode.id, setupNode.id, 'tested', [], timestamp));

    return { nodes: updatedNodes, edges: updatedEdges };
  }

  private applyRecordResult(
    data: RecordResultData,
    graphId: string,
    nodes: GraphNodeRecord[],
    edges: GraphEdgeRecord[],
    timestamp: string,
  ): EventApplicationResult {
    const updatedNodes = [...nodes];
    const updatedEdges = [...edges];

    // Find most recent experiment node
    const experimentNode = [...updatedNodes]
      .filter((n) => n.type === 'experiment')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

    // Find or create outcome node
    let outcomeNode = updatedNodes.find(
      (n) => n.type === 'outcome' && n.title.toLowerCase() === data.outcome.toLowerCase()
    );
    if (!outcomeNode) {
      outcomeNode = createNode(graphId, 'outcome', '', data.outcome, data.notes, [], 'low', timestamp, updatedNodes);
      updatedNodes.push(outcomeNode);
    }

    // Create experiment→outcome edge if experiment exists
    if (experimentNode) {
      const edgeExists = updatedEdges.some(
        (e) => e.sourceNodeId === experimentNode.id && e.targetNodeId === outcomeNode!.id
      );
      if (!edgeExists) {
        updatedEdges.push(createEdge(graphId, experimentNode.id, outcomeNode.id, 'observed', [], timestamp, data.notes));
      }
    }

    return { nodes: updatedNodes, edges: updatedEdges };
  }
}

function createId(prefix: string): string {
  const randomValue = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${randomValue}`;
}

function nextPosition(existingNodes: GraphNodeRecord[]): { x: number; y: number } {
  if (existingNodes.length === 0) {
    return { x: 100, y: 100 };
  }
  const maxX = Math.max(...existingNodes.map((n) => n.position.x));
  const maxY = Math.max(...existingNodes.map((n) => n.position.y));
  return { x: maxX + 200, y: maxY };
}

function createNode(
  graphId: string,
  type: GraphNodeRecord['type'],
  subtype: string,
  title: string,
  description: string,
  phaseTags: GraphPhaseTag[],
  confidence: ConfidenceLevel,
  timestamp: string,
  existingNodes: GraphNodeRecord[],
): GraphNodeRecord {
  return {
    id: createId('node'),
    graphId,
    type,
    subtype,
    title,
    description,
    tags: [],
    phaseTags,
    confidence,
    position: nextPosition(existingNodes),
    data: {},
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createEdge(
  graphId: string,
  sourceNodeId: string,
  targetNodeId: string,
  relationshipType: GraphEdgeRecord['relationshipType'],
  phaseTags: GraphPhaseTag[],
  timestamp: string,
  description = '',
): GraphEdgeRecord {
  return {
    id: createId('edge'),
    graphId,
    sourceNodeId,
    targetNodeId,
    relationshipType,
    label: relationshipType,
    description,
    confidence: 'low',
    phaseTags,
    evidenceType: 'observed',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
