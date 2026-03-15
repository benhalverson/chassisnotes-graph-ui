import { isPlatformBrowser } from '@angular/common';
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { assertValidGraphDocument } from '../../../features/diagram/data-access/relationship-rules';
import { GraphJsonIo } from '../../../features/import-export/data-access/graph-json-io';
import { ImportValidator } from '../../../features/import-export/data-access/import-validator';
import { TemplatesCatalog } from '../../../features/templates/data-access/templates-catalog';
import type {
  GraphEdgeRecord,
  GraphExportPayload,
  GraphNodeRecord,
  GraphRecord,
  PersistedGraphDocument,
  TemplateRecord,
} from '../../models/graph.models';
import { GRAPH_SCHEMA_VERSION } from '../../models/graph.models';
import { AppDb } from '../app-db';
import { EdgesRepository } from './edges-repository';
import { NodesRepository } from './nodes-repository';

@Injectable({
  providedIn: 'root',
})
export class GraphsRepository {
  private readonly db = inject(AppDb);
  private readonly nodesRepository = inject(NodesRepository);
  private readonly edgesRepository = inject(EdgesRepository);
  private readonly templatesCatalog = inject(TemplatesCatalog);
  private readonly graphJsonIo = inject(GraphJsonIo);
  private readonly importValidator = inject(ImportValidator);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private seedPromise?: Promise<void>;

  async listGraphs(): Promise<GraphRecord[]> {
    if (!this.isBrowser) {
      return [];
    }

    await this.ensureTemplatesSeeded();

    return this.db.graphs.orderBy('updatedAt').reverse().toArray();
  }

  async listTemplates(): Promise<TemplateRecord[]> {
    if (!this.isBrowser) {
      return this.templatesCatalog.all();
    }

    await this.ensureTemplatesSeeded();

    return this.db.templates.orderBy('name').toArray();
  }

  async createGraphFromTemplate(templateId: string): Promise<GraphRecord> {
    const template = await this.getTemplateOrThrow(templateId);
    const timestamp = new Date().toISOString();
    const graphId = createId('graph');
    const nodeIdMap = new Map(
      template.graphData.nodes.map((node) => [node.id, createId('node')]),
    );

    const graph: GraphRecord = {
      id: graphId,
      name: template.graphData.graph.name,
      slug: createSlug(
        `${template.graphData.graph.name}-${graphId.slice(0, 8)}`,
      ),
      chassis: template.graphData.graph.chassis,
      classType: template.graphData.graph.classType,
      surface: template.graphData.graph.surface,
      notes: template.graphData.graph.notes,
      templateId: template.id,
      createdAt: timestamp,
      updatedAt: timestamp,
      version: GRAPH_SCHEMA_VERSION,
    };

    const nodes: GraphNodeRecord[] = template.graphData.nodes.map((node) => ({
      ...node,
      id: nodeIdMap.get(node.id) ?? createId('node'),
      graphId,
      createdAt: timestamp,
      updatedAt: timestamp,
    }));

    const edges: GraphEdgeRecord[] = template.graphData.edges.map((edge) => ({
      ...edge,
      id: createId('edge'),
      graphId,
      sourceNodeId: nodeIdMap.get(edge.sourceNodeId) ?? edge.sourceNodeId,
      targetNodeId: nodeIdMap.get(edge.targetNodeId) ?? edge.targetNodeId,
      createdAt: timestamp,
      updatedAt: timestamp,
    }));

    assertValidGraphDocument({ graph, nodes, edges });

    await this.db.transaction(
      'rw',
      this.db.graphs,
      this.db.nodes,
      this.db.edges,
      async () => {
        await this.db.graphs.put(graph);
        await this.nodesRepository.bulkPut(nodes);
        await this.edgesRepository.bulkPut(edges);
      },
    );

    return graph;
  }

