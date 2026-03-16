import { TestBed } from '@angular/core/testing';
import type {
  GraphEdgeRecord,
  GraphNodeRecord,
  GraphRecord,
  PersistedGraphDocument,
} from '../../../core/models/graph.models';
import { EventToGraphService } from './event-to-graph';

describe('EventToGraphService', () => {
  let service: EventToGraphService;

  const graphId = 'graph-1';
  const baseGraph: GraphRecord = {
    id: graphId,
    name: 'Test',
    slug: 'test',
    chassis: 'B7',
    classType: '2wd-buggy',
    surface: 'carpet',
    notes: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    version: 1,
  };
  const emptyDocument: PersistedGraphDocument = {
    graph: baseGraph,
    nodes: [],
    edges: [],
  };
  const timestamp = '2024-06-01T10:00:00Z';

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventToGraphService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('record-symptom', () => {
    it('should create a symptom node and condition node with an edge between them', () => {
      const result = service.applyEvent(
        {
          id: 'event-1',
          sessionId: 'session-1',
          graphId,
          type: 'record-symptom',
          data: {
            symptom: 'Entry push',
            cornerPhase: 'entry',
            confidence: 'medium',
          },
          createdAt: timestamp,
        },
        emptyDocument,
      );

      const conditionNode = result.nodes.find((n) => n.type === 'condition');
      const symptomNode = result.nodes.find((n) => n.type === 'symptom');

      expect(conditionNode).toBeDefined();
      expect(conditionNode?.title).toBe('entry');
      expect(symptomNode).toBeDefined();
      expect(symptomNode?.title).toBe('Entry push');
      expect(symptomNode?.phaseTags).toContain('entry');
      expect(symptomNode?.confidence).toBe('medium');

      const edge = result.edges.find(
        (e) =>
          e.sourceNodeId === conditionNode?.id &&
          e.targetNodeId === symptomNode?.id,
      );
      expect(edge).toBeDefined();
      expect(edge?.relationshipType).toBe('influences');
    });

    it('should reuse an existing symptom node and merge phaseTags', () => {
      const existingSymptomNode: GraphNodeRecord = {
        id: 'node-existing',
        graphId,
        type: 'symptom',
        subtype: '',
        title: 'entry push',
        description: '',
        tags: [],
        phaseTags: ['mid'],
        confidence: 'low',
        position: { x: 100, y: 100 },
        data: {},
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      const docWithSymptom: PersistedGraphDocument = {
        graph: baseGraph,
        nodes: [existingSymptomNode],
        edges: [],
      };

      const result = service.applyEvent(
        {
          id: 'event-2',
          sessionId: 'session-1',
          graphId,
          type: 'record-symptom',
          data: {
            symptom: 'entry push',
            cornerPhase: 'entry',
            confidence: 'high',
          },
          createdAt: timestamp,
        },
        docWithSymptom,
      );

      const symptomNodes = result.nodes.filter((n) => n.type === 'symptom');
      expect(symptomNodes).toHaveLength(1);
      expect(symptomNodes[0]?.phaseTags).toContain('mid');
      expect(symptomNodes[0]?.phaseTags).toContain('entry');
      expect(symptomNodes[0]?.confidence).toBe('high');
    });

    it('should not create a duplicate edge when condition→symptom edge already exists', () => {
      const conditionNode: GraphNodeRecord = {
        id: 'node-cond',
        graphId,
        type: 'condition',
        subtype: '',
        title: 'entry',
        description: '',
        tags: [],
        phaseTags: [],
        confidence: 'low',
        position: { x: 100, y: 100 },
        data: {},
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      const symptomNode: GraphNodeRecord = {
        id: 'node-sym',
        graphId,
        type: 'symptom',
        subtype: '',
        title: 'entry push',
        description: '',
        tags: [],
        phaseTags: ['entry'],
        confidence: 'low',
        position: { x: 300, y: 100 },
        data: {},
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      const existingEdge: GraphEdgeRecord = {
        id: 'edge-existing',
        graphId,
        sourceNodeId: 'node-cond',
        targetNodeId: 'node-sym',
        relationshipType: 'influences',
        label: 'influences',
        description: '',
        confidence: 'low',
        phaseTags: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      const doc: PersistedGraphDocument = {
        graph: baseGraph,
        nodes: [conditionNode, symptomNode],
        edges: [existingEdge],
      };

      const result = service.applyEvent(
        {
          id: 'event-3',
          sessionId: 'session-1',
          graphId,
          type: 'record-symptom',
          data: {
            symptom: 'entry push',
            cornerPhase: 'entry',
            confidence: 'medium',
          },
          createdAt: timestamp,
        },
        doc,
      );

      const influenceEdges = result.edges.filter(
        (e) => e.relationshipType === 'influences',
      );
      expect(influenceEdges).toHaveLength(1);
    });
  });

  describe('log-setup-change', () => {
    it('should create experiment, setup, and symptom nodes with edges', () => {
      const result = service.applyEvent(
        {
          id: 'event-4',
          sessionId: 'session-1',
          graphId,
          type: 'log-setup-change',
          data: {
            component: 'Front spring',
            fromValue: '1.4',
            toValue: '1.6',
            reason: 'entry push',
          },
          createdAt: timestamp,
        },
        emptyDocument,
      );

      const symptomNode = result.nodes.find((n) => n.type === 'symptom');
      const experimentNode = result.nodes.find((n) => n.type === 'experiment');
      const setupNode = result.nodes.find((n) => n.type === 'setup');

      expect(symptomNode).toBeDefined();
      expect(symptomNode?.title).toBe('entry push');
      expect(experimentNode).toBeDefined();
      expect(experimentNode?.title).toBe('Front spring: 1.4 → 1.6');
      expect(setupNode).toBeDefined();
      expect(setupNode?.title).toBe('Front spring');

      const symptomToExperiment = result.edges.find(
        (e) =>
          e.sourceNodeId === symptomNode?.id &&
          e.targetNodeId === experimentNode?.id,
      );
      expect(symptomToExperiment?.relationshipType).toBe('observed');

      const experimentToSetup = result.edges.find(
        (e) =>
          e.sourceNodeId === experimentNode?.id &&
          e.targetNodeId === setupNode?.id,
      );
      expect(experimentToSetup?.relationshipType).toBe('tested');
    });

    it('should reuse an existing symptom node matching the reason', () => {
      const existingSymptom: GraphNodeRecord = {
        id: 'node-sym-existing',
        graphId,
        type: 'symptom',
        subtype: '',
        title: 'entry push',
        description: '',
        tags: [],
        phaseTags: [],
        confidence: 'low',
        position: { x: 100, y: 100 },
        data: {},
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      const doc: PersistedGraphDocument = {
        graph: baseGraph,
        nodes: [existingSymptom],
        edges: [],
      };

      const result = service.applyEvent(
        {
          id: 'event-5',
          sessionId: 'session-1',
          graphId,
          type: 'log-setup-change',
          data: {
            component: 'Rear spring',
            fromValue: '1.2',
            toValue: '1.4',
            reason: 'entry push',
          },
          createdAt: timestamp,
        },
        doc,
      );

      const symptomNodes = result.nodes.filter((n) => n.type === 'symptom');
      expect(symptomNodes).toHaveLength(1);
      expect(symptomNodes[0]?.id).toBe('node-sym-existing');
    });
  });

  describe('record-result', () => {
    it('should create an outcome node and link it to the most recent experiment node', () => {
      const experimentNode: GraphNodeRecord = {
        id: 'node-exp',
        graphId,
        type: 'experiment',
        subtype: '',
        title: 'Front spring: 1.4 → 1.6',
        description: '',
        tags: [],
        phaseTags: [],
        confidence: 'low',
        position: { x: 200, y: 100 },
        data: {},
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      const doc: PersistedGraphDocument = {
        graph: baseGraph,
        nodes: [experimentNode],
        edges: [],
      };

      const result = service.applyEvent(
        {
          id: 'event-6',
          sessionId: 'session-1',
          graphId,
          type: 'record-result',
          data: {
            outcome: 'reduced push',
            effect: 'improved',
            notes: 'felt much better',
          },
          createdAt: timestamp,
        },
        doc,
      );

      const outcomeNode = result.nodes.find((n) => n.type === 'outcome');
      expect(outcomeNode).toBeDefined();
      expect(outcomeNode?.title).toBe('reduced push');

      const edge = result.edges.find(
        (e) =>
          e.sourceNodeId === experimentNode.id &&
          e.targetNodeId === outcomeNode?.id,
      );
      expect(edge).toBeDefined();
      expect(edge?.relationshipType).toBe('observed');
      expect(edge?.description).toBe('felt much better');
    });

    it('should create an outcome node even when no experiment node exists', () => {
      const result = service.applyEvent(
        {
          id: 'event-7',
          sessionId: 'session-1',
          graphId,
          type: 'record-result',
          data: { outcome: 'better balance', effect: 'improved', notes: '' },
          createdAt: timestamp,
        },
        emptyDocument,
      );

      const outcomeNode = result.nodes.find((n) => n.type === 'outcome');
      expect(outcomeNode).toBeDefined();
      expect(outcomeNode?.title).toBe('better balance');
      expect(result.edges).toHaveLength(0);
    });

    it('should link result to the most recently created experiment when multiple exist', () => {
      const olderExperiment: GraphNodeRecord = {
        id: 'node-exp-old',
        graphId,
        type: 'experiment',
        subtype: '',
        title: 'Rear spring: 1.2 → 1.4',
        description: '',
        tags: [],
        phaseTags: [],
        confidence: 'low',
        position: { x: 100, y: 100 },
        data: {},
        createdAt: '2024-01-01T08:00:00Z',
        updatedAt: '2024-01-01T08:00:00Z',
      };
      const newerExperiment: GraphNodeRecord = {
        id: 'node-exp-new',
        graphId,
        type: 'experiment',
        subtype: '',
        title: 'Front spring: 1.4 → 1.6',
        description: '',
        tags: [],
        phaseTags: [],
        confidence: 'low',
        position: { x: 300, y: 100 },
        data: {},
        createdAt: '2024-06-01T10:00:00Z',
        updatedAt: '2024-06-01T10:00:00Z',
      };
      const doc: PersistedGraphDocument = {
        graph: baseGraph,
        nodes: [olderExperiment, newerExperiment],
        edges: [],
      };

      const result = service.applyEvent(
        {
          id: 'event-8',
          sessionId: 'session-1',
          graphId,
          type: 'record-result',
          data: { outcome: 'improved handling', effect: 'improved', notes: '' },
          createdAt: timestamp,
        },
        doc,
      );

      const edge = result.edges.find((e) => e.relationshipType === 'observed');
      expect(edge?.sourceNodeId).toBe('node-exp-new');
    });
  });
});
