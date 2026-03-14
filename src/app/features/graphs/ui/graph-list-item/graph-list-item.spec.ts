import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphListItem } from './graph-list-item';

describe('GraphListItem', () => {
  let component: GraphListItem;
  let fixture: ComponentFixture<GraphListItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraphListItem],
    }).compileComponents();

    fixture = TestBed.createComponent(GraphListItem);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
