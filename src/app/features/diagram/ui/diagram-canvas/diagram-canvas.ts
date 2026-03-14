import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { NgDiagramComponent, provideNgDiagram } from 'ng-diagram';
import { DiagramStore } from '../../state/diagram-store';

@Component({
  selector: 'app-diagram-canvas',
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  templateUrl: './diagram-canvas.html',
  styleUrl: './diagram-canvas.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagramCanvas {
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly diagramStore = inject(DiagramStore);

  protected readonly isBrowser = isPlatformBrowser(this.platformId);
  protected readonly graphTitle = computed(() =>
    this.diagramStore.graphTitle(),
  );
}
