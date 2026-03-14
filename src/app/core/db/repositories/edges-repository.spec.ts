import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';
import Dexie from 'dexie';
import { IDBKeyRange, indexedDB } from 'fake-indexeddb';
import type { GraphEdgeRecord } from '../../models/graph.models';
import { AppDb } from '../app-db';
import { EdgesRepository } from './edges-repository';

describe('EdgesRepository', () => {
  let service: EdgesRepository;
  let db: AppDb;

  const edges: GraphEdgeRecord[] = [
    {
      id: 'edge-1',
      graphId: 'graph-1',
      sourceNodeId: 'node-1',
      targetNodeId: 'node-2',
      relationshipType: 'can reduce',
      label: 'can reduce',
      description: 'Setup may reduce symptom.',
      confidence: 'medium',
      phaseTags: ['entry'],
      evidenceType: 'theory',
      createdAt: '2026-03-14T00:00:00.000Z',
      updatedAt: '2026-03-14T00:00:00.000Z',
    },
    {
      id: 'edge-2',
      graphId: 'graph-1',
      sourceNodeId: 'node-2',
      targetNodeId: 'node-3',
      relationshipType: 'observed',
      label: 'observed',
      description: 'Observed outcome from experiment.',
      confidence: 'high',
      phaseTags: ['exit'],
      evidenceType: 'observed',
      createdAt: '2026-03-14T00:00:00.000Z',
      updatedAt: '2026-03-14T00:00:00.000Z',
    },
  ];

  beforeAll(() => {
    Dexie.dependencies.indexedDB = indexedDB;
    Dexie.dependencies.IDBKeyRange = IDBKeyRange;
  });

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EdgesRepository);
    db = TestBed.inject(AppDb);
  });

  afterEach(async () => {
    await db.edges.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should list edges for a graph', async () => {
    await db.edges.bulkPut(edges);

    await expect(service.listByGraphId('graph-1')).resolves.toEqual(edges);
  });

  it('should replace edges for a graph', async () => {
    await db.edges.put(edges[0]);

    await service.replaceForGraph('graph-1', [edges[1]]);

    await expect(service.listByGraphId('graph-1')).resolves.toEqual([edges[1]]);
  });

  it('should delete edges for a graph', async () => {
    await db.edges.bulkPut(edges);

    await service.deleteByGraphId('graph-1');

    await expect(service.listByGraphId('graph-1')).resolves.toEqual([]);
  });
});
