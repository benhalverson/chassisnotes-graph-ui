import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphLibraryPage } from './graph-library-page';

describe('GraphLibraryPage', () => {
  let component: GraphLibraryPage;
  let fixture: ComponentFixture<GraphLibraryPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraphLibraryPage],
    }).compileComponents();

    fixture = TestBed.createComponent(GraphLibraryPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
