import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiagramCanvas } from './diagram-canvas';

describe('DiagramCanvas', () => {
  let component: DiagramCanvas;
  let fixture: ComponentFixture<DiagramCanvas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiagramCanvas],
    }).compileComponents();

    fixture = TestBed.createComponent(DiagramCanvas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