  async duplicateGraph(graphId: string): Promise<GraphRecord> {
    const source = await this.loadGraph(graphId);

    if (!source) {
      throw new Error('Graph not found.');
    }

    const timestamp = new Date().toISOString();
    const duplicateGraphId = createId('graph');
    const nodeIdMap = new Map(
      source.nodes.map((node) => [node.id, createId('node')]),
    );

    const graph: GraphRecord = {
      ...source.graph,
      id: duplicateGraphId,
      name: `${source.graph.name} Copy`,
      slug: createSlug(
        `${source.graph.name}-copy-${duplicateGraphId.slice(0, 8)}`,
      ),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const nodes = source.nodes.map((node) => ({
      ...node,
      id: nodeIdMap.get(node.id) ?? createId('node'),
      graphId: duplicateGraphId,
      createdAt: timestamp,
      updatedAt: timestamp,
    }));

    const edges = source.edges.map((edge) => ({
      ...edge,
      id: createId('edge'),
      graphId: duplicateGraphId,
      sourceNodeId: nodeIdMap.get(edge.sourceNodeId) ?? edge.sourceNodeId,
      targetNodeId: nodeIdMap.get(edge.targetNodeId) ?? edge.targetNodeId,
      createdAt: timestamp,
      updatedAt: timestamp,
    }));

    assertValidGraphDocument({ graph, nodes, edges });

    await this.db.transaction(
      'rw',
      this.db.graphs,
      this.db.nodes,
      this.db.edges,
      async () => {
        await this.db.graphs.put(graph);
        await this.nodesRepository.bulkPut(nodes);
        await this.edgesRepository.bulkPut(edges);
      },
    );

    return graph;
  }

  async deleteGraph(graphId: string): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    await this.db.transaction(
      'rw',
      this.db.graphs,
      this.db.nodes,
      this.db.edges,
      async () => {
        await this.edgesRepository.deleteByGraphId(graphId);
        await this.nodesRepository.deleteByGraphId(graphId);
        await this.db.graphs.delete(graphId);
      },
    );
  }

  async loadGraph(graphId: string): Promise<PersistedGraphDocument | null> {
    if (!this.isBrowser) {
      return null;
    }

    await this.ensureTemplatesSeeded();

    const graph = await this.db.graphs.get(graphId);

    if (!graph) {
      return null;
    }

    const [nodes, edges] = await Promise.all([
      this.nodesRepository.listByGraphId(graphId),
      this.edgesRepository.listByGraphId(graphId),
    ]);

    return { graph, nodes, edges };
  }

  async saveGraphDocument(
    document: PersistedGraphDocument,
  ): Promise<GraphRecord> {
    if (!this.isBrowser) {
      return document.graph;
    }

    const timestamp = new Date().toISOString();
    const graph: GraphRecord = {
      ...document.graph,
      updatedAt: timestamp,
    };
    const nodes: GraphNodeRecord[] = document.nodes.map((node) => ({
      ...node,
      graphId: graph.id,
    }));
    const edges: GraphEdgeRecord[] = document.edges.map((edge) => ({
      ...edge,
      graphId: graph.id,
    }));

    assertValidGraphDocument({ graph, nodes, edges });

    await this.db.transaction(
      'rw',
      this.db.graphs,
      this.db.nodes,
      this.db.edges,
      async () => {
        await this.db.graphs.put(graph);
        await this.nodesRepository.replaceForGraph(graph.id, nodes);
        await this.edgesRepository.replaceForGraph(graph.id, edges);
      },
    );

    return graph;
  }

  async exportGraph(graphId: string): Promise<GraphExportPayload | null> {
    const document = await this.loadGraph(graphId);

    if (!document) {
      return null;
    }

    return this.graphJsonIo.toExportPayload(document);
  }

  async importGraph(candidate: unknown): Promise<GraphRecord> {
    const importedDocument = this.importValidator.prepareImport(candidate);

    if (!this.isBrowser) {
      return importedDocument.graph;
    }

    assertValidGraphDocument(importedDocument);

    await this.db.transaction(
      'rw',
      this.db.graphs,
      this.db.nodes,
      this.db.edges,
      async () => {
        await this.db.graphs.put(importedDocument.graph);
        await this.nodesRepository.bulkPut(importedDocument.nodes);
        await this.edgesRepository.bulkPut(importedDocument.edges);
      },
    );

    return importedDocument.graph;
  }

  private async ensureTemplatesSeeded(): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    this.seedPromise ??= this.seedTemplates();
    await this.seedPromise;
  }

  private async seedTemplates(): Promise<void> {
    const templateCount = await this.db.templates.count();

    if (templateCount > 0) {
      return;
    }

    await this.db.templates.bulkPut(this.templatesCatalog.all());
  }

  private async getTemplateOrThrow(
    templateId: string,
  ): Promise<TemplateRecord> {
    if (!this.isBrowser) {
      const template = this.templatesCatalog.getById(templateId);

      if (!template) {
        throw new Error('Template not found.');
      }

      return template;
    }

    await this.ensureTemplatesSeeded();

    const template =
      (await this.db.templates.get(templateId)) ??
      this.templatesCatalog.getById(templateId);

    if (!template) {
      throw new Error('Template not found.');
    }

    return template;
  }
}

function createId(prefix: string): string {
  const randomValue =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${prefix}-${randomValue}`;
}

function createSlug(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'graph';
}
