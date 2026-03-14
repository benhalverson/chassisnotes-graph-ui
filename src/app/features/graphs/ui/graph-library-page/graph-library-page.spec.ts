import { signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import type {
  GraphRecord,
  TemplateRecord,
} from '../../../../core/models/graph.models';
import { GraphsStore } from '../../state/graphs-store';
import { GraphLibraryPage } from './graph-library-page';

describe('GraphLibraryPage', () => {
  let component: GraphLibraryPage;
  let fixture: ComponentFixture<GraphLibraryPage>;

  const templatesSignal = signal<TemplateRecord[]>([
    {
      id: 'template-1',
      name: '2WD Buggy Carpet Baseline',
      description: 'Baseline starter map',
      graphData: {
        graph: {
          name: 'Baseline',
          chassis: 'Associated B7',
          classType: '2wd-buggy',
          surface: 'carpet',
          notes: 'Notes',
        },
        nodes: [],
        edges: [],
      },
      createdAt: '2026-03-14T00:00:00.000Z',
      updatedAt: '2026-03-14T00:00:00.000Z',
    },
  ]);
  const graphsSignal = signal<GraphRecord[]>([]);
  const errorSignal = signal<string | null>(null);
  const pendingDeleteGraphSignal = signal<GraphRecord | null>(null);
  const pendingDeleteGraphIdSignal = signal<string | null>(null);
  const routerSpy = {
    navigate: vi.fn(),
  };
  const graphsStoreStub = {
    loadLibrary: vi.fn<() => Promise<void>>(),
    createFromTemplate:
      vi.fn<(templateId: string) => Promise<GraphRecord | null>>(),
    duplicateGraph: vi.fn<(graphId: string) => Promise<GraphRecord | null>>(),
    requestDelete: vi.fn<(graphId: string) => void>(),
    confirmDelete: vi.fn<() => Promise<void>>(),
    cancelDelete: vi.fn<() => void>(),
    defaultTemplate: () => templatesSignal()[0] ?? null,
    templates: templatesSignal,
    graphs: graphsSignal,
    error: errorSignal,
    pendingDeleteGraph: pendingDeleteGraphSignal,
    pendingDeleteGraphId: pendingDeleteGraphIdSignal,
  };

  beforeEach(async () => {
    routerSpy.navigate.mockReset();
    routerSpy.navigate.mockResolvedValue(true);
    graphsStoreStub.loadLibrary.mockReset();
    graphsStoreStub.loadLibrary.mockResolvedValue();
    graphsStoreStub.createFromTemplate.mockReset();
    graphsStoreStub.createFromTemplate.mockResolvedValue({
      id: 'graph-1',
      name: 'Baseline',
      slug: 'baseline',
      chassis: 'Associated B7',
      classType: '2wd-buggy',
      surface: 'carpet',
      notes: 'Notes',
      templateId: 'template-1',
      createdAt: '2026-03-14T00:00:00.000Z',
      updatedAt: '2026-03-14T00:00:00.000Z',
      version: 1,
    });
    graphsStoreStub.duplicateGraph.mockReset();
    graphsStoreStub.duplicateGraph.mockResolvedValue(null);
    graphsStoreStub.requestDelete.mockReset();
    graphsStoreStub.confirmDelete.mockReset();
    graphsStoreStub.confirmDelete.mockResolvedValue();
    graphsStoreStub.cancelDelete.mockReset();
    templatesSignal.set(templatesSignal());
    graphsSignal.set([]);
    errorSignal.set(null);
    pendingDeleteGraphSignal.set(null);
    pendingDeleteGraphIdSignal.set(null);

    await TestBed.configureTestingModule({
      imports: [GraphLibraryPage],
      providers: [
        { provide: GraphsStore, useValue: graphsStoreStub },
        { provide: Router, useValue: routerSpy as Pick<Router, 'navigate'> },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GraphLibraryPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the graph library on init', () => {
    expect(graphsStoreStub.loadLibrary).toHaveBeenCalled();
  });

  it('should navigate after creating a graph from the default template', async () => {
    await (
      component as GraphLibraryPage & {
        createFromDefaultTemplate(): Promise<void>;
      }
    ).createFromDefaultTemplate();

    expect(graphsStoreStub.createFromTemplate).toHaveBeenCalledWith(
      'template-1',
    );
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/graphs', 'graph-1']);
  });

  it('should show the delete confirmation dialog when a graph is pending deletion', async () => {
    pendingDeleteGraphSignal.set({
      id: 'graph-1',
      name: 'Baseline',
      slug: 'baseline',
      chassis: 'Associated B7',
      classType: '2wd-buggy',
      surface: 'carpet',
      notes: 'Notes',
      templateId: 'template-1',
      createdAt: '2026-03-14T00:00:00.000Z',
      updatedAt: '2026-03-14T00:00:00.000Z',
      version: 1,
    });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[role="alertdialog"]'),
    ).toBeTruthy();
  });
});
