import { TestBed } from '@angular/core/testing';

import { ImportValidator } from './import-validator';

describe('ImportValidator', () => {
  let service: ImportValidator;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImportValidator);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
