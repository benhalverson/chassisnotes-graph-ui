import { TestBed } from '@angular/core/testing';

import type { PersistedGraphDocument } from '../../../core/models/graph.models';
import {
  assertValidGraphDocument,
  RelationshipRules,
  validateRelationshipConnection,
} from './relationship-rules';

describe('RelationshipRules', () => {
  let service: RelationshipRules;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RelationshipRules);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should allow documented condition to setup connections', () => {
    expect(
      service.validateConnection({
        sourceType: 'condition',
        targetType: 'setup',
        relationshipType: 'influences',
        label: 'influences',
        sourceNodeId: 'node-condition',
        targetNodeId: 'node-setup',
      }),
    ).toEqual({
      valid: true,
      errors: [],
      allowedRelationshipTypes: [
        'can increase',
        'can reduce',
        'influences',
        'tested',
        'observed',
        'tradeoff',
        'depends on',
      ],
    });
  });

  it('should reject disallowed symptom to symptom connections', () => {
    const result = validateRelationshipConnection({
      sourceType: 'symptom',
      targetType: 'symptom',
      relationshipType: 'influences',
      label: 'influences',
      sourceNodeId: 'node-a',
      targetNodeId: 'node-b',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Connections from symptom to symptom are not allowed.',
    );
  });

  it('should allow outcome to symptom only as a tradeoff', () => {
    const invalidResult = service.validateConnection({
      sourceType: 'outcome',
      targetType: 'symptom',
      relationshipType: 'observed',
      label: 'observed',
      sourceNodeId: 'node-outcome',
      targetNodeId: 'node-symptom',
    });

    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors).toContain(
      'Relationship type observed is not allowed for outcome → symptom.',
    );

    const validResult = service.validateConnection({
      sourceType: 'outcome',
      targetType: 'symptom',
      relationshipType: 'tradeoff',
      label: 'tradeoff',
      sourceNodeId: 'node-outcome',
      targetNodeId: 'node-symptom',
    });

    expect(validResult.valid).toBe(true);
    expect(validResult.allowedRelationshipTypes).toEqual(['tradeoff']);
  });

  it('should reject malformed graph documents', () => {
    const document: PersistedGraphDocument = {
      graph: {
        id: 'graph-1',
        name: 'Broken graph',
        slug: 'broken-graph',
        chassis: 'Associated B7',
        classType: '2wd-buggy',
        surface: 'carpet',
        notes: '',
        createdAt: '2026-03-14T00:00:00.000Z',
        updatedAt: '2026-03-14T00:00:00.000Z',
        version: 1,
      },
      nodes: [
        {
          id: 'node-1',
          graphId: 'graph-1',
          type: 'setup',
          subtype: 'camber-link',
          title: 'Rear link',
          description: '',
          tags: [],
          phaseTags: ['entry'],
          confidence: 'medium',
          position: { x: 0, y: 0 },
          data: {},
          createdAt: '2026-03-14T00:00:00.000Z',
          updatedAt: '2026-03-14T00:00:00.000Z',
        },
        {
          id: 'node-2',
          graphId: 'graph-1',
          type: 'symptom',
          subtype: 'rotation',
          title: '',
          description: '',
          tags: [],
          phaseTags: ['entry'],
          confidence: 'medium',
          position: { x: 100, y: 0 },
          data: {},
          createdAt: '2026-03-14T00:00:00.000Z',
          updatedAt: '2026-03-14T00:00:00.000Z',
        },
      ],
      edges: [
        {
          id: 'edge-1',
          graphId: 'graph-1',
          sourceNodeId: 'node-2',
          targetNodeId: 'node-1',
          relationshipType: 'observed',
          label: 'freeform',
          description: '',
          confidence: 'medium',
          phaseTags: ['entry'],
          evidenceType: 'observed',
          createdAt: '2026-03-14T00:00:00.000Z',
          updatedAt: '2026-03-14T00:00:00.000Z',
        },
      ],
    };

    expect(() => assertValidGraphDocument(document)).toThrowError(
      /Node title is required.|Connections from symptom to setup are not allowed.|Unknown relationship label: freeform./,
    );
  });
});
