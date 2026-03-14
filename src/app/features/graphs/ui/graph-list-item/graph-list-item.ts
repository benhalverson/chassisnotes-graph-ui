import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import type { GraphRecord } from '../../../../core/models/graph.models';

@Component({
  selector: 'app-graph-list-item',
  imports: [],
  templateUrl: './graph-list-item.html',
  styleUrl: './graph-list-item.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphListItem {
  readonly graph = input<GraphRecord | null>(null);
  readonly openGraph = output<string>();
  readonly duplicateGraph = output<string>();
  readonly deleteGraph = output<string>();

  protected formatUpdatedAt(updatedAt: string): string {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(updatedAt));
  }
}
