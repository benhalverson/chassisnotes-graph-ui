import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-template-picker',
  imports: [],
  templateUrl: './template-picker.html',
  styleUrl: './template-picker.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatePicker {}
