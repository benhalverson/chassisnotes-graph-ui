import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GraphListItem } from '../graph-list-item/graph-list-item';

@Component({
  selector: 'app-graph-list',
  imports: [GraphListItem],
  templateUrl: './graph-list.html',
  styleUrl: './graph-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphList {}
