import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  CONFIDENCE_LEVELS,
  type ConfidenceLevel,
  GRAPH_PHASE_TAGS,
  type GraphPhaseTag,
} from '../../../../core/models/graph.models';
import { DiagramStore } from '../../state/diagram-store';

@Component({
  selector: 'app-node-inspector-form',
  imports: [ReactiveFormsModule],
  templateUrl: './node-inspector-form.html',
  styleUrl: './node-inspector-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeInspectorForm {
  private readonly diagramStore = inject(DiagramStore);

  protected readonly selectedNode = this.diagramStore.selectedNode;
  protected readonly confidenceLevels = CONFIDENCE_LEVELS;
  protected readonly phaseTags = GRAPH_PHASE_TAGS;
  protected readonly selectedPhaseTags = signal<GraphPhaseTag[]>([]);
  protected readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    subtype: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    confidence: new FormControl<ConfidenceLevel>('low', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor() {
    effect(() => {
      const node = this.selectedNode();

      if (!node) {
        this.form.reset(
          {
            title: '',
            subtype: '',
            description: '',
            confidence: 'low',
          },
          { emitEvent: false },
        );
        this.selectedPhaseTags.set([]);
        this.form.markAsPristine();

        return;
      }

      this.form.reset(
        {
          title: node.title,
          subtype: node.subtype,
          description: node.description,
          confidence: node.confidence,
        },
        { emitEvent: false },
      );
      this.selectedPhaseTags.set([...node.phaseTags]);
      this.form.markAsPristine();
    });
  }

  protected hasPhaseTag(tag: GraphPhaseTag): boolean {
    return this.selectedPhaseTags().includes(tag);
  }

  protected togglePhaseTag(tag: GraphPhaseTag, checked: boolean): void {
    this.selectedPhaseTags.update((phaseTags) => {
      if (checked) {
        return phaseTags.includes(tag) ? phaseTags : [...phaseTags, tag];
      }

      return phaseTags.filter((phase) => phase !== tag);
    });
  }

  protected saveNode(): void {
    const node = this.selectedNode();

    if (!node) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    const title = this.form.controls.title.value.trim();

    if (!title) {
      this.form.controls.title.setErrors({ required: true });
      this.form.controls.title.markAsTouched();

      return;
    }

    void this.diagramStore.updateNode(node.id, {
      title,
      subtype: this.form.controls.subtype.value.trim(),
      description: this.form.controls.description.value.trim(),
      confidence: this.form.controls.confidence.value,
      phaseTags: this.selectedPhaseTags(),
    });
  }

  protected deleteNode(): void {
    void this.diagramStore.deleteSelectedNode();
  }
}
