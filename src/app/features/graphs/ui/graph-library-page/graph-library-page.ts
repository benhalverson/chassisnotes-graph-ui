import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GraphLibraryToolbar } from '../graph-library-toolbar/graph-library-toolbar';
import { GraphList } from '../graph-list/graph-list';
import { TemplatePicker } from '../template-picker/template-picker';

@Component({
  selector: 'app-graph-library-page',
  imports: [GraphLibraryToolbar, GraphList, TemplatePicker],
  templateUrl: './graph-library-page.html',
  styleUrl: './graph-library-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphLibraryPage {}
