import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportExportDialog } from './import-export-dialog';

describe('ImportExportDialog', () => {
  let component: ImportExportDialog;
  let fixture: ComponentFixture<ImportExportDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportExportDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportExportDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
