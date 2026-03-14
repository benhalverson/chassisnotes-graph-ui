import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphList } from './graph-list';

describe('GraphList', () => {
  let component: GraphList;
  let fixture: ComponentFixture<GraphList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraphList],
    }).compileComponents();

    fixture = TestBed.createComponent(GraphList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
