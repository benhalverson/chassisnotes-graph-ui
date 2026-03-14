import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CanvasToolbar } from './canvas-toolbar';

describe('CanvasToolbar', () => {
  let component: CanvasToolbar;
  let fixture: ComponentFixture<CanvasToolbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CanvasToolbar],
    }).compileComponents();

    fixture = TestBed.createComponent(CanvasToolbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
