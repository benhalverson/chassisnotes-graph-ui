import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GraphsRepository } from '../../../../core/db/repositories/graphs-repository';
import type { PersistedGraphDocument } from '../../../../core/models/graph.models';

import { DiagnosePage } from './diagnose-page';

describe('DiagnosePage', () => {
  let component: DiagnosePage;
  let fixture: ComponentFixture<DiagnosePage>;

  const graphsRepositorySpy = {
    loadGraph: vi.fn<(graphId: string) => Promise<PersistedGraphDocument | null>>(),
    saveGraphDocument: vi.fn(),
  } satisfies Pick<GraphsRepository, 'loadGraph' | 'saveGraphDocument'>;

  beforeEach(async () => {
    graphsRepositorySpy.loadGraph.mockResolvedValue(null);

    await TestBed.configureTestingModule({
      imports: [DiagnosePage],
      providers: [
        provideRouter([]),
        { provide: GraphsRepository, useValue: graphsRepositorySpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DiagnosePage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render phase selection buttons', () => {
    fixture.detectChanges();
    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll('[aria-label="Select corner phase"] button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should render symptom selection buttons', () => {
    fixture.detectChanges();
    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll('[aria-label="Select symptom"] button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should show static suggestions when no graph is loaded', () => {
    fixture.detectChanges();
    const articles: NodeListOf<HTMLElement> =
      fixture.nativeElement.querySelectorAll('article');
    expect(articles.length).toBeGreaterThan(0);
  });
});

