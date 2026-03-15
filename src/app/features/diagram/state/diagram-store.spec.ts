import { TestBed } from '@angular/core/testing';
import { GraphsRepository } from '../../../core/db/repositories/graphs-repository';
import type {
  GraphEdgeRecord,
  GraphNodeRecord,
  GraphRecord,
  PersistedGraphDocument,
} from '../../../core/models/graph.models';
import { DiagramStore } from './diagram-store';

describe('DiagramStore', () => {
  let service: InstanceType<typeof DiagramStore>;

  const graph: GraphRecord = {
    id: 'graph-1',
    name: 'Baseline map',
    slug: 'baseline-map',
    chassis: 'Associated B7',
    classType: '2wd-buggy',
    surface: 'carpet',
    notes: 'Test graph',
    templateId: 'template-1',
    createdAt: '2026-03-14T00:00:00.000Z',
    updatedAt: '2026-03-14T00:00:00.000Z',
    version: 1,
  };

  const nodes: GraphNodeRecord[] = [
    {
      id: 'node-1',
      graphId: 'graph-1',
      type: 'setup',
      subtype: 'suspension',
      title: 'Front spring',
      description: 'Baseline front spring choice.',
      tags: [],
      phaseTags: ['entry'],
      confidence: 'medium',
      position: { x: 100, y: 120 },
      data: {},
      createdAt: '2026-03-14T00:00:00.000Z',
      updatedAt: '2026-03-14T00:00:00.000Z',
    },
    {
      id: 'node-2',
      graphId: 'graph-1',
      type: 'symptom',
      subtype: 'handling',
      title: 'Entry push',
      description: 'Car hesitates on initial turn-in.',
      tags: [],
      phaseTags: ['entry'],
      confidence: 'medium',
      position: { x: 420, y: 120 },
      data: {},
      createdAt: '2026-03-14T00:00:00.000Z',
      updatedAt: '2026-03-14T00:00:00.000Z',
    },
  ];

  const edges: GraphEdgeRecord[] = [
    {
      id: 'edge-1',
      graphId: 'graph-1',
      sourceNodeId: 'node-1',
      targetNodeId: 'node-2',
      relationshipType: 'can reduce',
      label: 'can reduce',
      description: 'Baseline relationship',
      confidence: 'medium',
      phaseTags: ['entry'],
      evidenceType: 'theory',
      createdAt: '2026-03-14T00:00:00.000Z',
      updatedAt: '2026-03-14T00:00:00.000Z',
    },
  ];

  const document: PersistedGraphDocument = {
    graph,
    nodes,
    edges,
  };

  const graphsRepositorySpy = {
    loadGraph:
      vi.fn<(graphId: string) => Promise<PersistedGraphDocument | null>>(),
    saveGraphDocument:
      vi.fn<(nextDocument: PersistedGraphDocument) => Promise<GraphRecord>>(),
  } satisfies Pick<GraphsRepository, 'loadGraph' | 'saveGraphDocument'>;

  beforeEach(() => {
    graphsRepositorySpy.loadGraph.mockReset();
    graphsRepositorySpy.saveGraphDocument.mockReset();

    graphsRepositorySpy.loadGraph.mockResolvedValue(structuredClone(document));
    graphsRepositorySpy.saveGraphDocument.mockImplementation(
      async (nextDocument) => ({
        ...nextDocument.graph,
        updatedAt: '2026-03-15T00:00:00.000Z',
      }),
    );

    TestBed.configureTestingModule({
      providers: [{ provide: GraphsRepository, useValue: graphsRepositorySpy }],
    });
    service = TestBed.inject(DiagramStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load a persisted graph into editable store state', async () => {
    await service.loadGraph(graph.id);

    expect(graphsRepositorySpy.loadGraph).toHaveBeenCalledWith(graph.id);
    expect(service.graph()).toEqual(graph);
    expect(service.nodes()).toEqual(nodes);
    expect(service.edges()).toEqual(edges);
    expect(service.error()).toBeNull();
  });

  it('should add a node and persist it immediately', async () => {
    await service.loadGraph(graph.id);

    const originalCount = service.nodes().length;

    await service.addNode('experiment');

    expect(service.nodes()).toHaveLength(originalCount + 1);
    expect(service.selectedNode()?.type).toBe('experiment');
    expect(graphsRepositorySpy.saveGraphDocument).toHaveBeenCalledTimes(1);
    expect(
      graphsRepositorySpy.saveGraphDocument.mock.calls[0]?.[0].nodes.at(-1)
        ?.type,
    ).toBe('experiment');
  });

  it('should update selected node fields and persist them', async () => {
    await service.loadGraph(graph.id);

    service.updateSelection(['node-2'], []);
    await service.updateNode('node-2', {
      title: 'Entry push under power',
      confidence: 'high',
      phaseTags: ['entry', 'on-power'],
    });

    expect(service.selectedNode()?.title).toBe('Entry push under power');
    expect(service.selectedNode()?.confidence).toBe('high');
    expect(service.selectedNode()?.phaseTags).toEqual(['entry', 'on-power']);
    expect(graphsRepositorySpy.saveGraphDocument).toHaveBeenCalledTimes(1);
    expect(
      graphsRepositorySpy.saveGraphDocument.mock.calls[0]?.[0].nodes.find(
        (node) => node.id === 'node-2',
      )?.title,
    ).toBe('Entry push under power');
  });

  it('should delete a selected node and remove connected edges', async () => {
    await service.loadGraph(graph.id);

    service.updateSelection(['node-1'], []);
    await service.deleteSelectedNode();

    expect(service.nodes().some((node) => node.id === 'node-1')).toBe(false);
    expect(service.edges().some((edge) => edge.id === 'edge-1')).toBe(false);
    expect(service.selectedNode()).toBeNull();
    expect(graphsRepositorySpy.saveGraphDocument).toHaveBeenCalledTimes(1);
  });

  it('should sync moved node positions back to persistence', async () => {
    await service.loadGraph(graph.id);

    await service.syncNodePositions([
      {
        id: 'node-1',
        position: { x: 220, y: 168 },
      },
    ]);

    expect(
      service.nodes().find((node) => node.id === 'node-1')?.position,
    ).toEqual({ x: 220, y: 168 });
    expect(graphsRepositorySpy.saveGraphDocument).toHaveBeenCalledTimes(1);
  });

  it('should create a valid edge and select it', async () => {
    await service.loadGraph(graph.id);

    const result = await service.createEdge('node-1', 'node-2', 'influences');

    expect(result).toBe(true);
    expect(service.edges()).toHaveLength(2);
    expect(service.selectedEdge()?.relationshipType).toBe('influences');
    expect(service.validationError()).toBeNull();
    expect(graphsRepositorySpy.saveGraphDocument).toHaveBeenCalledTimes(1);
  });

  it('should reject invalid edge directions without persisting', async () => {
    await service.loadGraph(graph.id);

    const result = await service.createEdge('node-2', 'node-1', 'observed');

    expect(result).toBe(false);
    expect(service.edges()).toHaveLength(1);
    expect(service.validationError()).toContain(
      'Connections from symptom to setup are not allowed.',
    );
    expect(graphsRepositorySpy.saveGraphDocument).not.toHaveBeenCalled();
  });

  it('should clear validation feedback after a successful selection change', async () => {
    await service.loadGraph(graph.id);
    await service.createEdge('node-2', 'node-1', 'observed');

    expect(service.validationError()).toContain(
      'Connections from symptom to setup are not allowed.',
    );

    service.updateSelection(['node-1'], []);

    expect(service.validationError()).toBeNull();
    expect(service.selectedNode()?.id).toBe('node-1');
  });

  it('should update selected edge metadata and persist it', async () => {
    await service.loadGraph(graph.id);

    service.updateSelection([], ['edge-1']);
    const result = await service.updateEdge('edge-1', {
      relationshipType: 'influences',
      label: 'influences',
      confidence: 'high',
      evidenceType: 'observed',
    });

    expect(result).toBe(true);
    expect(service.selectedEdge()?.relationshipType).toBe('influences');
    expect(service.selectedEdge()?.confidence).toBe('high');
    expect(service.selectedEdge()?.evidenceType).toBe('observed');
    expect(graphsRepositorySpy.saveGraphDocument).toHaveBeenCalledTimes(1);
  });

  it('should delete a selected edge', async () => {
    await service.loadGraph(graph.id);

    service.updateSelection([], ['edge-1']);
    await service.deleteSelectedEdge();

    expect(service.edges()).toHaveLength(0);
    expect(service.selectedEdge()).toBeNull();
    expect(graphsRepositorySpy.saveGraphDocument).toHaveBeenCalledTimes(1);
  });

  it('should derive dimmed and highlighted state from filters', async () => {
    await service.loadGraph(graph.id);

    service.toggleConfidenceFilter('high', true);

    expect(service.matchedNodeIds()).toEqual([]);
    expect(service.matchedEdgeIds()).toEqual([]);
    expect(service.dimmedNodeIds()).toEqual(['node-1', 'node-2']);
    expect(service.dimmedEdgeIds()).toEqual(['edge-1']);

    service.updateSelection(['node-1'], []);

    expect(service.highlightedNodeIds()).toContain('node-1');
    expect(service.highlightedNodeIds()).toContain('node-2');
    expect(service.highlightedEdgeIds()).toContain('edge-1');
  });

  it('should reset filters and validation state when loading a graph', async () => {
    await service.loadGraph(graph.id);

    service.toggleNodeTypeFilter('setup', true);
    await service.createEdge('node-2', 'node-1', 'observed');

    expect(service.filters().nodeTypes).toEqual(['setup']);
    expect(service.validationError()).not.toBeNull();

    await service.loadGraph(graph.id);

    expect(service.filters()).toEqual({
      nodeTypes: [],
      phaseTags: [],
      confidenceLevels: [],
      evidenceTypes: [],
      highlightSelectionNeighborhood: true,
    });
    expect(service.validationError()).toBeNull();
  });

  it('should set and clear symptom highlight node and edge IDs', async () => {
    await service.loadGraph(graph.id);

    service.setSymptomHighlight(['node-1', 'node-2'], ['edge-1']);

    expect(service.symptomHighlightNodeIds()).toEqual(['node-1', 'node-2']);
    expect(service.symptomHighlightEdgeIds()).toEqual(['edge-1']);

    service.clearSymptomHighlight();

    expect(service.symptomHighlightNodeIds()).toEqual([]);
    expect(service.symptomHighlightEdgeIds()).toEqual([]);
  });

  it('should include symptom highlight node IDs in the computed highlighted set', async () => {
    await service.loadGraph(graph.id);

    service.setSymptomHighlight(['node-1'], ['edge-1']);

    expect(service.highlightedNodeIds()).toContain('node-1');
    expect(service.highlightedEdgeIds()).toContain('edge-1');
  });

  it('should dim nodes not in the symptom highlight set when highlight is applied', async () => {
    await service.loadGraph(graph.id);

    service.setSymptomHighlight(['node-1'], []);

    expect(service.dimmedNodeIds()).toContain('node-2');
    expect(service.dimmedNodeIds()).not.toContain('node-1');
  });

  it('should update edge confidence upward on improved result', async () => {
    await service.loadGraph(graph.id);

    const result = await service.updateEdgeConfidence('edge-1', 'improved');

    expect(result).toBe(true);
    expect(service.edges().find((e) => e.id === 'edge-1')?.confidence).toBe('high');
    expect(graphsRepositorySpy.saveGraphDocument).toHaveBeenCalledTimes(1);
  });

  it('should update edge confidence downward on worsened result', async () => {
    await service.loadGraph(graph.id);

    const result = await service.updateEdgeConfidence('edge-1', 'worsened');

    expect(result).toBe(true);
    expect(service.edges().find((e) => e.id === 'edge-1')?.confidence).toBe('low');
    expect(graphsRepositorySpy.saveGraphDocument).toHaveBeenCalledTimes(1);
  });

  it('should not persist when edge confidence is already at the boundary', async () => {
    await service.loadGraph(graph.id);

    // edge-1 has confidence 'medium', worsened → 'low', then worsened again should stay 'low'
    await service.updateEdgeConfidence('edge-1', 'worsened');
    graphsRepositorySpy.saveGraphDocument.mockClear();

    const result = await service.updateEdgeConfidence('edge-1', 'worsened');

    expect(result).toBe(true);
    expect(graphsRepositorySpy.saveGraphDocument).not.toHaveBeenCalled();
  });

  it('should return false when updating confidence for a non-existent edge', async () => {
    await service.loadGraph(graph.id);

    const result = await service.updateEdgeConfidence('edge-999', 'improved');

    expect(result).toBe(false);
    expect(graphsRepositorySpy.saveGraphDocument).not.toHaveBeenCalled();
  });
});
