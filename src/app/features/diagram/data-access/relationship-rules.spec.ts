import { TestBed } from '@angular/core/testing';

import { RelationshipRules } from './relationship-rules';

describe('RelationshipRules', () => {
  let service: RelationshipRules;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RelationshipRules);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
