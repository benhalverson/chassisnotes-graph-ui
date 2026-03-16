import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, distinctUntilChanged, map } from 'rxjs';
import type { GraphNodeType, GraphRecord, PersistedGraphDocument } from '../../../../core/models/graph.models';
import { GraphsRepository } from '../../../../core/db/repositories/graphs-repository';
import type {
  GraphNodeType,
  GraphRecord,
} from '../../../../core/models/graph.models';
import { DiagramStore } from '../../../diagram/state/diagram-store';
import { EditorShell } from '../../../diagram/ui/editor-shell/editor-shell';
import { QuickLogDialog } from '../../../events/ui/quick-log-dialog/quick-log-dialog';

@Component({
  selector: 'app-map-home-page',
  imports: [RouterLink, EditorShell, QuickLogDialog],
  templateUrl: './map-home-page.html',
  styleUrl: './map-home-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapHomePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly graphsRepository = inject(GraphsRepository);
  protected readonly diagramStore = inject(DiagramStore);
  private readonly recentGraphsSignal = signal<GraphRecord[]>([]);
  private readonly resolvedGraphId = signal<string | null>(null);
  private handledQuickAddKey: string | null = null;
  protected readonly currentGraph = computed(() => this.diagramStore.graph());
  protected readonly hasGraph = computed(() => this.currentGraph() !== null);
  protected readonly recentGraphs = computed(() =>
    this.recentGraphsSignal()
      .filter((graph) => graph.id !== this.currentGraph()?.id)
      .slice(0, 4),
  );
  protected readonly showQuickLog = signal(false);

  constructor() {
    combineLatest([
      this.route.paramMap.pipe(
        map((params) => params.get('graphId')),
        distinctUntilChanged(),
      ),
      this.route.queryParamMap.pipe(
        map((params) => params.get('quickAdd')),
        distinctUntilChanged(),
      ),
    ])
      .pipe(takeUntilDestroyed())
      .subscribe(([graphId, quickAdd]) => {
        void this.loadMap(graphId, quickAdd);
      });
  }

  protected async openGraph(graphId: string): Promise<void> {
    await this.router.navigate(['/map', graphId]);
  }

  protected toggleQuickLog(): void {
    this.showQuickLog.update((v) => !v);
  }

  protected closeQuickLog(): void {
    this.showQuickLog.set(false);
  }

  protected async onEventLogged(updatedDocument: PersistedGraphDocument): Promise<void> {
    await this.graphsRepository.saveGraphDocument(updatedDocument);
    const graphId = updatedDocument.graph.id;
    await this.diagramStore.loadGraph(graphId);
  }

  private async loadMap(
    routeGraphId: string | null,
    quickAdd: string | null,
  ): Promise<void> {
    const recentGraphs = await this.graphsRepository.listGraphs();
    this.recentGraphsSignal.set(recentGraphs);

    const resolvedGraphId =
      routeGraphId ?? (await this.graphsRepository.resolveActiveGraphId());

    if (!resolvedGraphId) {
      this.resolvedGraphId.set(null);
      this.diagramStore.clear();
      return;
    }

    this.resolvedGraphId.set(resolvedGraphId);
    await this.graphsRepository.setActiveGraphId(resolvedGraphId);
    await this.diagramStore.loadGraph(resolvedGraphId);

    const quickAddType = this.parseQuickAddType(quickAdd);

    if (!quickAddType) {
      this.handledQuickAddKey = null;
      return;
    }

    const requestKey = `${resolvedGraphId}:${quickAddType}`;

    if (this.handledQuickAddKey === requestKey) {
      return;
    }

    this.handledQuickAddKey = requestKey;
    await this.diagramStore.addNode(quickAddType);
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { quickAdd: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private parseQuickAddType(candidate: string | null): GraphNodeType | null {
    if (candidate === 'symptom' || candidate === 'experiment') {
      return candidate;
    }

    return null;
  }
}
