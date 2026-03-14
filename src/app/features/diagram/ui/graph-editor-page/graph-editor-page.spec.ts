import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphEditorPage } from './graph-editor-page';

describe('GraphEditorPage', () => {
  let component: GraphEditorPage;
  let fixture: ComponentFixture<GraphEditorPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraphEditorPage],
    }).compileComponents();

    fixture = TestBed.createComponent(GraphEditorPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
