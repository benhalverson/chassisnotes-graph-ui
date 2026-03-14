import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';
import Dexie from 'dexie';
import { IDBKeyRange, indexedDB } from 'fake-indexeddb';
import type { GraphNodeRecord } from '../../models/graph.models';
import { AppDb } from '../app-db';
import { NodesRepository } from './nodes-repository';

describe('NodesRepository', () => {
  let service: NodesRepository;
  let db: AppDb;

  const nodes: GraphNodeRecord[] = [
    {
      id: 'node-1',
      graphId: 'graph-1',
      type: 'setup',
      subtype: 'rear-oil',
      title: 'Rear oil 32.5wt',
      description: 'Rear damping change.',
      tags: ['shocks'],
      phaseTags: ['mid'],
      confidence: 'medium',
      position: { x: 10, y: 20 },
      data: {},
      createdAt: '2026-03-14T00:00:00.000Z',
      updatedAt: '2026-03-14T00:00:00.000Z',
    },
    {
      id: 'node-2',
      graphId: 'graph-1',
      type: 'symptom',
      subtype: 'rotation',
      title: 'Lazy rotation',
      description: 'Entry steering issue.',
      tags: ['rotation'],
      phaseTags: ['entry'],
      confidence: 'high',
      position: { x: 50, y: 80 },
      data: {},
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
    service = TestBed.inject(NodesRepository);
    db = TestBed.inject(AppDb);
  });

  afterEach(async () => {
    await db.nodes.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should list nodes for a graph', async () => {
    await db.nodes.bulkPut(nodes);

    await expect(service.listByGraphId('graph-1')).resolves.toEqual(nodes);
  });

  it('should replace nodes for a graph', async () => {
    await db.nodes.put(nodes[0]);

    await service.replaceForGraph('graph-1', [nodes[1]]);

    await expect(service.listByGraphId('graph-1')).resolves.toEqual([nodes[1]]);
  });

  it('should delete nodes for a graph', async () => {
    await db.nodes.bulkPut(nodes);

    await service.deleteByGraphId('graph-1');

    await expect(service.listByGraphId('graph-1')).resolves.toEqual([]);
  });
});
