import { TestBed } from '@angular/core/testing';
import type { GraphExportPayload } from '../../../core/models/graph.models';

import { ImportValidator } from './import-validator';

describe('ImportValidator', () => {
  let service: ImportValidator;
  const payload: GraphExportPayload = {
    schemaVersion: 1,
    exportTimestamp: '2026-03-14T12:00:00.000Z',
    graph: {
      id: 'graph-1',
      name: 'Baseline map',
      slug: 'baseline-map',
      chassis: 'Associated B7',
      classType: '2wd-buggy',
      surface: 'carpet',
      notes: 'Baseline notes',
      createdAt: '2026-03-14T00:00:00.000Z',
      updatedAt: '2026-03-14T00:00:00.000Z',
      version: 1,
    },
    nodes: [
      {
        id: 'node-1',
        graphId: 'graph-1',
        type: 'setup',
        subtype: 'rear-oil',
        title: 'Rear oil 32.5wt',
        description: 'Baseline setup node.',
        tags: ['shocks'],
        phaseTags: ['mid'],
        confidence: 'medium',
        position: { x: 10, y: 20 },
        data: { category: 'Setup' },
        createdAt: '2026-03-14T00:00:00.000Z',
        updatedAt: '2026-03-14T00:00:00.000Z',
      },
      {
        id: 'node-2',
        graphId: 'graph-1',
        type: 'symptom',
        subtype: 'rotation',
        title: 'Lazy rotation',
        description: 'Handling symptom.',
        tags: ['rotation'],
        phaseTags: ['entry'],
        confidence: 'medium',
        position: { x: 200, y: 40 },
        data: { category: 'Symptom' },
        createdAt: '2026-03-14T00:00:00.000Z',
        updatedAt: '2026-03-14T00:00:00.000Z',
      },
    ],
    edges: [
      {
        id: 'edge-1',
        graphId: 'graph-1',
        sourceNodeId: 'node-1',
        targetNodeId: 'node-2',
        relationshipType: 'can reduce',
        label: 'can reduce',
        description: 'Valid relationship.',
        confidence: 'medium',
        phaseTags: ['entry'],
        evidenceType: 'theory',
        createdAt: '2026-03-14T00:00:00.000Z',
        updatedAt: '2026-03-14T00:00:00.000Z',
      },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImportValidator);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should validate a supported export payload', () => {
    const result = service.validate(payload);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.payload).toEqual(payload);
  });

  it('should regenerate ids and timestamps when preparing an import', () => {
    const imported = service.prepareImport(payload, '2026-03-15T00:00:00.000Z');

    expect(imported.graph.id).not.toBe(payload.graph.id);
    expect(imported.graph.name).toBe('Baseline map Imported');
    expect(imported.graph.createdAt).toBe('2026-03-15T00:00:00.000Z');
    expect(imported.nodes.every((node) => node.graphId === imported.graph.id)).toBe(true);
    expect(imported.edges[0]?.sourceNodeId).toBe(imported.nodes[0]?.id);
    expect(imported.edges[0]?.targetNodeId).toBe(imported.nodes[1]?.id);
  });

  it('should reject unsupported schema versions', () => {
    const result = service.validate({
      ...payload,
      schemaVersion: 2,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.join('\n')).toContain('Unsupported schema version');
  });

  it('should reject malformed edge references', () => {
    const result = service.validate({
      ...payload,
      edges: [
        {
          ...payload.edges[0],
          targetNodeId: 'missing-node',
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.errors.join('\n')).toContain('Target node not found');
  });
});
