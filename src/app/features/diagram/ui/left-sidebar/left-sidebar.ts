import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FilterPanel } from '../filter-panel/filter-panel';
import { NodePalette } from '../node-palette/node-palette';

@Component({
  selector: 'app-left-sidebar',
  imports: [NodePalette, FilterPanel],
  templateUrl: './left-sidebar.html',
  styleUrl: './left-sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeftSidebar {}
