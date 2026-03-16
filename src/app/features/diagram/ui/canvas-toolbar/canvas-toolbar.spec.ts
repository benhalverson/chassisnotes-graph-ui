import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

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
    const importExportButton = buttons.find(
      (button) => button.textContent?.trim() === 'Import / Export',
    ) as HTMLButtonElement;
    const fitButton = buttons.find(
      (button) =>
        (button as HTMLButtonElement).textContent?.trim() === 'Fit view',
    ) as HTMLButtonElement;
    const zoomInButton = buttons.find(
      (button) =>
        (button as HTMLButtonElement).textContent?.trim() === 'Zoom in',
    ) as HTMLButtonElement;
    const zoomOutButton = buttons.find(
      (button) =>
        (button as HTMLButtonElement).textContent?.trim() === 'Zoom out',
    ) as HTMLButtonElement;

    expect(importExportButton.disabled).toBe(false);
    expect(fitButton.disabled).toBe(true);
    expect(zoomInButton.disabled).toBe(true);
    expect(zoomOutButton.disabled).toBe(true);
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

    const importExportButton = buttons.find(
      (button) => button.textContent?.trim() === 'Import / Export',
    );
    const fitButton = buttons.find(
      (button) => button.textContent?.trim() === 'Fit view',
    );
    const zoomInButton = buttons.find(
      (button) => button.textContent?.trim() === 'Zoom in',
    );
    const zoomOutButton = buttons.find(
      (button) => button.textContent?.trim() === 'Zoom out',
    );

    importExportButton?.click();
    fitButton?.click();
    zoomInButton?.click();
    zoomOutButton?.click();

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
