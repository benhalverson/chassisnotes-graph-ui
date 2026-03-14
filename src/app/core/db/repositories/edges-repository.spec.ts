import { TestBed } from '@angular/core/testing';

import { EdgesRepository } from './edges-repository';

describe('EdgesRepository', () => {
  let service: EdgesRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EdgesRepository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
