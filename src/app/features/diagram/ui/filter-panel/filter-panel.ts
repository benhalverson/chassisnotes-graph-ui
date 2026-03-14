import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-filter-panel',
  imports: [],
  templateUrl: './filter-panel.html',
  styleUrl: './filter-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterPanel {}
