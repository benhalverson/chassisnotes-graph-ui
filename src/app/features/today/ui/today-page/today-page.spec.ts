import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { GraphsRepository } from '../../../../core/db/repositories/graphs-repository';
import { TodayPage } from './today-page';

describe('TodayPage', () => {
  let component: TodayPage;
  let fixture: ComponentFixture<TodayPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodayPage],
      providers: [
        provideRouter([]),
        {
          provide: GraphsRepository,
          useValue: {
            loadActiveGraph: vi.fn(async () => null),
            listTemplates: vi.fn(async () => []),
            listGraphs: vi.fn(async () => []),
            createGraphFromTemplate: vi.fn(async () => null),
            resolveActiveGraphId: vi.fn(async () => null),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TodayPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
