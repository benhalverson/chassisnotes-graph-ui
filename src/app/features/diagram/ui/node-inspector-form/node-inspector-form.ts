import {
  ChangeDetectionStrategy,
  Component,
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
  GRAPH_PHASE_TAGS,
  type GraphPhaseTag,
} from '../../../../core/models/graph.models';
import { Autosave } from '../../data-access/autosave';
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
  private readonly autosave = inject(Autosave);

  protected readonly selectedNode = this.diagramStore.selectedNode;
  protected readonly confidenceLevels = CONFIDENCE_LEVELS;
  protected readonly phaseTags = GRAPH_PHASE_TAGS;
  protected readonly selectedPhaseTags = signal<GraphPhaseTag[]>([]);
  protected readonly autosaveStatus = signal<
    'idle' | 'pending' | 'saving' | 'saved' | 'error'
  >('idle');
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
  private autosaveKey: string | null = null;

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.queueAutosave();
    });

    effect(() => {
      const node = this.selectedNode();
      const nextAutosaveKey = node ? `node:${node.id}` : null;

      if (this.autosaveKey && this.autosaveKey !== nextAutosaveKey) {
        this.autosave.cancel(this.autosaveKey);
      }

      this.autosaveKey = nextAutosaveKey;

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
        this.autosaveStatus.set('idle');

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
      this.autosaveStatus.set('idle');
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

    this.queueAutosave();
  }

  protected saveNode(): void {
    this.cancelPendingAutosave();
    void this.persistNode();
  }

  protected deleteNode(): void {
    this.cancelPendingAutosave();
    void this.diagramStore.deleteSelectedNode();
  }

  private queueAutosave(): void {
    const node = this.selectedNode();

    if (!node || !this.autosaveKey) {
      return;
    }

    if (this.form.invalid) {
      this.autosave.cancel(this.autosaveKey);
      this.autosaveStatus.set('idle');

      return;
    }

    const title = this.form.controls.title.value.trim();

    if (!title) {
      this.autosave.cancel(this.autosaveKey);
      this.autosaveStatus.set('idle');

      return;
    }

    const payload = {
      title,
      subtype: this.form.controls.subtype.value.trim(),
      description: this.form.controls.description.value.trim(),
      confidence: this.form.controls.confidence.value,
      phaseTags: this.selectedPhaseTags(),
    };

    this.autosaveStatus.set('pending');
    this.autosave.schedule(this.autosaveKey, async () => {
      this.autosaveStatus.set('saving');

      try {
        await this.diagramStore.updateNode(node.id, payload);

        if (this.selectedNode()?.id === node.id) {
          this.form.markAsPristine();
          this.autosaveStatus.set('saved');
        }
      } catch {
        this.autosaveStatus.set('error');
      }
    });
  }

  private async persistNode(): Promise<void> {
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

    this.autosaveStatus.set('saving');

    try {
      await this.diagramStore.updateNode(node.id, {
        title,
        subtype: this.form.controls.subtype.value.trim(),
        description: this.form.controls.description.value.trim(),
        confidence: this.form.controls.confidence.value,
        phaseTags: this.selectedPhaseTags(),
      });
      this.form.markAsPristine();
      this.autosaveStatus.set('saved');
    } catch {
      this.autosaveStatus.set('error');
    }
  }

  private cancelPendingAutosave(): void {
    if (!this.autosaveKey) {
      return;
    }

    this.autosave.cancel(this.autosaveKey);
  }
}
