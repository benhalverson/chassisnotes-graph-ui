import { signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';

import type { GraphNodeRecord } from '../../../../core/models/graph.models';
import { Autosave } from '../../data-access/autosave';
import { DiagramStore } from '../../state/diagram-store';

import { NodeInspectorForm } from './node-inspector-form';

describe('NodeInspectorForm', () => {
  let component: NodeInspectorForm;
  let fixture: ComponentFixture<NodeInspectorForm>;

  const selectedNode = signal<GraphNodeRecord | null>({
    id: 'node-1',
    graphId: 'graph-1',
    type: 'setup',
    subtype: 'rear-oil',
    title: 'Rear oil 32.5wt',
    description: 'Baseline setup node.',
    tags: [],
    phaseTags: ['mid'],
    confidence: 'medium',
    position: { x: 100, y: 120 },
    data: {},
    createdAt: '2026-03-14T00:00:00.000Z',
    updatedAt: '2026-03-14T00:00:00.000Z',
  });
  const diagramStoreStub = {
    selectedNode,
    updateNode: vi.fn<(nodeId: string, changes: object) => Promise<void>>(),
    deleteSelectedNode: vi.fn<() => Promise<void>>(),
  };

  beforeEach(async () => {
    selectedNode.set({
      id: 'node-1',
      graphId: 'graph-1',
      type: 'setup',
      subtype: 'rear-oil',
      title: 'Rear oil 32.5wt',
      description: 'Baseline setup node.',
      tags: [],
      phaseTags: ['mid'],
      confidence: 'medium',
      position: { x: 100, y: 120 },
      data: {},
      createdAt: '2026-03-14T00:00:00.000Z',
      updatedAt: '2026-03-14T00:00:00.000Z',
    });
    diagramStoreStub.updateNode.mockReset();
    diagramStoreStub.updateNode.mockResolvedValue();
    diagramStoreStub.deleteSelectedNode.mockReset();
    diagramStoreStub.deleteSelectedNode.mockResolvedValue();

    await TestBed.configureTestingModule({
      imports: [NodeInspectorForm],
      providers: [
        Autosave,
        { provide: DiagramStore, useValue: diagramStoreStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NodeInspectorForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('autosaves node metadata after a debounce', async () => {
    vi.useFakeTimers();
    const titleInput = fixture.nativeElement.querySelector(
      'input[formcontrolname="title"]',
    ) as HTMLInputElement;

    titleInput.value = 'Rear oil 30wt';
    titleInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(500);
    await Promise.resolve();
    fixture.detectChanges();

    expect(diagramStoreStub.updateNode).toHaveBeenCalledWith('node-1', {
      title: 'Rear oil 30wt',
      subtype: 'rear-oil',
      description: 'Baseline setup node.',
      confidence: 'medium',
      phaseTags: ['mid'],
    });
    expect(fixture.nativeElement.textContent).toContain('All changes saved.');
  });
});
