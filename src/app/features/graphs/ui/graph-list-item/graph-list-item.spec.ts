import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import type { GraphRecord } from '../../../../core/models/graph.models';
import { GraphListItem } from './graph-list-item';

describe('GraphListItem', () => {
  let component: GraphListItem;
  let fixture: ComponentFixture<GraphListItem>;

  const graph: GraphRecord = {
    id: 'graph-1',
    name: '2WD Carpet Baseline',
    slug: '2wd-carpet-baseline',
    chassis: 'Associated B7',
    classType: '2wd-buggy',
    surface: 'carpet',
    notes: 'Notes',
    templateId: 'template-1',
    createdAt: '2026-03-14T00:00:00.000Z',
    updatedAt: '2026-03-14T12:00:00.000Z',
    version: 1,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraphListItem],
    }).compileComponents();

    fixture = TestBed.createComponent(GraphListItem);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('graph', graph);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render graph metadata', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('2WD Carpet Baseline');
    expect(compiled.textContent).toContain('Associated B7');
  });

  it('should emit open, duplicate, and delete actions', () => {
    const openSpy = vi.spyOn(component.openGraph, 'emit');
    const duplicateSpy = vi.spyOn(component.duplicateGraph, 'emit');
    const deleteSpy = vi.spyOn(component.deleteGraph, 'emit');

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];

    buttons[0].click();
    buttons[1].click();
    buttons[2].click();

    expect(openSpy).toHaveBeenCalledWith('graph-1');
    expect(duplicateSpy).toHaveBeenCalledWith('graph-1');
    expect(deleteSpy).toHaveBeenCalledWith('graph-1');
  });
});
