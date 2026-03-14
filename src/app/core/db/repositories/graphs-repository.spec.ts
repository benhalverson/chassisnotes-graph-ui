import { TestBed } from '@angular/core/testing';

import { GraphsRepository } from './graphs-repository';

describe('GraphsRepository', () => {
  let service: GraphsRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GraphsRepository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
