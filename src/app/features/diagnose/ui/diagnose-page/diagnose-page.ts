import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';

type DiagnosePhase = 'entry' | 'mid' | 'exit' | 'bumps' | 'jumps';
type DiagnoseSymptom =
  | 'push'
  | 'lazy-rotation'
  | 'rear-loose'
  | 'poor-forward-bite';

type SuggestionCard = {
  title: string;
  confidence: 'low' | 'medium' | 'high';
  note: string;
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

const SUGGESTIONS: Record<DiagnoseSymptom, SuggestionCard[]> = {
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
  protected readonly phaseOptions = PHASE_OPTIONS;
  protected readonly symptomOptions = SYMPTOM_OPTIONS;
  protected readonly selectedPhase = signal<DiagnosePhase>('entry');
  protected readonly selectedSymptom = signal<DiagnoseSymptom>('lazy-rotation');
  protected readonly phaseLabel = computed(
    () =>
      this.phaseOptions.find((phase) => phase.id === this.selectedPhase())
        ?.label ?? 'Entry',
  );
  protected readonly suggestions = computed(
    () => SUGGESTIONS[this.selectedSymptom()],
  );
}
