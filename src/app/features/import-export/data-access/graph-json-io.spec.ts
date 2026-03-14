import { TestBed } from '@angular/core/testing';
import type { PersistedGraphDocument } from '../../../core/models/graph.models';

import { GraphJsonIo } from './graph-json-io';

describe('GraphJsonIo', () => {
  let service: GraphJsonIo;
  const document: PersistedGraphDocument = {
    graph: {
      id: 'graph-1',
      name: 'Baseline Map',
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
    ],
    edges: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GraphJsonIo);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should build a stable export payload and stringify it', () => {
    const payload = service.toExportPayload(
      document,
      '2026-03-14T12:00:00.000Z',
    );

    expect(payload.schemaVersion).toBe(1);
    expect(payload.exportTimestamp).toBe('2026-03-14T12:00:00.000Z');
    expect(payload.graph).toEqual(document.graph);
    expect(service.stringify(payload)).toContain('"schemaVersion": 1');
  });

  it('should parse exported json and build a safe filename', () => {
    const payload = service.toExportPayload(document);
    const rawJson = service.stringify(payload);

    expect(service.parse(rawJson)).toEqual(payload);
    expect(
      service.buildFilename({ slug: '', name: 'Baseline Map / Copy' }),
    ).toBe('baseline-map-copy.json');
  });

  it('should reject invalid json input', () => {
    expect(() => service.parse('{invalid')).toThrowError(
      /does not contain valid JSON/i,
    );
  });
});
