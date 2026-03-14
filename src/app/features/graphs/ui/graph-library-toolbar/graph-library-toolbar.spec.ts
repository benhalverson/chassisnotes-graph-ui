import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphLibraryToolbar } from './graph-library-toolbar';

describe('GraphLibraryToolbar', () => {
  let component: GraphLibraryToolbar;
  let fixture: ComponentFixture<GraphLibraryToolbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraphLibraryToolbar],
    }).compileComponents();

    fixture = TestBed.createComponent(GraphLibraryToolbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
