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

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.diagramStore.clearValidationError();
    });

    effect(() => {
      this.resetFormState(this.selectedEdge());
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
      }

      return nextPhaseTags;
    });
  }

  protected resetChanges(): void {
    this.resetFormState(this.selectedEdge());
    this.diagramStore.clearValidationError();
  }

  protected async saveEdge(): Promise<void> {
    const edge = this.selectedEdge();

    if (!edge) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    const relationshipType = this.form.controls.relationshipType.value;

    const saved = await this.diagramStore.updateEdge(edge.id, {
      relationshipType,
      label: relationshipType,
      description: this.form.controls.description.value.trim(),
      confidence: this.form.controls.confidence.value,
      evidenceType: this.form.controls.evidenceType.value || undefined,
      phaseTags: this.selectedPhaseTags(),
    });

    if (saved) {
      this.form.markAsPristine();
      this.phaseTagsDirty.set(false);
      this.diagramStore.clearValidationError();
    }
  }

  protected deleteEdge(): void {
    void this.diagramStore.deleteSelectedEdge();
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
}
