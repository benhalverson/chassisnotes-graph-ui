import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

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
    fixture.componentRef.setInput('graphName', '2WD Carpet Baseline');
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render an alert dialog with the graph name', () => {
    const dialog = fixture.nativeElement.querySelector(
      '[role="alertdialog"]',
    ) as HTMLElement;

    expect(dialog).toBeTruthy();
    expect(dialog.textContent).toContain('2WD Carpet Baseline');
  });

  it('should emit cancel and confirm actions', () => {
    const cancelSpy = vi.spyOn(component.cancelDelete, 'emit');
    const confirmSpy = vi.spyOn(component.confirmDelete, 'emit');

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];

    buttons[0].click();
    buttons[1].click();

    expect(cancelSpy).toHaveBeenCalled();
    expect(confirmSpy).toHaveBeenCalled();
  });
});
