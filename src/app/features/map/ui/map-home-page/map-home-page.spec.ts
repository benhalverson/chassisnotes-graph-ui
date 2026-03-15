import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { GraphsRepository } from '../../../../core/db/repositories/graphs-repository';
import { DiagramStore } from '../../../diagram/state/diagram-store';
import { MapHomePage } from './map-home-page';

describe('MapHomePage', () => {
  let component: MapHomePage;
  let fixture: ComponentFixture<MapHomePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapHomePage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({})),
            queryParamMap: of(convertToParamMap({})),
          },
        },
        {
          provide: GraphsRepository,
          useValue: {
            listGraphs: vi.fn(async () => []),
            resolveActiveGraphId: vi.fn(async () => null),
            setActiveGraphId: vi.fn(async () => undefined),
          },
        },
        {
          provide: DiagramStore,
          useValue: {
            graph: () => null,
            loadGraph: vi.fn(async () => undefined),
            clear: vi.fn(),
            addNode: vi.fn(async () => undefined),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MapHomePage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
