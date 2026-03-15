import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { PersistedGraphDocument } from '../../../../core/models/graph.models';
import { CONFIDENCE_LEVELS, GRAPH_PHASE_TAGS } from '../../../../core/models/graph.models';
import { DiagramStore } from '../../../diagram/state/diagram-store';
import { EventsStore } from '../../state/events-store';

type TabId = 'symptom' | 'change' | 'result';

@Component({
  selector: 'app-quick-log-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './quick-log-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'closeRequested.emit()',
  },
})
export class QuickLogDialog implements OnInit {
  readonly graphId = input.required<string>();
  readonly closeRequested = output<void>();
  readonly eventLogged = output<PersistedGraphDocument>();

  private readonly fb = inject(FormBuilder);
  protected readonly diagramStore = inject(DiagramStore);
  protected readonly eventsStore = inject(EventsStore);

  protected readonly activeTab = signal<TabId>('symptom');
  protected readonly busy = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly phaseTags = GRAPH_PHASE_TAGS;
  protected readonly confidenceLevels = CONFIDENCE_LEVELS;
  protected readonly effectOptions = [
    { value: 'improved', label: 'Improved' },
    { value: 'worsened', label: 'Worsened' },
    { value: 'no-change', label: 'No change' },
  ];

  protected readonly symptomForm = this.fb.group({
    symptom: ['', [Validators.required, Validators.minLength(2)]],
    cornerPhase: ['entry' as (typeof GRAPH_PHASE_TAGS)[number], Validators.required],
    confidence: ['low' as (typeof CONFIDENCE_LEVELS)[number], Validators.required],
  });

  protected readonly changeForm = this.fb.group({
    component: ['', [Validators.required, Validators.minLength(2)]],
    fromValue: ['', Validators.required],
    toValue: ['', Validators.required],
    reason: ['', [Validators.required, Validators.minLength(2)]],
  });

  protected readonly resultForm = this.fb.group({
    outcome: ['', [Validators.required, Validators.minLength(2)]],
    effect: ['improved' as 'improved' | 'worsened' | 'no-change', Validators.required],
    notes: [''],
  });

  protected readonly hasExperimentNode = computed(() =>
    this.diagramStore.nodes().some((n) => n.type === 'experiment'),
  );

  ngOnInit(): void {
    void this.eventsStore.loadSession(this.graphId());
  }

  protected setTab(tab: TabId): void {
    this.activeTab.set(tab);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  protected async submitSymptom(): Promise<void> {
    if (this.symptomForm.invalid || this.busy()) return;

    const { symptom, cornerPhase, confidence } = this.symptomForm.getRawValue();
    if (!symptom || !cornerPhase || !confidence) return;

    const document = this.currentDocument();
    if (!document) {
      this.errorMessage.set('No active graph document. Open a graph first.');
      return;
    }

    this.busy.set(true);
    this.errorMessage.set(null);

    try {
      const updatedDocument = await this.eventsStore.logEvent(
        'record-symptom',
        { symptom, cornerPhase, confidence },
        document,
      );
      this.symptomForm.reset({ cornerPhase: 'entry', confidence: 'low' });
      this.successMessage.set(`Symptom "${symptom}" recorded and graph updated.`);
      this.eventLogged.emit(updatedDocument);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Failed to record symptom.',
      );
    } finally {
      this.busy.set(false);
    }
  }

  protected async submitChange(): Promise<void> {
    if (this.changeForm.invalid || this.busy()) return;

    const { component, fromValue, toValue, reason } = this.changeForm.getRawValue();
    if (!component || !fromValue || !toValue || !reason) return;

    const document = this.currentDocument();
    if (!document) {
      this.errorMessage.set('No active graph document. Open a graph first.');
      return;
    }

    this.busy.set(true);
    this.errorMessage.set(null);

    try {
      const updatedDocument = await this.eventsStore.logEvent(
        'log-setup-change',
        { component, fromValue, toValue, reason },
        document,
      );
      this.changeForm.reset();
      this.successMessage.set(`Setup change "${component}" logged and graph updated.`);
      this.eventLogged.emit(updatedDocument);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Failed to log setup change.',
      );
    } finally {
      this.busy.set(false);
    }
  }

  protected async submitResult(): Promise<void> {
    if (this.resultForm.invalid || this.busy()) return;

    const { outcome, effect, notes } = this.resultForm.getRawValue();
    if (!outcome || !effect) return;

    const document = this.currentDocument();
    if (!document) {
      this.errorMessage.set('No active graph document. Open a graph first.');
      return;
    }

    this.busy.set(true);
    this.errorMessage.set(null);

    try {
      const updatedDocument = await this.eventsStore.logEvent(
        'record-result',
        { outcome, effect, notes: notes ?? '' },
        document,
      );
      this.resultForm.reset({ effect: 'improved' });
      this.successMessage.set(`Result "${outcome}" recorded and graph updated.`);
      this.eventLogged.emit(updatedDocument);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Failed to record result.',
      );
    } finally {
      this.busy.set(false);
    }
  }

  private currentDocument(): PersistedGraphDocument | null {
    const graph = this.diagramStore.graph();
    if (!graph) return null;
    return {
      graph,
      nodes: this.diagramStore.nodes(),
      edges: this.diagramStore.edges(),
    };
  }
}
