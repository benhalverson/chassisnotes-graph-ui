import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmDeleteGraphDialog } from './confirm-delete-graph-dialog';

describe('ConfirmDeleteGraphDialog', () => {
  let component: ConfirmDeleteGraphDialog;
  let fixture: ComponentFixture<ConfirmDeleteGraphDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDeleteGraphDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDeleteGraphDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
