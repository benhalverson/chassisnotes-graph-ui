import { TestBed } from '@angular/core/testing';

import { GraphsStore } from './graphs-store';

describe('GraphsStore', () => {
  let service: GraphsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GraphsStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
