import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';
import Dexie from 'dexie';
import { IDBKeyRange, indexedDB } from 'fake-indexeddb';

import { AppDb } from './app-db';

describe('AppDb', () => {
  let service: AppDb;

  beforeAll(() => {
    Dexie.dependencies.indexedDB = indexedDB;
    Dexie.dependencies.IDBKeyRange = IDBKeyRange;
  });

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppDb);
  });

  afterEach(async () => {
    await Promise.all([
      service.graphs.clear(),
      service.nodes.clear(),
      service.edges.clear(),
      service.templates.clear(),
      service.preferences.clear(),
      service.sessions.clear(),
      service.events.clear(),
    ]);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should expose the milestone 8 Dexie tables', () => {
    expect(service.tables.map((table) => table.name)).toEqual([
      'graphs',
      'nodes',
      'edges',
      'templates',
      'preferences',
      'sessions',
      'events',
    ]);
  });
});
