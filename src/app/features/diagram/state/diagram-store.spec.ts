import { TestBed } from '@angular/core/testing';

import { DiagramStore } from './diagram-store';

describe('DiagramStore', () => {
  let service: DiagramStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DiagramStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
