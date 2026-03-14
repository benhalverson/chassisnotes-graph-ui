import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-diagram-canvas',
  imports: [],
  templateUrl: './diagram-canvas.html',
  styleUrl: './diagram-canvas.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagramCanvas {}
