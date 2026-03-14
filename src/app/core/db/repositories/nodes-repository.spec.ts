import { TestBed } from '@angular/core/testing';

import { NodesRepository } from './nodes-repository';

describe('NodesRepository', () => {
  let service: NodesRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NodesRepository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
