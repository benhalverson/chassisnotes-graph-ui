import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import type { TemplateRecord } from '../../../../core/models/graph.models';

@Component({
  selector: 'app-template-picker',
  imports: [],
  templateUrl: './template-picker.html',
  styleUrl: './template-picker.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatePicker {
  readonly templates = input<TemplateRecord[]>([]);
  readonly createFromTemplate = output<string>();
}
