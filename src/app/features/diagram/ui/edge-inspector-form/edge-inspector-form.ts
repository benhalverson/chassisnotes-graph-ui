import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  CONFIDENCE_LEVELS,
  type ConfidenceLevel,
  EVIDENCE_TYPES,
  type EvidenceType,
  GRAPH_PHASE_TAGS,
  type GraphEdgeRecord,
  type GraphPhaseTag,
  RELATIONSHIP_TYPES,
  type RelationshipType,
} from '../../../../core/models/graph.models';
import { Autosave } from '../../data-access/autosave';
import { DiagramStore } from '../../state/diagram-store';

@Component({
  selector: 'app-edge-inspector-form',
  imports: [ReactiveFormsModule],
  templateUrl: './edge-inspector-form.html',
  styleUrl: './edge-inspector-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EdgeInspectorForm {
  protected readonly diagramStore = inject(DiagramStore);
  private readonly autosave = inject(Autosave);
  protected readonly selectedEdge = this.diagramStore.selectedEdge;
  protected readonly selectedEdgeContext = computed(() => {
    const edge = this.selectedEdge();

    if (!edge) {
      return null;
    }

    const nodes = this.diagramStore.nodes();
    const sourceNode = nodes.find((node) => node.id === edge.sourceNodeId);
    const targetNode = nodes.find((node) => node.id === edge.targetNodeId);

    return {
      edge,
      sourceTitle: sourceNode?.title ?? edge.sourceNodeId.slice(0, 8),
      targetTitle: targetNode?.title ?? edge.targetNodeId.slice(0, 8),
    };
  });
  protected readonly relationshipTypes = RELATIONSHIP_TYPES;
  protected readonly confidenceLevels = CONFIDENCE_LEVELS;
  protected readonly evidenceTypes = EVIDENCE_TYPES;
  protected readonly phaseTags = GRAPH_PHASE_TAGS;
  protected readonly selectedPhaseTags = signal<GraphPhaseTag[]>([]);
  protected readonly phaseTagsDirty = signal(false);
  protected readonly autosaveStatus = signal<'idle' | 'pending' | 'saving' | 'saved' | 'error'>('idle');
  protected readonly form = new FormGroup({
    relationshipType: new FormControl<RelationshipType>('influences', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl('', { nonNullable: true }),
    confidence: new FormControl<ConfidenceLevel>('low', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    evidenceType: new FormControl<EvidenceType | ''>('', {
      nonNullable: true,
    }),
  });
  protected readonly hasUnsavedChanges = computed(
    () => this.form.dirty || this.phaseTagsDirty(),
  );
  private autosaveKey: string | null = null;

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.diagramStore.clearValidationError();
      this.queueAutosave();
    });

    effect(() => {
      const edge = this.selectedEdge();
      const nextAutosaveKey = edge ? `edge:${edge.id}` : null;

      if (this.autosaveKey && this.autosaveKey !== nextAutosaveKey) {
        this.autosave.cancel(this.autosaveKey);
      }

      this.autosaveKey = nextAutosaveKey;
      this.resetFormState(this.selectedEdge());
      this.autosaveStatus.set('idle');
      this.diagramStore.clearValidationError();
    });
  }

  protected hasPhaseTag(tag: GraphPhaseTag): boolean {
    return this.selectedPhaseTags().includes(tag);
  }

  protected togglePhaseTag(tag: GraphPhaseTag, checked: boolean): void {
    this.selectedPhaseTags.update((phaseTags) => {
      const nextPhaseTags = checked
        ? phaseTags.includes(tag)
          ? phaseTags
          : [...phaseTags, tag]
        : phaseTags.filter((phase) => phase !== tag);

      if (nextPhaseTags.length !== phaseTags.length) {
        this.phaseTagsDirty.set(true);
        this.diagramStore.clearValidationError();
        this.queueAutosave();
      }

      return nextPhaseTags;
    });
  }

  protected resetChanges(): void {
    this.cancelPendingAutosave();
    this.resetFormState(this.selectedEdge());
    this.autosaveStatus.set('idle');
    this.diagramStore.clearValidationError();
  }

  protected async saveEdge(): Promise<void> {
    this.cancelPendingAutosave();
    const edge = this.selectedEdge();

    if (!edge) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    const relationshipType = this.form.controls.relationshipType.value;

    this.autosaveStatus.set('saving');
    const saved = await this.diagramStore.updateEdge(
      edge.id,
      createEdgePayload(
        relationshipType,
        this.form.controls.description.value,
        this.form.controls.confidence.value,
        this.form.controls.evidenceType.value,
        this.selectedPhaseTags(),
      ),
    );

    if (saved) {
      this.form.markAsPristine();
      this.phaseTagsDirty.set(false);
      this.autosaveStatus.set('saved');
      this.diagramStore.clearValidationError();

      return;
    }

    this.autosaveStatus.set('error');
  }

  protected deleteEdge(): void {
    this.cancelPendingAutosave();
    void this.diagramStore.deleteSelectedEdge();
  }

  private queueAutosave(): void {
    const edge = this.selectedEdge();

    if (!edge || !this.autosaveKey || this.form.invalid || !this.hasUnsavedChanges()) {
      return;
    }

    const relationshipType = this.form.controls.relationshipType.value;
    const payload = createEdgePayload(
      relationshipType,
      this.form.controls.description.value,
      this.form.controls.confidence.value,
      this.form.controls.evidenceType.value,
      this.selectedPhaseTags(),
    );

    this.autosaveStatus.set('pending');
    this.autosave.schedule(this.autosaveKey, async () => {
      this.autosaveStatus.set('saving');

      const saved = await this.diagramStore.updateEdge(edge.id, payload);

      if (saved && this.selectedEdge()?.id === edge.id) {
        this.form.markAsPristine();
        this.phaseTagsDirty.set(false);
        this.autosaveStatus.set('saved');
        this.diagramStore.clearValidationError();

        return;
      }

      this.autosaveStatus.set('error');
    });
  }

  private resetFormState(edge: GraphEdgeRecord | null): void {
    if (!edge) {
      this.form.reset(
        {
          relationshipType: 'influences',
          description: '',
          confidence: 'low',
          evidenceType: '',
        },
        { emitEvent: false },
      );
      this.selectedPhaseTags.set([]);
      this.phaseTagsDirty.set(false);
      this.form.markAsPristine();

      return;
    }

    this.form.reset(
      {
        relationshipType: edge.relationshipType,
        description: edge.description,
        confidence: edge.confidence,
        evidenceType: edge.evidenceType ?? '',
      },
      { emitEvent: false },
    );
    this.selectedPhaseTags.set([...edge.phaseTags]);
    this.phaseTagsDirty.set(false);
    this.form.markAsPristine();
  }

  private cancelPendingAutosave(): void {
    if (!this.autosaveKey) {
      return;
    }

    this.autosave.cancel(this.autosaveKey);
  }
}

function createEdgePayload(
  relationshipType: RelationshipType,
  description: string,
  confidence: ConfidenceLevel,
  evidenceType: EvidenceType | '',
  phaseTags: GraphPhaseTag[],
) {
  return {
    relationshipType,
    label: relationshipType,
    description: description.trim(),
    confidence,
    evidenceType: evidenceType || undefined,
    phaseTags,
  };
}
