import { TestBed } from '@angular/core/testing';

import { TemplatesCatalog } from './templates-catalog';

describe('TemplatesCatalog', () => {
  let service: TemplatesCatalog;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TemplatesCatalog);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
