import { TestBed } from '@angular/core/testing';

import { PngExport } from './png-export';

describe('PngExport', () => {
  let service: PngExport;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PngExport);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
