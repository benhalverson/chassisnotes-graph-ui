import { TestBed } from '@angular/core/testing';

import { GraphJsonIo } from './graph-json-io';

describe('GraphJsonIo', () => {
  let service: GraphJsonIo;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GraphJsonIo);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
