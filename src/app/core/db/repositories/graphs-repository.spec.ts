import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';
import Dexie from 'dexie';
import { IDBKeyRange, indexedDB } from 'fake-indexeddb';

import { AppDb } from '../app-db';
import { GraphsRepository } from './graphs-repository';

describe('GraphsRepository', () => {
  let service: GraphsRepository;
  let db: AppDb;

  beforeAll(() => {
    Dexie.dependencies.indexedDB = indexedDB;
    Dexie.dependencies.IDBKeyRange = IDBKeyRange;
  });

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GraphsRepository);
    db = TestBed.inject(AppDb);
  });

  afterEach(async () => {
    await Promise.all([
      db.graphs.clear(),
      db.nodes.clear(),
      db.edges.clear(),
      db.templates.clear(),
    ]);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should seed and list starter templates', async () => {
    const templates = await service.listTemplates();

    expect(templates.length).toBe(2);
    expect(templates.map((template) => template.name)).toEqual([
      '2WD Buggy Carpet Baseline',
      'Symptom-Driven Troubleshooting Map',
    ]);
  });

  it('should create and load a graph from a starter template', async () => {
    const graph = await service.createGraphFromTemplate(
      'template-2wd-buggy-carpet-baseline',
    );
    const loadedGraph = await service.loadGraph(graph.id);

    expect(graph.templateId).toBe('template-2wd-buggy-carpet-baseline');
    expect(loadedGraph?.graph.id).toBe(graph.id);
    expect(loadedGraph?.nodes.length).toBeGreaterThan(0);
    expect(loadedGraph?.edges.length).toBeGreaterThan(0);
  });

  it('should duplicate a graph with new graph, node, and edge ids', async () => {
    const original = await service.createGraphFromTemplate(
      'template-2wd-buggy-carpet-baseline',
    );
    const duplicate = await service.duplicateGraph(original.id);
    const [originalDocument, duplicateDocument] = await Promise.all([
      service.loadGraph(original.id),
      service.loadGraph(duplicate.id),
    ]);

    expect(duplicate.id).not.toBe(original.id);
    expect(duplicate.name).toContain('Copy');
    expect(duplicateDocument?.nodes.length).toBe(
      originalDocument?.nodes.length ?? 0,
    );
    expect(duplicateDocument?.edges.length).toBe(
      originalDocument?.edges.length ?? 0,
    );
    expect(
      duplicateDocument?.nodes.some((node) =>
        originalDocument?.nodes.some((sourceNode) => sourceNode.id === node.id),
      ),
    ).toBeFalsy();
  });

  it('should delete a graph and cascade its nodes and edges', async () => {
    const graph = await service.createGraphFromTemplate(
      'template-symptom-driven-troubleshooting',
    );

    await service.deleteGraph(graph.id);

    await expect(service.loadGraph(graph.id)).resolves.toBeNull();
    await expect(
      db.nodes.where('graphId').equals(graph.id).count(),
    ).resolves.toBe(0);
    await expect(
      db.edges.where('graphId').equals(graph.id).count(),
    ).resolves.toBe(0);
  });
});
