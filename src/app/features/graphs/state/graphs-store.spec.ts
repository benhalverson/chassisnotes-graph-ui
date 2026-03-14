import { TestBed } from '@angular/core/testing';
import { GraphsRepository } from '../../../core/db/repositories/graphs-repository';
import type {
  GraphRecord,
  TemplateRecord,
} from '../../../core/models/graph.models';
import { GraphsStore } from './graphs-store';

describe('GraphsStore', () => {
  let service: InstanceType<typeof GraphsStore>;

  const templates: TemplateRecord[] = [
    {
      id: 'template-1',
      name: 'Baseline',
      description: 'Baseline template',
      graphData: {
        graph: {
          name: 'Baseline',
          chassis: 'Associated B7',
          classType: '2wd-buggy',
          surface: 'carpet',
          notes: 'Baseline notes',
        },
        nodes: [],
        edges: [],
      },
      createdAt: '2026-03-14T00:00:00.000Z',
      updatedAt: '2026-03-14T00:00:00.000Z',
    },
  ];

  const graph: GraphRecord = {
    id: 'graph-1',
    name: 'Baseline',
    slug: 'baseline',
    chassis: 'Associated B7',
    classType: '2wd-buggy',
    surface: 'carpet',
    notes: 'Baseline notes',
    templateId: 'template-1',
    createdAt: '2026-03-14T00:00:00.000Z',
    updatedAt: '2026-03-14T00:00:00.000Z',
    version: 1,
  };

  const graphsRepositorySpy = {
    listGraphs: vi.fn<() => Promise<GraphRecord[]>>(),
    listTemplates: vi.fn<() => Promise<TemplateRecord[]>>(),
    createGraphFromTemplate:
      vi.fn<(templateId: string) => Promise<GraphRecord>>(),
    duplicateGraph: vi.fn<(graphId: string) => Promise<GraphRecord>>(),
    deleteGraph: vi.fn<(graphId: string) => Promise<void>>(),
  } satisfies Pick<
    GraphsRepository,
    | 'listGraphs'
    | 'listTemplates'
    | 'createGraphFromTemplate'
    | 'duplicateGraph'
    | 'deleteGraph'
  >;

  beforeEach(() => {
    graphsRepositorySpy.listGraphs.mockReset();
    graphsRepositorySpy.listTemplates.mockReset();
    graphsRepositorySpy.createGraphFromTemplate.mockReset();
    graphsRepositorySpy.duplicateGraph.mockReset();
    graphsRepositorySpy.deleteGraph.mockReset();

    graphsRepositorySpy.listGraphs.mockResolvedValue([graph]);
    graphsRepositorySpy.listTemplates.mockResolvedValue(templates);
    graphsRepositorySpy.createGraphFromTemplate.mockResolvedValue(graph);
    graphsRepositorySpy.duplicateGraph.mockResolvedValue({
      ...graph,
      id: 'graph-2',
      name: 'Baseline Copy',
      slug: 'baseline-copy',
    });
    graphsRepositorySpy.deleteGraph.mockResolvedValue();

    TestBed.configureTestingModule({
      providers: [{ provide: GraphsRepository, useValue: graphsRepositorySpy }],
    });
    service = TestBed.inject(GraphsStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load the graph library', async () => {
    await service.loadLibrary();

    expect(graphsRepositorySpy.listGraphs).toHaveBeenCalled();
    expect(graphsRepositorySpy.listTemplates).toHaveBeenCalled();
    expect(service.graphs()).toEqual([graph]);
    expect(service.templates()).toEqual(templates);
    expect(service.defaultTemplate()).toEqual(templates[0]);
  });

  it('should create a graph from a template and refresh the list', async () => {
    const createdGraph = await service.createFromTemplate('template-1');

    expect(graphsRepositorySpy.createGraphFromTemplate).toHaveBeenCalledWith(
      'template-1',
    );
    expect(createdGraph).toEqual(graph);
    expect(service.graphs()).toEqual([graph]);
  });

  it('should request and confirm delete of a graph', async () => {
    await service.loadLibrary();
    service.requestDelete('graph-1');

    expect(service.pendingDeleteGraphId()).toBe('graph-1');
    expect(service.pendingDeleteGraph()).toEqual(graph);

    await service.confirmDelete();

    expect(graphsRepositorySpy.deleteGraph).toHaveBeenCalledWith('graph-1');
    expect(service.pendingDeleteGraphId()).toBeNull();
  });
});
