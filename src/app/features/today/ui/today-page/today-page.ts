import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { GraphsRepository } from '../../../../core/db/repositories/graphs-repository';
import type {
  GraphRecord,
  PersistedGraphDocument,
  TemplateRecord,
} from '../../../../core/models/graph.models';
import { QuickLogDialog } from '../../../events/ui/quick-log-dialog/quick-log-dialog';

@Component({
  selector: 'app-today-page',
  imports: [RouterLink, QuickLogDialog],
  templateUrl: './today-page.html',
  styleUrl: './today-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodayPage {
  private readonly graphsRepository = inject(GraphsRepository);
  private readonly router = inject(Router);
  private readonly activeDocument = signal<PersistedGraphDocument | null>(null);
  private readonly templates = signal<TemplateRecord[]>([]);
  private readonly recentSessionGraphs = signal<GraphRecord[]>([]);
  protected readonly latestGraph = computed(
    () => this.activeDocument()?.graph ?? null,
  );
  protected readonly trackCondition = computed(() => {
    const document = this.activeDocument();

    if (!document) {
      return 'Open or create a graph to track the current condition.';
    }

    const conditions = document.nodes
      .filter((node) => node.type === 'condition')
      .slice(0, 2)
      .map((node) => node.title);

    return conditions.length ? conditions.join(' · ') : document.graph.surface;
  });
  protected readonly recentChanges = computed(() =>
    [...(this.activeDocument()?.nodes ?? [])]
      .filter((node) => node.type === 'setup' || node.type === 'experiment')
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, 3),
  );
  protected readonly showQuickLogDialog = signal(false);
  protected readonly quickLogGraphId = signal<string | null>(null);
  protected readonly recentSessions = computed(() =>
    this.recentSessionGraphs().slice(0, 3),
  );

  constructor() {
    void this.loadDashboard();
  }

  protected async startNewSession(): Promise<void> {
    const defaultTemplate = this.templates()[0] ?? null;

    if (!defaultTemplate) {
      return;
    }

    const graph = await this.graphsRepository.createGraphFromTemplate(
      defaultTemplate.id,
    );

    await this.router.navigate(['/map', graph.id]);
  }

  protected async recordSymptom(): Promise<void> {
    await this.openQuickLog();
  }

  protected async logChange(): Promise<void> {
    await this.openQuickLog();
  }

  protected closeQuickLog(): void {
    this.showQuickLogDialog.set(false);
  }

  protected async onEventLogged(
    updatedDocument: PersistedGraphDocument,
  ): Promise<void> {
    await this.graphsRepository.saveGraphDocument(updatedDocument);
    this.activeDocument.set(updatedDocument);
    await this.loadDashboard();
  }

  protected formatRelativeTime(updatedAt: string): string {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(updatedAt));
  }

  private async openQuickLog(): Promise<void> {
    const graphId = await this.ensureActiveGraphId();

    if (!graphId) {
      return;
    }

    this.quickLogGraphId.set(graphId);
    this.showQuickLogDialog.set(true);
  }

  private async ensureActiveGraphId(): Promise<string | null> {
    const existing = await this.graphsRepository.resolveActiveGraphId();

    if (existing) {
      return existing;
    }

    const defaultTemplate = this.templates()[0] ?? null;

    if (!defaultTemplate) {
      return null;
    }

    const graph = await this.graphsRepository.createGraphFromTemplate(
      defaultTemplate.id,
    );

    return graph.id;
  }

  private async loadDashboard(): Promise<void> {
    const [activeDocument, templates, graphs] = await Promise.all([
      this.graphsRepository.loadActiveGraph(),
      this.graphsRepository.listTemplates(),
      this.graphsRepository.listGraphs(),
    ]);

    this.activeDocument.set(activeDocument);
    this.templates.set(templates);
    this.recentSessionGraphs.set(graphs);
  }
}
