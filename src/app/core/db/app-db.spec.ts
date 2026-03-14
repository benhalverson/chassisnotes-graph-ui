import { TestBed } from '@angular/core/testing';

import { AppDb } from './app-db';

describe('AppDb', () => {
  let service: AppDb;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppDb);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
