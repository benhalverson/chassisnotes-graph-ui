import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'app-graph-library-toolbar',
  imports: [],
  templateUrl: './graph-library-toolbar.html',
  styleUrl: './graph-library-toolbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphLibraryToolbar {
  readonly defaultTemplateLabel = input('starter template');
  readonly createRequested = output<void>();
}
