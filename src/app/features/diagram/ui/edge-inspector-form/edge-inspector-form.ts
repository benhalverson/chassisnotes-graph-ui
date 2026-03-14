import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DiagramStore } from '../../state/diagram-store';

@Component({
  selector: 'app-edge-inspector-form',
  imports: [],
  templateUrl: './edge-inspector-form.html',
  styleUrl: './edge-inspector-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EdgeInspectorForm {
  protected readonly diagramStore = inject(DiagramStore);
  protected readonly selectedEdge = this.diagramStore.selectedEdge;
}
