import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EditorShell } from '../editor-shell/editor-shell';

@Component({
  selector: 'app-graph-editor-page',
  imports: [EditorShell],
  templateUrl: './graph-editor-page.html',
  styleUrl: './graph-editor-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphEditorPage {}
