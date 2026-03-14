import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CanvasToolbar } from '../canvas-toolbar/canvas-toolbar';
import { DiagramCanvas } from '../diagram-canvas/diagram-canvas';
import { LeftSidebar } from '../left-sidebar/left-sidebar';
import { RightSidebar } from '../right-sidebar/right-sidebar';

@Component({
  selector: 'app-editor-shell',
  imports: [LeftSidebar, CanvasToolbar, DiagramCanvas, RightSidebar],
  templateUrl: './editor-shell.html',
  styleUrl: './editor-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorShell {}
