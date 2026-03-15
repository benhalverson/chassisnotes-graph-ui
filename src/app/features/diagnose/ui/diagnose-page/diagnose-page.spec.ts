import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiagnosePage } from './diagnose-page';

describe('DiagnosePage', () => {
  let component: DiagnosePage;
  let fixture: ComponentFixture<DiagnosePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiagnosePage],
    }).compileComponents();

    fixture = TestBed.createComponent(DiagnosePage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
