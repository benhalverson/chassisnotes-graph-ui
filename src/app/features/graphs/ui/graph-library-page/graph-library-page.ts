import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
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

  private readonly router = inject(Router);

  constructor() {
    void this.graphsStore.loadLibrary();
  }

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
      await this.router.navigate(['/graphs', graph.id]);
    }
  }

  protected async duplicateGraph(graphId: string): Promise<void> {
    const graph = await this.graphsStore.duplicateGraph(graphId);

    if (graph) {
      await this.router.navigate(['/graphs', graph.id]);
    }
  }

  protected async openGraph(graphId: string): Promise<void> {
    await this.router.navigate(['/graphs', graphId]);
  }
}
