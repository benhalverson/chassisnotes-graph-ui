import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

export type CanvasViewportAction = 'fit' | 'zoom-in' | 'zoom-out';

export type CanvasViewportRequest = {
  id: number;
  type: CanvasViewportAction;
};

@Component({
  selector: 'app-canvas-toolbar',
  imports: [],
  templateUrl: './canvas-toolbar.html',
  styleUrl: './canvas-toolbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasToolbar {
  readonly hasGraph = input(false);
  readonly busy = input(false);
  readonly statusText = input('Open a graph to use canvas controls.');
  readonly fitRequested = output<void>();
  readonly zoomInRequested = output<void>();
  readonly zoomOutRequested = output<void>();
  readonly importExportRequested = output<void>();

  protected readonly controlsDisabled = computed(
    () => !this.hasGraph() || this.busy(),
  );

  protected requestFit(): void {
    if (this.controlsDisabled()) {
      return;
    }

    this.fitRequested.emit();
  }

  protected requestZoomIn(): void {
    if (this.controlsDisabled()) {
      return;
    }

    this.zoomInRequested.emit();
  }

  protected requestZoomOut(): void {
    if (this.controlsDisabled()) {
      return;
    }

    this.zoomOutRequested.emit();
  }

  protected openImportExport(): void {
    this.importExportRequested.emit();
  }
}
