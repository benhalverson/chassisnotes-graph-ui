import { TestBed } from '@angular/core/testing';

import { UiStore } from './ui-store';

describe('UiStore', () => {
  let service: UiStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UiStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
