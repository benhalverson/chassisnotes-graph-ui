import { signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import type {
  GraphEdgeRecord,
  GraphNodeRecord,
} from '../../../../core/models/graph.models';
import { DiagramStore } from '../../state/diagram-store';

import { EdgeInspectorForm } from './edge-inspector-form';

describe('EdgeInspectorForm', () => {
  let component: EdgeInspectorForm;
  let fixture: ComponentFixture<EdgeInspectorForm>;

  const nodes: GraphNodeRecord[] = [
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
      position: { x: 200, y: 100 },
      data: {},
      createdAt: '2026-03-14T00:00:00.000Z',
      updatedAt: '2026-03-14T00:00:00.000Z',
    },
  ];

  const createSelectedEdge = (): GraphEdgeRecord => ({
    id: 'edge-1',
    graphId: 'graph-1',
    sourceNodeId: 'node-1',
    targetNodeId: 'node-2',
    relationshipType: 'can reduce',
    label: 'can reduce',
    description: 'Initial relationship',
    confidence: 'medium',
    phaseTags: ['entry'],
    evidenceType: 'observed',
    createdAt: '2026-03-14T00:00:00.000Z',
    updatedAt: '2026-03-14T00:00:00.000Z',
  });

  const selectedEdge = signal<GraphEdgeRecord | null>(createSelectedEdge());
  const mockStore = {
    selectedEdge,
    nodes: signal(nodes),
    validationError: signal<string | null>(null),
    mutating: signal(false),
    updateEdge: vi.fn<(edgeId: string, changes: object) => Promise<boolean>>(),
    deleteSelectedEdge: vi.fn<() => Promise<void>>(),
    clearValidationError: vi.fn<() => void>(),
  };

  const getComponentApi = () =>
    component as unknown as {
      form: {
        value: { relationshipType?: string };
        controls: {
          description: { value: string; setValue(value: string): void };
        };
      };
      selectedPhaseTags(): string[];
      togglePhaseTag(tag: string, checked: boolean): void;
    };

  beforeEach(async () => {
    selectedEdge.set(createSelectedEdge());
    mockStore.validationError.set(null);
    mockStore.updateEdge.mockReset();
    mockStore.updateEdge.mockResolvedValue(true);
    mockStore.deleteSelectedEdge.mockReset();
    mockStore.deleteSelectedEdge.mockResolvedValue();
    mockStore.clearValidationError.mockReset();

    await TestBed.configureTestingModule({
      imports: [EdgeInspectorForm],
      providers: [{ provide: DiagramStore, useValue: mockStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(EdgeInspectorForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('hydrates the form from the selected edge context', () => {
    const componentApi = getComponentApi();
    const nativeElement = fixture.nativeElement as HTMLElement;

    expect(nativeElement.textContent).toContain('Front spring → Entry push');
    expect(componentApi.form.value.relationshipType).toBe('can reduce');
    expect(componentApi.selectedPhaseTags()).toEqual(['entry']);
  });

  it('saves trimmed edge metadata and selected phase tags', async () => {
    const componentApi = getComponentApi();

    componentApi.form.controls.description.setValue('  Observed in warmup  ');
    componentApi.togglePhaseTag('exit', true);
    fixture.detectChanges();

    const saveButton = (
      Array.from(
        fixture.nativeElement.querySelectorAll('button'),
      ) as HTMLButtonElement[]
    ).find((button) => button.textContent?.includes('Save changes')) as
      | HTMLButtonElement
      | undefined;

    saveButton?.click();
    await fixture.whenStable();

    expect(mockStore.updateEdge).toHaveBeenCalledWith('edge-1', {
      relationshipType: 'can reduce',
      label: 'can reduce',
      description: 'Observed in warmup',
      confidence: 'medium',
      evidenceType: 'observed',
      phaseTags: ['entry', 'exit'],
    });
  });

  it('resets local edits and supports deleting the selected edge', () => {
    const componentApi = getComponentApi();

    componentApi.form.controls.description.setValue('Changed');
    componentApi.togglePhaseTag('exit', true);
    fixture.detectChanges();

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    const resetButton = buttons.find((button) =>
      button.textContent?.includes('Reset'),
    );
    const deleteButton = buttons.find((button) =>
      button.textContent?.includes('Delete edge'),
    );

    resetButton?.click();
    fixture.detectChanges();

    expect(componentApi.form.controls.description.value).toBe(
      'Initial relationship',
    );
    expect(componentApi.selectedPhaseTags()).toEqual(['entry']);

    deleteButton?.click();

    expect(mockStore.deleteSelectedEdge).toHaveBeenCalledTimes(1);
  });

  it('clears the local form state when the selection is removed', () => {
    const componentApi = getComponentApi();

    selectedEdge.set(null);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(componentApi.form.value.relationshipType).toBe('influences');
    expect(componentApi.selectedPhaseTags()).toEqual([]);
  });
});
