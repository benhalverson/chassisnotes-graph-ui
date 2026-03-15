import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import type { GraphRecord } from '../../../../core/models/graph.models';
import { GraphsStore } from '../../state/graphs-store';
import { ConfirmDeleteGraphDialog } from '../confirm-delete-graph-dialog/confirm-delete-graph-dialog';
import { GraphLibraryToolbar } from '../graph-library-toolbar/graph-library-toolbar';
import { GraphList } from '../graph-list/graph-list';
import { TemplatePicker } from '../template-picker/template-picker';

@Component({
  selector: 'app-graph-library-page',
  imports: [
    GraphLibraryToolbar,
    GraphList,
    TemplatePicker,
    ConfirmDeleteGraphDialog,
  ],
  templateUrl: './graph-library-page.html',
  styleUrl: './graph-library-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphLibraryPage {
  protected readonly graphsStore = inject(GraphsStore);
  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);
  protected readonly title = toSignal(
    this.route.data.pipe(map((data) => (data['title'] as string) ?? 'Graphs')),
    { initialValue: 'Graphs' },
  );
  protected readonly description = toSignal(
    this.route.data.pipe(
      map(
        (data) =>
          (data['description'] as string) ??
          'Create, duplicate, and open your 2WD carpet setup relationship maps.',
      ),
    ),
    {
      initialValue:
        'Create, duplicate, and open your 2WD carpet setup relationship maps.',
    },
  );
  protected readonly mode = toSignal(
    this.route.data.pipe(map((data) => (data['mode'] as 'graphs' | 'garage') ?? 'graphs')),
    { initialValue: 'graphs' },
  );

  constructor() {
    void this.graphsStore.loadLibrary();
  }

  protected readonly savedCars = computed(
    () => this.computeSavedCars(this.graphsStore.graphs()),
  );

  protected readonly pastSessions = () => this.graphsStore.graphs().slice(0, 4);

  protected readonly isGarageMode = (): boolean => this.mode() === 'garage';

  protected async createFromDefaultTemplate(): Promise<void> {
    const defaultTemplate = this.graphsStore.defaultTemplate();

    if (!defaultTemplate) {
      return;
    }

    await this.createFromTemplate(defaultTemplate.id);
  }

  protected async createFromTemplate(templateId: string): Promise<void> {
    const graph = await this.graphsStore.createFromTemplate(templateId);

    if (graph) {
      await this.router.navigate(this.graphRoute(graph.id));
    }
  }

  protected async duplicateGraph(graphId: string): Promise<void> {
    const graph = await this.graphsStore.duplicateGraph(graphId);

    if (graph) {
      await this.router.navigate(this.graphRoute(graph.id));
    }
  }

  protected async openGraph(graphId: string): Promise<void> {
    await this.router.navigate(this.graphRoute(graphId));
  }

  protected formatRelativeTime(updatedAt: string): string {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(updatedAt));
  }

  private graphRoute(graphId: string): string[] {
    return this.isGarageMode() ? ['/map', graphId] : ['/graphs', graphId];
  }

  private computeSavedCars(graphs: GraphRecord[]): Array<{
    id: string;
    chassis: string;
    classType: string;
    surface: string;
    graphCount: number;
    latestUpdatedAt: string;
  }> {
    const cars = new Map<string, {
      id: string;
      chassis: string;
      classType: string;
      surface: string;
      graphCount: number;
      latestUpdatedAt: string;
    }>();

    for (const graph of graphs) {
      const key = `${graph.chassis}:${graph.classType}:${graph.surface}`;
      const existing = cars.get(key);

      if (!existing) {
        cars.set(key, {
          id: key,
          chassis: graph.chassis,
          classType: graph.classType,
          surface: graph.surface,
          graphCount: 1,
          latestUpdatedAt: graph.updatedAt,
        });
        continue;
      }

      cars.set(key, {
        ...existing,
        graphCount: existing.graphCount + 1,
        latestUpdatedAt:
          existing.latestUpdatedAt > graph.updatedAt
            ? existing.latestUpdatedAt
            : graph.updatedAt,
      });
    }

    return [...cars.values()].sort((left, right) =>
      right.latestUpdatedAt.localeCompare(left.latestUpdatedAt),
    );
  }
}
