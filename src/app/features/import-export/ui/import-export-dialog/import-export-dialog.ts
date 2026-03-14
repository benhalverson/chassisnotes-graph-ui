import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-import-export-dialog',
  imports: [],
  templateUrl: './import-export-dialog.html',
  styleUrl: './import-export-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportExportDialog {}
