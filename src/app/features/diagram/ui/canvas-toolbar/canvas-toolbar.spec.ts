import { type ComponentFixture, TestBed } from '@angular/core/testing';

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
    fixture.detectChanges();
  });

  it('disables canvas controls until a graph is active', () => {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    const viewportButtons = buttons.slice(1);

    expect(buttons[0]?.disabled).toBe(false);
    expect(viewportButtons.every((button) => button.disabled)).toBe(true);
  });

  it('emits fit and zoom actions when controls are enabled', () => {
    const fitSpy = vi.fn();
    const zoomInSpy = vi.fn();
    const zoomOutSpy = vi.fn();
    const importExportSpy = vi.fn();

    component.fitRequested.subscribe(fitSpy);
    component.zoomInRequested.subscribe(zoomInSpy);
    component.zoomOutRequested.subscribe(zoomOutSpy);
    component.importExportRequested.subscribe(importExportSpy);

    fixture.componentRef.setInput('hasGraph', true);
    fixture.componentRef.setInput('busy', false);
    fixture.detectChanges();

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];

    buttons[0]?.click();
    buttons[1]?.click();
    buttons[2]?.click();
    buttons[3]?.click();

    expect(fitSpy).toHaveBeenCalledTimes(1);
    expect(zoomInSpy).toHaveBeenCalledTimes(1);
    expect(zoomOutSpy).toHaveBeenCalledTimes(1);
    expect(importExportSpy).toHaveBeenCalledTimes(1);
  });

  it('renders the current toolbar status copy', () => {
    fixture.componentRef.setInput(
      'statusText',
      'Use touch-friendly controls to frame the current map.',
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Use touch-friendly controls to frame the current map.',
    );
  });
});
