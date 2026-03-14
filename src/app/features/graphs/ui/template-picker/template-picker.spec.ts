import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import type { TemplateRecord } from '../../../../core/models/graph.models';
import { TemplatePicker } from './template-picker';

describe('TemplatePicker', () => {
  let component: TemplatePicker;
  let fixture: ComponentFixture<TemplatePicker>;

  const templates: TemplateRecord[] = [
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
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplatePicker],
    }).compileComponents();

    fixture = TestBed.createComponent(TemplatePicker);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('templates', templates);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render template descriptions', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('2WD Buggy Carpet Baseline');
    expect(compiled.textContent).toContain('Baseline starter map');
  });

  it('should emit the selected template id', () => {
    const emitSpy = vi.spyOn(component.createFromTemplate, 'emit');

    const button = fixture.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;
    button.click();

    expect(emitSpy).toHaveBeenCalledWith('template-1');
  });
});
