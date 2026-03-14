import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeInspectorForm } from './node-inspector-form';

describe('NodeInspectorForm', () => {
  let component: NodeInspectorForm;
  let fixture: ComponentFixture<NodeInspectorForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeInspectorForm],
    }).compileComponents();

    fixture = TestBed.createComponent(NodeInspectorForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
