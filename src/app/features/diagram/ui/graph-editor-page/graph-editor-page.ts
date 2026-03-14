import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { distinctUntilChanged, map } from 'rxjs';
import { DiagramStore } from '../../state/diagram-store';
import { EditorShell } from '../editor-shell/editor-shell';

@Component({
  selector: 'app-graph-editor-page',
  imports: [EditorShell],
  templateUrl: './graph-editor-page.html',
  styleUrl: './graph-editor-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphEditorPage {
  private readonly route = inject(ActivatedRoute);
  private readonly diagramStore = inject(DiagramStore);

  constructor() {
    this.loadGraphFromRoute(this.route.snapshot.paramMap.get('graphId'));

    this.route.paramMap
      .pipe(
        map((params) => params.get('graphId')),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((graphId) => {
        this.loadGraphFromRoute(graphId);
      });
  }

  private loadGraphFromRoute(graphId: string | null): void {
    if (graphId) {
      void this.diagramStore.loadGraph(graphId);

      return;
    }

    this.diagramStore.clear();
  }
}
