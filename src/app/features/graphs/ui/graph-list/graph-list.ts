import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import type { GraphRecord } from '../../../../core/models/graph.models';
import { GraphListItem } from '../graph-list-item/graph-list-item';

@Component({
  selector: 'app-graph-list',
  imports: [GraphListItem],
  templateUrl: './graph-list.html',
  styleUrl: './graph-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphList {
  readonly graphs = input<GraphRecord[]>([]);
  readonly openGraph = output<string>();
  readonly duplicateGraph = output<string>();
  readonly deleteGraph = output<string>();
}
