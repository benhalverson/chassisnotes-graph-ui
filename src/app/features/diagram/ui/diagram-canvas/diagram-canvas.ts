import { isPlatformBrowser } from '@angular/common';
import type { OnDestroy } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Injector,
  inject,
  input,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  type ModelAdapter,
  NgDiagramBaseNodeTemplateComponent,
  NgDiagramComponent,
  type NgDiagramNodeTemplate,
  NgDiagramNodeTemplateMap,
  type NodeDragEndedEvent,
  type NodeDragStartedEvent,
  provideNgDiagram,
  type SelectionGestureEndedEvent,
  type SimpleNode,
} from 'ng-diagram';
import { combineLatest } from 'rxjs';
import type {
  ConfidenceLevel,
  GraphNodeType,
  GraphPhaseTag,
} from '../../../../core/models/graph.models';
import { buildDiagramModel, DiagramStore } from '../../state/diagram-store';

type DiagramNodeData = {
  type: GraphNodeType;
  label: string;
  category: string;
  subtype: string;
  description: string;
  phaseTags: GraphPhaseTag[];
  confidence: ConfidenceLevel;
};

@Component({
  imports: [NgDiagramBaseNodeTemplateComponent],
  template: `
    <ng-diagram-base-node-template
      [node]="node()"
      [style.--ngd-node-border-color]="nodeBorderColor()"
      [style.--ngd-node-border-color-hover]="nodeBorderHoverColor()"
      [style.--ngd-selected-node-box-shadow]="selectedNodeShadow()"
    >
      <article [class]="contentClasses()" [attr.aria-label]="node().data.label">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p [class]="categoryClasses()">{{ node().data.category }}</p>
            <h3 class="mt-1 text-sm font-semibold text-slate-50">{{ node().data.label }}</h3>
          </div>
          <span [class]="confidenceClasses()">{{ node().data.confidence }}</span>
        </div>

        <p class="mt-2 rounded-md border border-slate-800/80 bg-slate-900/80 px-2 py-1 text-[11px] text-slate-300">
          {{ node().data.subtype || 'General' }}
        </p>

        @if (node().data.description) {
          <p class="mt-2 max-h-16 overflow-hidden text-xs leading-5 text-slate-300">
            {{ node().data.description }}
          </p>
        }

        @if (node().data.phaseTags.length) {
          <ul class="mt-3 flex flex-wrap gap-1" aria-label="Phase tags">
            @for (phase of node().data.phaseTags; track phase) {
              <li class="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-300">
                {{ phase }}
              </li>
            }
          </ul>
        }
      </article>
    </ng-diagram-base-node-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class GraphNodeTemplate implements NgDiagramNodeTemplate<DiagramNodeData> {
  readonly node = input.required<SimpleNode<DiagramNodeData>>();

  protected readonly contentClasses = computed(() => {
    return [
      'relative block min-w-[14rem] max-w-[16rem] px-3 py-3 text-slate-100',
    ].join(' ');
  });

  protected readonly nodeBorderColor = computed(() =>
    borderColorForType(this.node().data.type),
  );

  protected readonly nodeBorderHoverColor = computed(() =>
    borderHoverColorForType(this.node().data.type),
  );

  protected readonly selectedNodeShadow = computed(
    () => `0 0 0 0.25rem ${selectedNodeShadowForType(this.node().data.type)}`,
  );

  protected readonly categoryClasses = computed(() => {
    const toneClass = (() => {
      switch (this.node().data.type) {
        case 'setup':
          return 'text-sky-300';
        case 'symptom':
          return 'text-amber-300';
        case 'outcome':
          return 'text-emerald-300';
        case 'condition':
          return 'text-violet-300';
        case 'experiment':
          return 'text-rose-300';
        case 'group':
          return 'text-slate-300';
      }
    })();

    return `text-[11px] font-semibold uppercase tracking-[0.18em] ${toneClass}`;
  });

  protected readonly confidenceClasses = computed(() => {
    const toneClass = (() => {
      switch (this.node().data.confidence) {
        case 'high':
          return 'bg-emerald-300';
        case 'medium':
          return 'bg-amber-300';
        case 'low':
          return 'bg-slate-300';
      }
    })();

    return `rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-950 ${toneClass}`;
  });
}

@Component({
  selector: 'app-diagram-canvas',
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  templateUrl: './diagram-canvas.html',
  styleUrl: './diagram-canvas.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagramCanvas implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly injector = inject(Injector);
  protected readonly diagramStore = inject(DiagramStore);
  private activeGraphId: string | null = null;
  private dragInProgress = false;
  private skipNextModelRefresh = false;
  private lastGraphRef: object | null = null;
  private lastNodesRef: readonly unknown[] | null = null;
  private lastEdgesRef: readonly unknown[] | null = null;

  protected readonly isBrowser = isPlatformBrowser(this.platformId);
  protected readonly graphTitle = computed(() =>
    this.diagramStore.graphTitle(),
  );
  protected readonly activeModel = signal<ModelAdapter | null>(null);
  protected readonly canvasError = signal<string | null>(null);
  protected readonly nodeTemplateMap = new NgDiagramNodeTemplateMap([
    ['graph-node', GraphNodeTemplate],
  ]);

  constructor() {
    combineLatest([
      toObservable(this.diagramStore.graph),
      toObservable(this.diagramStore.nodes),
      toObservable(this.diagramStore.edges),
    ])
      .pipe(takeUntilDestroyed())
      .subscribe(([graph, nodes, edges]) => {
        if (!this.isBrowser || !graph) {
          this.destroyActiveModel();
          this.canvasError.set(null);

          return;
        }

        try {
          const selection = this.diagramStore.selection();
          const currentModel = this.activeModel();
          const graphChanged = this.lastGraphRef !== graph;
          const nodesChanged = this.lastNodesRef !== nodes;
          const edgesChanged = this.lastEdgesRef !== edges;

          if (!currentModel || this.activeGraphId !== graph.id) {
            this.destroyActiveModel();
            this.activeModel.set(
              buildDiagramModel(
                {
                  graph,
                  nodes,
                  edges,
                },
                selection,
                this.injector,
              ),
            );
            this.activeGraphId = graph.id;
          } else if (graphChanged || nodesChanged || edgesChanged) {
            if (this.dragInProgress) {
              return;
            }

            if (this.skipNextModelRefresh) {
              this.skipNextModelRefresh = false;
            } else {
              this.destroyActiveModel();
              this.activeModel.set(
                buildDiagramModel(
                  {
                    graph,
                    nodes,
                    edges,
                  },
                  selection,
                  this.injector,
                ),
              );
              this.activeGraphId = graph.id;
            }
          }

          this.lastGraphRef = graph;
          this.lastNodesRef = nodes;
          this.lastEdgesRef = edges;

          this.canvasError.set(null);
        } catch (error) {
          console.error('Diagram canvas render failed.', error);
          this.destroyActiveModel();
          this.canvasError.set(
            error instanceof Error ? error.message : 'Unknown canvas error.',
          );
        }
      });
  }

  ngOnDestroy(): void {
    this.destroyActiveModel();
  }

  protected onSelectionChanged(event: SelectionGestureEndedEvent): void {
    this.diagramStore.updateSelection(
      event.nodes.map((node) => node.id),
      event.edges.map((edge) => edge.id),
    );
  }

  protected onNodeDragStarted(_event: NodeDragStartedEvent): void {
    this.dragInProgress = true;
  }

  protected onNodeDragEnded(event: NodeDragEndedEvent): void {
    this.skipNextModelRefresh = true;
    void this.diagramStore.syncNodePositions(
      event.nodes.map((node) => ({
        id: node.id,
        position: node.position,
      })),
    );
    this.dragInProgress = false;
  }

  private destroyActiveModel(): void {
    this.activeModel()?.destroy();
    this.activeModel.set(null);
    this.activeGraphId = null;
    this.lastGraphRef = null;
    this.lastNodesRef = null;
    this.lastEdgesRef = null;
  }
}

function borderColorForType(type: GraphNodeType): string {
  switch (type) {
    case 'setup':
      return 'rgb(14 165 233 / 0.45)';
    case 'symptom':
      return 'rgb(245 158 11 / 0.45)';
    case 'outcome':
      return 'rgb(16 185 129 / 0.45)';
    case 'condition':
      return 'rgb(139 92 246 / 0.45)';
    case 'experiment':
      return 'rgb(244 63 94 / 0.45)';
    case 'group':
      return 'rgb(71 85 105)';
  }
}

function borderHoverColorForType(type: GraphNodeType): string {
  switch (type) {
    case 'setup':
      return 'rgb(56 189 248 / 0.8)';
    case 'symptom':
      return 'rgb(251 191 36 / 0.8)';
    case 'outcome':
      return 'rgb(52 211 153 / 0.8)';
    case 'condition':
      return 'rgb(167 139 250 / 0.8)';
    case 'experiment':
      return 'rgb(251 113 133 / 0.8)';
    case 'group':
      return 'rgb(148 163 184 / 0.8)';
  }
}

function selectedNodeShadowForType(type: GraphNodeType): string {
  switch (type) {
    case 'setup':
      return 'rgb(56 189 248 / 0.35)';
    case 'symptom':
      return 'rgb(251 191 36 / 0.35)';
    case 'outcome':
      return 'rgb(52 211 153 / 0.35)';
    case 'condition':
      return 'rgb(167 139 250 / 0.35)';
    case 'experiment':
      return 'rgb(251 113 133 / 0.35)';
    case 'group':
      return 'rgb(148 163 184 / 0.35)';
  }
}
