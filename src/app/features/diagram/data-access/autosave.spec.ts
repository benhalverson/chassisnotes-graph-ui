import { TestBed } from '@angular/core/testing';

import { Autosave } from './autosave';

describe('Autosave', () => {
  let service: Autosave;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Autosave);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
