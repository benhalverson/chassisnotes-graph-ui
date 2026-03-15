import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import type { ConfidenceLevel, GraphPhaseTag } from '../../../../core/models/graph.models';
import { DiagramStore } from '../../../diagram/state/diagram-store';
import {
  SuggestionEngine,
  type ExperimentHistoryEntry,
} from '../../data-access/suggestion-engine';

type DiagnosePhase = Extract<GraphPhaseTag, 'entry' | 'mid' | 'exit' | 'bumps' | 'jumps'>;
type DiagnoseSymptom =
  | 'push'
  | 'lazy-rotation'
  | 'rear-loose'
  | 'poor-forward-bite';

/** Unified display type covering both graph-derived and static suggestions. */
export type SuggestionDisplayCard = {
  title: string;
  confidence: ConfidenceLevel;
  /** Descriptive hint text shown for static fallback suggestions. */
  note?: string;
  /** Evidence-based reasoning shown for graph-derived suggestions. */
  reasoning?: string;
};

const PHASE_OPTIONS: Array<{ id: DiagnosePhase; label: string }> = [
  { id: 'entry', label: 'Entry' },
  { id: 'mid', label: 'Mid' },
  { id: 'exit', label: 'Exit' },
  { id: 'bumps', label: 'Bumps' },
  { id: 'jumps', label: 'Jumps' },
];

const SYMPTOM_OPTIONS: Array<{ id: DiagnoseSymptom; label: string }> = [
  { id: 'push', label: 'Push' },
  { id: 'lazy-rotation', label: 'Lazy rotation' },
  { id: 'rear-loose', label: 'Rear loose' },
  { id: 'poor-forward-bite', label: 'Poor forward bite' },
];

const STATIC_SUGGESTIONS: Record<DiagnoseSymptom, SuggestionDisplayCard[]> = {
  push: [
    {
      title: 'Free up front rotation',
      confidence: 'medium',
      note: 'Check front tire, steering rate, and front damping before making larger balance changes.',
    },
    {
      title: 'Reduce front bind on corner entry',
      confidence: 'low',
      note: 'Use this when the car refuses to point in despite stable rear grip.',
    },
  ],
  'lazy-rotation': [
    {
      title: 'Raise rear camber link',
      confidence: 'medium',
      note: 'A familiar first move when the car takes too long to rotate in tight infield corners.',
    },
    {
      title: 'Soften rear spring package',
      confidence: 'low',
      note: 'Useful when the rear is planted but the car will not finish rotation without waiting.',
    },
  ],
  'rear-loose': [
    {
      title: 'Calm rear roll response',
      confidence: 'high',
      note: 'Start with rear toe, rear camber link, or tire support before moving into larger balance changes.',
    },
    {
      title: 'Add rear support over bumps',
      confidence: 'medium',
      note: 'Prioritize this when the rear only breaks free in rough or loaded sections.',
    },
  ],
  'poor-forward-bite': [
    {
      title: 'Increase rear drive on power',
      confidence: 'medium',
      note: 'Look at rear tire support and diff/slipper settings when the car leaves the corner flat.',
    },
    {
      title: 'Reduce drag in the rear suspension',
      confidence: 'low',
      note: 'Check for binding or a balance condition that is keeping the rear from squatting cleanly.',
    },
  ],
};

@Component({
  selector: 'app-diagnose-page',
  imports: [],
  templateUrl: './diagnose-page.html',
  styleUrl: './diagnose-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagnosePage {
  private readonly diagramStore = inject(DiagramStore);
  private readonly suggestionEngine = inject(SuggestionEngine);
  private readonly router = inject(Router);

  protected readonly phaseOptions = PHASE_OPTIONS;
  protected readonly symptomOptions = SYMPTOM_OPTIONS;
  protected readonly selectedPhase = signal<DiagnosePhase>('entry');
  protected readonly selectedSymptom = signal<DiagnoseSymptom>('lazy-rotation');

  protected readonly phaseLabel = computed(
    () =>
      this.phaseOptions.find((phase) => phase.id === this.selectedPhase())
        ?.label ?? 'Entry',
  );

  protected readonly symptomLabel = computed(
    () =>
      this.symptomOptions.find((s) => s.id === this.selectedSymptom())
        ?.label ?? 'Lazy rotation',
  );

  protected readonly hasActiveGraph = computed(
    () => this.diagramStore.hasActiveGraph(),
  );

  protected readonly activeGraphId = computed(
    () => this.diagramStore.graph()?.id ?? null,
  );

  /** Graph-derived suggestions ranked by confidence and evidence strength. */
  protected readonly graphSuggestions = computed<SuggestionDisplayCard[]>(() => {
    const nodes = this.diagramStore.nodes();
    const edges = this.diagramStore.edges();

    if (nodes.length === 0) {
      return [];
    }

    return this.suggestionEngine.getSuggestions({
      symptomLabel: this.symptomLabel(),
      phase: this.selectedPhase(),
      nodes,
      edges,
    }).map(({ title, confidence, reasoning }): SuggestionDisplayCard => ({
      title,
      confidence,
      reasoning,
    }));
  });

  /** Static fallback suggestions shown when no graph is loaded. */
  protected readonly staticSuggestions = computed(
    () => STATIC_SUGGESTIONS[this.selectedSymptom()],
  );

  /**
   * Combined suggestions: graph-derived first, then static fallback.
   * If there are graph-derived suggestions we show only those.
   */
  protected readonly suggestions = computed(() => {
    const graph = this.graphSuggestions();

    return graph.length > 0 ? graph : this.staticSuggestions();
  });

  protected readonly isGraphDerived = computed(
    () => this.graphSuggestions().length > 0,
  );

  /** Experiment history from the loaded graph. */
  protected readonly experimentHistory = computed<ExperimentHistoryEntry[]>(() => {
    const nodes = this.diagramStore.nodes();
    const edges = this.diagramStore.edges();

    return this.suggestionEngine.getExperimentHistory(nodes, edges);
  });

  protected selectPhase(phase: DiagnosePhase): void {
    this.selectedPhase.set(phase);
    this.applySymptomHighlight();
  }

  protected selectSymptom(symptom: DiagnoseSymptom): void {
    this.selectedSymptom.set(symptom);
    this.applySymptomHighlight();
  }

  protected navigateToGraph(): void {
    const graphId = this.activeGraphId();

    if (!graphId) {
      return;
    }

    void this.router.navigate(['/graphs', graphId]);
  }

  private applySymptomHighlight(): void {
    const nodes = this.diagramStore.nodes();
    const edges = this.diagramStore.edges();

    if (nodes.length === 0) {
      return;
    }

    const highlight = this.suggestionEngine.getHighlightSet({
      symptomLabel: this.symptomLabel(),
      phase: this.selectedPhase(),
      nodes,
      edges,
    });

    const allHighlightedNodeIds = [
      ...highlight.symptomNodeIds,
      ...highlight.setupNodeIds,
      ...highlight.outcomeNodeIds,
      ...highlight.experimentNodeIds,
    ];

    this.diagramStore.setSymptomHighlight(
      allHighlightedNodeIds,
      highlight.edgeIds,
    );
  }
}
