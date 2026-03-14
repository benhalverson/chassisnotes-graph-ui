import { computed, PLATFORM_ID, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import type {
  GraphNodeRecord,
  GraphRecord,
} from '../../../../core/models/graph.models';
import { RelationshipRules } from '../../data-access/relationship-rules';
import type {
  DiagramFilterState,
  DiagramSelection,
} from '../../state/diagram-store';
import { DiagramStore } from '../../state/diagram-store';

import { DiagramCanvas } from './diagram-canvas';

describe('DiagramCanvas', () => {
  let component: DiagramCanvas;
  let fixture: ComponentFixture<DiagramCanvas>;

  const createGraph = (): GraphRecord => ({
    id: 'graph-1',
    name: 'Baseline map',
    slug: 'baseline-map',
    chassis: 'Associated B7',
    classType: '2wd-buggy',
    surface: 'carpet',
    notes: '',
    templateId: 'template-1',
    createdAt: '2026-03-14T00:00:00.000Z',
    updatedAt: '2026-03-14T00:00:00.000Z',
    version: 1,
  });

  const createNodes = (): GraphNodeRecord[] => [
    {
      id: 'node-1',
      graphId: 'graph-1',
      type: 'setup',
      subtype: 'suspension',
      title: 'Front spring',
      description: '',
      tags: [],
      phaseTags: ['entry'],
      confidence: 'medium',
      position: { x: 100, y: 100 },
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
      description: '',
      tags: [],
      phaseTags: ['entry'],
      confidence: 'medium',
      position: { x: 300, y: 100 },
      data: {},
      createdAt: '2026-03-14T00:00:00.000Z',
      updatedAt: '2026-03-14T00:00:00.000Z',
    },
  ];

  const graph = signal<GraphRecord | null>(createGraph());
  const nodes = signal<GraphNodeRecord[]>(createNodes());
  const edges = signal([]);
  const selection = signal<DiagramSelection>(null);
  const filterState = signal<DiagramFilterState>({
    matchedNodeIds: ['node-1', 'node-2'],
    matchedEdgeIds: [],
    highlightedNodeIds: ['node-1', 'node-2'],
    highlightedEdgeIds: [],
    dimmedNodeIds: [],
    dimmedEdgeIds: [],
  });

  const mockStore = {
    graph,
    nodes,
    edges,
    selection,
    filterState,
    graphTitle: computed(() => graph()?.name ?? 'Graph editor'),
    loading: signal(false),
    error: signal<string | null>(null),
    updateSelection: vi.fn<(nodeIds: string[], edgeIds: string[]) => void>(),
    createEdge:
      vi.fn<(sourceId: string, targetId: string) => Promise<boolean>>(),
    syncNodePositions:
      vi.fn<
        (
          positions: ReadonlyArray<{
            id: string;
            position: { x: number; y: number };
          }>,
        ) => Promise<void>
      >(),
  };

  const relationshipRules = {
    validateConnection: vi.fn(() => ({ valid: true, errors: [] })),
    getAllowedRelationshipTypes: vi.fn(() => ['influences']),
  };

  const getComponentApi = () =>
    component as unknown as {
      canvasError: ReturnType<typeof signal<string | null>>;
      activeModel: ReturnType<typeof signal<unknown | null>>;
      onSelectionChanged(event: unknown): void;
      onEdgeDrawn(event: unknown): Promise<void>;
    };

  beforeEach(async () => {
    graph.set(createGraph());
    nodes.set(createNodes());
    edges.set([]);
    selection.set(null);
    filterState.set({
      matchedNodeIds: ['node-1', 'node-2'],
      matchedEdgeIds: [],
      highlightedNodeIds: ['node-1', 'node-2'],
      highlightedEdgeIds: [],
      dimmedNodeIds: [],
      dimmedEdgeIds: [],
    });
    mockStore.loading.set(false);
    mockStore.error.set(null);
    mockStore.updateSelection.mockReset();
    mockStore.createEdge.mockReset();
    mockStore.createEdge.mockResolvedValue(true);
    mockStore.syncNodePositions.mockReset();
    relationshipRules.validateConnection.mockClear();
    relationshipRules.getAllowedRelationshipTypes.mockClear();

    await TestBed.configureTestingModule({
      imports: [DiagramCanvas],
      providers: [
        { provide: DiagramStore, useValue: mockStore },
        { provide: RelationshipRules, useValue: relationshipRules },
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DiagramCanvas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('clears canvas errors after a successful selection update', () => {
    const componentApi = getComponentApi();

    componentApi.canvasError.set('Canvas mismatch');

    componentApi.onSelectionChanged({
      nodes: [{ id: 'node-1' }],
      edges: [],
    } as never);

    expect(mockStore.updateSelection).toHaveBeenCalledWith(['node-1'], []);
    expect(componentApi.canvasError()).toBeNull();
  });

  it('syncs the active model after an invalid edge draw instead of rebuilding it', async () => {
    const componentApi = getComponentApi();

    mockStore.createEdge.mockResolvedValue(false);

    const model = {
      updateNodes: vi.fn(),
      updateEdges: vi.fn(),
      destroy: vi.fn(),
    };

    componentApi.activeModel.set(model);

    await componentApi.onEdgeDrawn({
      source: { id: 'node-1' },
      target: { id: 'node-2' },
    } as never);

    expect(mockStore.createEdge).toHaveBeenCalledWith('node-1', 'node-2');
    expect(model.updateNodes).toHaveBeenCalledTimes(1);
    expect(model.updateEdges).toHaveBeenCalledTimes(1);
    expect(model.destroy).not.toHaveBeenCalled();
    expect(componentApi.activeModel()).toBe(model);
  });
});
