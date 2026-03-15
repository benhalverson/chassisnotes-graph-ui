import { signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DiagramStore } from '../../state/diagram-store';
import { EditorShell } from './editor-shell';

describe('EditorShell', () => {
  let component: EditorShell;
  let fixture: ComponentFixture<EditorShell>;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & {
        ResizeObserver?: typeof ResizeObserver;
      }
    ).ResizeObserver = class ResizeObserver {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    } as unknown as typeof ResizeObserver;
  });

  const diagramStoreStub = {
    loading: signal(false),
    mutating: signal(false),
    hasActiveGraph: signal(true),
    error: signal<string | null>(null),
    graph: signal({ id: 'graph-1', name: 'Baseline Map' }),
    graphTitle: signal('Baseline Map'),
    nodes: signal([]),
    edges: signal([]),
    selection: signal(null),
    filterState: signal({
      matchedNodeIds: [],
      matchedEdgeIds: [],
      highlightedNodeIds: [],
      highlightedEdgeIds: [],
      dimmedNodeIds: [],
      dimmedEdgeIds: [],
    }),
    filters: signal({
      nodeTypes: [],
      phaseTags: [],
      confidenceLevels: [],
      evidenceTypes: [],
      highlightSelectionNeighborhood: true,
    }),
    selectedNode: signal(null),
    selectedEdge: signal(null),
    addNode: vi.fn(),
    toggleNodeTypeFilter: vi.fn(),
    togglePhaseTagFilter: vi.fn(),
    toggleConfidenceFilter: vi.fn(),
    toggleEvidenceTypeFilter: vi.fn(),
    setSelectionNeighborhoodHighlight: vi.fn(),
    resetFilters: vi.fn(),
    updateSelection: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorShell],
      providers: [
        { provide: DiagramStore, useValue: diagramStoreStub },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditorShell);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open the import/export dialog from the toolbar', () => {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    const button = buttons.find((entry) =>
      entry.textContent?.includes('Import / Export'),
    );

    expect(button).toBeTruthy();
    button?.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();
  });
});
