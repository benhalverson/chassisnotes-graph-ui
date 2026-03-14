import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EdgeInspectorForm } from '../edge-inspector-form/edge-inspector-form';
import { NodeInspectorForm } from '../node-inspector-form/node-inspector-form';

@Component({
  selector: 'app-inspector-panel',
  imports: [NodeInspectorForm, EdgeInspectorForm],
  templateUrl: './inspector-panel.html',
  styleUrl: './inspector-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InspectorPanel {}
