import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DiagramStore } from '../../state/diagram-store';
import {
  CanvasToolbar,
  type CanvasViewportAction,
  type CanvasViewportRequest,
} from '../canvas-toolbar/canvas-toolbar';
import { DiagramCanvas } from '../diagram-canvas/diagram-canvas';
import { LeftSidebar } from '../left-sidebar/left-sidebar';
import { RightSidebar } from '../right-sidebar/right-sidebar';

@Component({
  selector: 'app-editor-shell',
  imports: [LeftSidebar, CanvasToolbar, DiagramCanvas, RightSidebar],
  templateUrl: './editor-shell.html',
  styleUrl: './editor-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorShell {
  protected readonly diagramStore = inject(DiagramStore);
  protected readonly viewportRequest = signal<CanvasViewportRequest | null>(
    null,
  );
  protected readonly toolbarStatusText = computed(() => {
    if (this.diagramStore.loading()) {
      return 'Loading the persisted graph…';
    }

    if (!this.diagramStore.hasActiveGraph()) {
      return 'Open a graph to pan, zoom, and inspect relationships.';
    }

    if (this.diagramStore.error()) {
      return this.diagramStore.error() ?? 'The canvas is unavailable.';
    }

    if (this.diagramStore.mutating()) {
      return 'Saving graph updates…';
    }

    return 'Use touch-friendly canvas controls to frame the current map.';
  });

  private viewportRequestId = 0;

  protected requestViewportAction(type: CanvasViewportAction): void {
    this.viewportRequestId += 1;
    this.viewportRequest.set({
      id: this.viewportRequestId,
      type,
    });
  }
}
