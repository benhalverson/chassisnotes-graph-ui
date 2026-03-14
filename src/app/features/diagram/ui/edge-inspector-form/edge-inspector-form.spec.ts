import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EdgeInspectorForm } from './edge-inspector-form';

describe('EdgeInspectorForm', () => {
  let component: EdgeInspectorForm;
  let fixture: ComponentFixture<EdgeInspectorForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EdgeInspectorForm],
    }).compileComponents();

    fixture = TestBed.createComponent(EdgeInspectorForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
