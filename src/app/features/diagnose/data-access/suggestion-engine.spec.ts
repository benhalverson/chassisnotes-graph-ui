import { TestBed } from '@angular/core/testing';
import type { GraphEdgeRecord, GraphNodeRecord } from '../../../core/models/graph.models';
import { SuggestionEngine } from './suggestion-engine';

describe('SuggestionEngine', () => {
  let engine: SuggestionEngine;

  const setupNode: GraphNodeRecord = {
    id: 'setup-1',
    graphId: 'graph-1',
    type: 'setup',
    subtype: 'suspension',
    title: 'Rear camber link',
    description: '',
    tags: [],
    phaseTags: ['entry'],
    confidence: 'medium',
    position: { x: 0, y: 0 },
    data: {},
    createdAt: '2026-03-14T00:00:00.000Z',
    updatedAt: '2026-03-14T00:00:00.000Z',
  };

  const symptomNode: GraphNodeRecord = {
    id: 'symptom-1',
    graphId: 'graph-1',
    type: 'symptom',
    subtype: 'handling',
    title: 'Lazy rotation',
    description: '',
    tags: [],
    phaseTags: ['entry'],
    confidence: 'medium',
    position: { x: 200, y: 0 },
    data: {},
    createdAt: '2026-03-14T00:00:00.000Z',
    updatedAt: '2026-03-14T00:00:00.000Z',
  };

  const outcomeNode: GraphNodeRecord = {
    id: 'outcome-1',
    graphId: 'graph-1',
    type: 'outcome',
    subtype: 'balance',
    title: 'More steering on entry',
    description: '',
    tags: [],
    phaseTags: ['entry'],
    confidence: 'medium',
    position: { x: 400, y: 0 },
    data: {},
    createdAt: '2026-03-14T00:00:00.000Z',
    updatedAt: '2026-03-14T00:00:00.000Z',
  };

  const experimentNode: GraphNodeRecord = {
    id: 'exp-1',
    graphId: 'graph-1',
    type: 'experiment',
    subtype: 'test',
    title: 'Raised rear camber link +1mm',
    description: '',
    tags: [],
    phaseTags: ['entry'],
    confidence: 'high',
    position: { x: 0, y: 200 },
    data: {},
    createdAt: '2026-03-14T00:00:00.000Z',
    updatedAt: '2026-03-14T00:00:00.000Z',
  };

  const setupToSymptomEdge: GraphEdgeRecord = {
    id: 'edge-1',
    graphId: 'graph-1',
    sourceNodeId: 'setup-1',
    targetNodeId: 'symptom-1',
    relationshipType: 'can reduce',
    label: 'can reduce',
    description: '',
    confidence: 'medium',
    phaseTags: ['entry'],
    evidenceType: 'observed',
    createdAt: '2026-03-14T00:00:00.000Z',
    updatedAt: '2026-03-14T00:00:00.000Z',
  };

  const symptomToOutcomeEdge: GraphEdgeRecord = {
    id: 'edge-2',
    graphId: 'graph-1',
    sourceNodeId: 'symptom-1',
    targetNodeId: 'outcome-1',
    relationshipType: 'influences',
    label: 'influences',
    description: '',
    confidence: 'medium',
    phaseTags: ['entry'],
    createdAt: '2026-03-14T00:00:00.000Z',
    updatedAt: '2026-03-14T00:00:00.000Z',
  };

  const experimentToSetupEdge: GraphEdgeRecord = {
    id: 'edge-3',
    graphId: 'graph-1',
    sourceNodeId: 'exp-1',
    targetNodeId: 'setup-1',
    relationshipType: 'tested',
    label: 'tested',
    description: '',
    confidence: 'high',
    phaseTags: ['entry'],
    evidenceType: 'repeated-test',
    createdAt: '2026-03-14T00:00:00.000Z',
    updatedAt: '2026-03-14T00:00:00.000Z',
  };

  const experimentToOutcomeEdge: GraphEdgeRecord = {
    id: 'edge-4',
    graphId: 'graph-1',
    sourceNodeId: 'exp-1',
    targetNodeId: 'outcome-1',
    relationshipType: 'observed',
    label: 'observed',
    description: '',
    confidence: 'high',
    phaseTags: ['entry'],
    evidenceType: 'observed',
    createdAt: '2026-03-14T00:00:00.000Z',
    updatedAt: '2026-03-14T00:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    engine = TestBed.inject(SuggestionEngine);
  });

  it('should be created', () => {
    expect(engine).toBeTruthy();
  });

  describe('getSuggestions', () => {
    it('should return an empty array when no nodes are provided', () => {
      const result = engine.getSuggestions({
        symptomLabel: 'Lazy rotation',
        phase: 'entry',
        nodes: [],
        edges: [],
      });

      expect(result).toEqual([]);
    });

    it('should return an empty array when no matching symptom nodes exist', () => {
      const result = engine.getSuggestions({
        symptomLabel: 'Entry push',
        phase: 'entry',
        nodes: [setupNode, symptomNode],
        edges: [setupToSymptomEdge],
      });

      expect(result).toEqual([]);
    });

    it('should return a suggestion when a setup → symptom edge exists', () => {
      const result = engine.getSuggestions({
        symptomLabel: 'Lazy rotation',
        phase: 'entry',
        nodes: [setupNode, symptomNode],
        edges: [setupToSymptomEdge],
      });

      expect(result).toHaveLength(1);
      expect(result[0]?.title).toBe('Rear camber link');
      expect(result[0]?.confidence).toBe('medium');
    });

    it('should include experiment count in reasoning when experiments are linked', () => {
      const result = engine.getSuggestions({
        symptomLabel: 'Lazy rotation',
        phase: 'entry',
        nodes: [setupNode, symptomNode, experimentNode],
        edges: [setupToSymptomEdge, experimentToSetupEdge],
      });

      expect(result[0]?.reasoning).toContain('1 experiment');
    });

    it('should rank suggestions by score descending', () => {
      const highConfidenceSetup: GraphNodeRecord = {
        ...setupNode,
        id: 'setup-2',
        title: 'Rear spring',
      };
      const highEdge: GraphEdgeRecord = {
        ...setupToSymptomEdge,
        id: 'edge-high',
        sourceNodeId: 'setup-2',
        confidence: 'high',
        evidenceType: 'repeated-test',
      };

      const result = engine.getSuggestions({
        symptomLabel: 'Lazy rotation',
        phase: 'entry',
        nodes: [setupNode, highConfidenceSetup, symptomNode],
        edges: [setupToSymptomEdge, highEdge],
      });

      expect(result).toHaveLength(2);
      expect(result[0]?.title).toBe('Rear spring');
      expect(result[1]?.title).toBe('Rear camber link');
    });

    it('should filter by phase tag when symptom node has phase restrictions', () => {
      const exitSymptomNode: GraphNodeRecord = {
        ...symptomNode,
        id: 'symptom-exit',
        phaseTags: ['exit'],
      };
      const exitEdge: GraphEdgeRecord = {
        ...setupToSymptomEdge,
        id: 'edge-exit',
        targetNodeId: 'symptom-exit',
      };

      const result = engine.getSuggestions({
        symptomLabel: 'Lazy rotation',
        phase: 'entry',
        nodes: [setupNode, exitSymptomNode],
        edges: [exitEdge],
      });

      expect(result).toHaveLength(0);
    });

    it('should match symptom nodes with empty phaseTags against any phase', () => {
      const untaggedSymptom: GraphNodeRecord = {
        ...symptomNode,
        id: 'symptom-untagged',
        phaseTags: [],
      };
      const untaggedEdge: GraphEdgeRecord = {
        ...setupToSymptomEdge,
        id: 'edge-untagged',
        targetNodeId: 'symptom-untagged',
      };

      const result = engine.getSuggestions({
        symptomLabel: 'Lazy rotation',
        phase: 'bumps',
        nodes: [setupNode, untaggedSymptom],
        edges: [untaggedEdge],
      });

      expect(result).toHaveLength(1);
    });
  });

  describe('getExperimentHistory', () => {
    it('should return an empty array when no experiment nodes exist', () => {
      const result = engine.getExperimentHistory([setupNode, symptomNode], []);

      expect(result).toHaveLength(0);
    });

    it('should return experiment entries with linked outcome titles', () => {
      const result = engine.getExperimentHistory(
        [experimentNode, outcomeNode],
        [experimentToOutcomeEdge],
      );

      expect(result).toHaveLength(1);
      expect(result[0]?.title).toBe('Raised rear camber link +1mm');
      expect(result[0]?.outcome).toBe('More steering on entry');
    });

    it('should return "No outcome recorded" when no outcome edge exists', () => {
      const result = engine.getExperimentHistory([experimentNode], []);

      expect(result[0]?.outcome).toBe('No outcome recorded');
    });
  });

  describe('getHighlightSet', () => {
    it('should return empty sets when no matching symptom nodes exist', () => {
      const result = engine.getHighlightSet({
        symptomLabel: 'Entry push',
        phase: 'entry',
        nodes: [setupNode, symptomNode],
        edges: [setupToSymptomEdge],
      });

      expect(result.symptomNodeIds).toHaveLength(0);
      expect(result.setupNodeIds).toHaveLength(0);
    });

    it('should include symptom and setup nodes in highlight set', () => {
      const result = engine.getHighlightSet({
        symptomLabel: 'Lazy rotation',
        phase: 'entry',
        nodes: [setupNode, symptomNode],
        edges: [setupToSymptomEdge],
      });

      expect(result.symptomNodeIds).toContain('symptom-1');
      expect(result.setupNodeIds).toContain('setup-1');
      expect(result.edgeIds).toContain('edge-1');
    });

    it('should include outcome nodes when symptom is connected to outcomes', () => {
      const result = engine.getHighlightSet({
        symptomLabel: 'Lazy rotation',
        phase: 'entry',
        nodes: [setupNode, symptomNode, outcomeNode],
        edges: [setupToSymptomEdge, symptomToOutcomeEdge],
      });

      expect(result.outcomeNodeIds).toContain('outcome-1');
      expect(result.edgeIds).toContain('edge-2');
    });

    it('should include experiment nodes linked to matching setup nodes', () => {
      const result = engine.getHighlightSet({
        symptomLabel: 'Lazy rotation',
        phase: 'entry',
        nodes: [setupNode, symptomNode, experimentNode],
        edges: [setupToSymptomEdge, experimentToSetupEdge],
      });

      expect(result.experimentNodeIds).toContain('exp-1');
    });
  });

  describe('computeUpdatedConfidence', () => {
    it('should nudge confidence up on improved result', () => {
      expect(engine.computeUpdatedConfidence('low', 'improved')).toBe('medium');
      expect(engine.computeUpdatedConfidence('medium', 'improved')).toBe('high');
    });

    it('should cap confidence at high', () => {
      expect(engine.computeUpdatedConfidence('high', 'improved')).toBe('high');
    });

    it('should nudge confidence down on worsened result', () => {
      expect(engine.computeUpdatedConfidence('high', 'worsened')).toBe('medium');
      expect(engine.computeUpdatedConfidence('medium', 'worsened')).toBe('low');
    });

    it('should floor confidence at low', () => {
      expect(engine.computeUpdatedConfidence('low', 'worsened')).toBe('low');
    });

    it('should leave confidence unchanged on neutral result', () => {
      expect(engine.computeUpdatedConfidence('medium', 'neutral')).toBe('medium');
    });
  });
});
