import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import type { GraphNodeType } from '../../../../core/models/graph.models';
import { DiagramStore } from '../../state/diagram-store';

type PaletteItem = {
  type: Exclude<GraphNodeType, 'group'>;
  label: string;
  description: string;
  className: string;
};

@Component({
  selector: 'app-node-palette',
  imports: [],
  templateUrl: './node-palette.html',
  styleUrl: './node-palette.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodePalette {
  protected readonly diagramStore = inject(DiagramStore);
  protected readonly items: readonly PaletteItem[] = [
    {
      type: 'setup',
      label: 'Setup',
      description: 'Add a setup lever to tune.',
      className: 'border-sky-500/40 bg-sky-500/10 hover:border-sky-400',
    },
    {
      type: 'symptom',
      label: 'Symptom',
      description: 'Capture a handling problem.',
      className: 'border-amber-500/40 bg-amber-500/10 hover:border-amber-400',
    },
    {
      type: 'outcome',
      label: 'Outcome',
      description: 'Describe the expected result.',
      className:
        'border-emerald-500/40 bg-emerald-500/10 hover:border-emerald-400',
    },
    {
      type: 'condition',
      label: 'Condition',
      description: 'Note a track or grip context.',
      className:
        'border-violet-500/40 bg-violet-500/10 hover:border-violet-400',
    },
    {
      type: 'experiment',
      label: 'Experiment',
      description: 'Log a change you tested.',
      className: 'border-rose-500/40 bg-rose-500/10 hover:border-rose-400',
    },
  ];

  protected addNode(type: Exclude<GraphNodeType, 'group'>): void {
    void this.diagramStore.addNode(type);
  }
}
