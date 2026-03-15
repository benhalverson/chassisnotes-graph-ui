import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';
import Dexie from 'dexie';
import { IDBKeyRange, indexedDB } from 'fake-indexeddb';
import type { GraphExportPayload } from '../../models/graph.models';

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
      db.preferences.clear(),
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
    await expect(service.getActiveGraphId()).resolves.toBe(graph.id);
  });

  it('should resolve and load the active graph', async () => {
    const olderGraph = await service.createGraphFromTemplate(
      'template-2wd-buggy-carpet-baseline',
    );
    const activeGraph = await service.createGraphFromTemplate(
      'template-symptom-driven-troubleshooting',
    );

    await service.setActiveGraphId(olderGraph.id);

    await expect(service.resolveActiveGraphId()).resolves.toBe(olderGraph.id);
    await expect(service.loadActiveGraph()).resolves.toMatchObject({
      graph: { id: olderGraph.id },
    });

    await service.setActiveGraphId('missing-graph');

    await expect(service.resolveActiveGraphId()).resolves.toBe(activeGraph.id);
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

  it('should persist graph document replacements and refresh updatedAt', async () => {
    const graph = await service.createGraphFromTemplate(
      'template-2wd-buggy-carpet-baseline',
    );
    const source = await service.loadGraph(graph.id);

    expect(source).not.toBeNull();

    if (!source) {
      throw new Error('Expected a saved graph document.');
    }

    const node = source.nodes[0];

    expect(node).toBeDefined();

    await service.saveGraphDocument({
      graph: source.graph,
      nodes: source.nodes.map((entry, index) =>
        index === 0
          ? {
              ...entry,
              title: 'Updated setup lever',
            }
          : entry,
      ),
      edges: [],
    });

    const saved = await service.loadGraph(graph.id);

    expect(saved?.nodes).toHaveLength(source.nodes.length);
    expect(saved?.edges).toHaveLength(0);
    expect(saved?.nodes[0]?.title).toBe('Updated setup lever');
    expect(saved?.graph.updatedAt).not.toBe(source.graph.updatedAt);
  });

  it('should export a persisted graph as a versioned payload', async () => {
    const graph = await service.createGraphFromTemplate(
      'template-2wd-buggy-carpet-baseline',
    );

    const exported = await service.exportGraph(graph.id);

    expect(exported?.schemaVersion).toBe(1);
    expect(exported?.graph.id).toBe(graph.id);
    expect(exported?.nodes.length).toBeGreaterThan(0);
    expect(exported?.edges.length).toBeGreaterThan(0);
    expect(exported?.exportTimestamp).toMatch(/^2026|^20/);
  });

  it('should import an exported graph as a new persisted copy', async () => {
    const graph = await service.createGraphFromTemplate(
      'template-2wd-buggy-carpet-baseline',
    );
    const exported = await service.exportGraph(graph.id);

    expect(exported).not.toBeNull();

    if (!exported) {
      throw new Error('Expected an export payload.');
    }

    const importedGraph = await service.importGraph(
      exported satisfies GraphExportPayload,
    );
    const importedDocument = await service.loadGraph(importedGraph.id);

    expect(importedGraph.id).not.toBe(graph.id);
    expect(importedGraph.name).toContain('Imported');
    expect(importedDocument?.nodes.length).toBe(exported.nodes.length);
    expect(importedDocument?.edges.length).toBe(exported.edges.length);
    expect(
      importedDocument?.nodes.some((node) =>
        exported.nodes.some((exportedNode) => exportedNode.id === node.id),
      ),
    ).toBe(false);
  });

  it('should reject invalid edge directions when saving a graph document', async () => {
    const graph = await service.createGraphFromTemplate(
      'template-2wd-buggy-carpet-baseline',
    );
    const source = await service.loadGraph(graph.id);

    expect(source).not.toBeNull();

    if (!source) {
      throw new Error('Expected a saved graph document.');
    }

    const setupNode = source.nodes.find((node) => node.type === 'setup');
    const symptomNode = source.nodes.find((node) => node.type === 'symptom');

    expect(setupNode).toBeDefined();
    expect(symptomNode).toBeDefined();

    await expect(
      service.saveGraphDocument({
        graph: source.graph,
        nodes: source.nodes,
        edges: [
          {
            id: 'edge-invalid',
            graphId: source.graph.id,
            sourceNodeId: symptomNode?.id ?? 'missing-source',
            targetNodeId: setupNode?.id ?? 'missing-target',
            relationshipType: 'observed',
            label: 'observed',
            description: 'Invalid reverse direction for regression coverage.',
            confidence: 'medium',
            phaseTags: ['entry'],
            evidenceType: 'observed',
            createdAt: '2026-03-14T00:00:00.000Z',
            updatedAt: '2026-03-14T00:00:00.000Z',
          },
        ],
      }),
    ).rejects.toThrowError(
      /Connections from symptom to setup are not allowed./,
    );
  });
});
