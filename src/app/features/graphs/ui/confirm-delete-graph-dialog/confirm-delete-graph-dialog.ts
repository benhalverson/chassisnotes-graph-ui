import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'app-confirm-delete-graph-dialog',
  imports: [],
  templateUrl: './confirm-delete-graph-dialog.html',
  styleUrl: './confirm-delete-graph-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDeleteGraphDialog {
  readonly graphName = input('this graph');
  readonly confirmDelete = output<void>();
  readonly cancelDelete = output<void>();
}
