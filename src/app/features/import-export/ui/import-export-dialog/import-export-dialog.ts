import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { GraphsRepository } from '../../../../core/db/repositories/graphs-repository';
import { GraphJsonIo } from '../../data-access/graph-json-io';
import { PngExport } from '../../data-access/png-export';

@Component({
  selector: 'app-import-export-dialog',
  imports: [],
  templateUrl: './import-export-dialog.html',
  styleUrl: './import-export-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'requestClose()',
  },
})
export class ImportExportDialog {
  readonly graphId = input<string | null>(null);
  readonly graphName = input<string | null>(null);
  readonly closeRequested = output<void>();

  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly graphsRepository = inject(GraphsRepository);
  private readonly graphJsonIo = inject(GraphJsonIo);
  private readonly pngExport = inject(PngExport);

  protected readonly isBrowser = isPlatformBrowser(this.platformId);
  protected readonly busy = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly exportDisabled = computed(
    () => !this.graphId() || this.busy(),
  );

  protected requestClose(): void {
    if (this.busy()) {
      return;
    }

    this.closeRequested.emit();
  }

  protected async exportJson(): Promise<void> {
    const graphId = this.graphId();

    if (!graphId) {
      this.errorMessage.set('Open a graph before exporting JSON.');

      return;
    }

    if (!this.isBrowser) {
      this.errorMessage.set('JSON export is available in the browser only.');

      return;
    }

    this.busy.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const payload = await this.graphsRepository.exportGraph(graphId);

      if (!payload) {
        throw new Error('The selected graph could not be exported.');
      }

      const rawJson = this.graphJsonIo.stringify(payload);
      const blob = new Blob([rawJson], { type: 'application/json' });
      const downloadUrl = globalThis.URL.createObjectURL(blob);
      const anchor = globalThis.document.createElement('a');

      anchor.href = downloadUrl;
      anchor.download = this.graphJsonIo.buildFilename(payload.graph);
      anchor.click();
      globalThis.URL.revokeObjectURL(downloadUrl);

      this.successMessage.set('Graph JSON exported.');
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Failed to export graph JSON.',
      );
    } finally {
      this.busy.set(false);
    }
  }

  protected async exportPng(): Promise<void> {
    const graphName = this.graphName();

    if (!graphName) {
      this.errorMessage.set('Open a graph before exporting PNG.');

      return;
    }

    this.busy.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.pngExport.exportCurrentDiagram(graphName);
      this.successMessage.set('Graph PNG exported.');
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Failed to export graph PNG.',
      );
    } finally {
      this.busy.set(false);
    }
  }

  protected async onFileInputChange(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.item(0) ?? null;

    if (target) {
      target.value = '';
    }

    if (!file) {
      return;
    }

    await this.importJson(file);
  }

  private async importJson(file: File): Promise<void> {
    this.busy.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const rawJson = await file.text();
      const parsed = this.graphJsonIo.parse(rawJson);
      const importedGraph = await this.graphsRepository.importGraph(parsed);

      this.successMessage.set('Graph JSON imported. Opening the new graph…');
      this.closeRequested.emit();
      await this.router.navigate(['/graphs', importedGraph.id]);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Failed to import graph JSON.',
      );
    } finally {
      this.busy.set(false);
    }
  }
}
