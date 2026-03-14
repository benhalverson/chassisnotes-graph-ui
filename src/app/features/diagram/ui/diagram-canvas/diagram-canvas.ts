import { isPlatformBrowser } from '@angular/common';
import type { OnDestroy } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  Injector,
  inject,
  input,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  type Edge,
  type EdgeDrawnEvent,
  type ModelAdapter,
  NgDiagramBaseEdgeComponent,
  NgDiagramBaseEdgeLabelComponent,
  NgDiagramBaseNodeTemplateComponent,
  NgDiagramComponent,
  type NgDiagramConfig,
  type NgDiagramEdgeTemplate,
  NgDiagramEdgeTemplateMap,
  type NgDiagramNodeTemplate,
  NgDiagramNodeTemplateMap,
  NgDiagramPortComponent,
  NgDiagramViewportService,
  type NodeDragEndedEvent,
  type NodeDragStartedEvent,
  type Port,
  provideNgDiagram,
  type SelectionGestureEndedEvent,
  type SimpleNode,
} from 'ng-diagram';
import { combineLatest } from 'rxjs';
import type {
  ConfidenceLevel,
  EvidenceType,
  GraphNodeType,
  GraphPhaseTag,
} from '../../../../core/models/graph.models';
import { RelationshipRules } from '../../data-access/relationship-rules';
import {
  buildDiagramModel,
  DiagramStore,
  syncDiagramModel,
} from '../../state/diagram-store';
import type { CanvasViewportRequest } from '../canvas-toolbar/canvas-toolbar';

type DiagramNodeData = {
  type: GraphNodeType;
  label: string;
  category: string;
  subtype: string;
  description: string;
  phaseTags: GraphPhaseTag[];
  confidence: ConfidenceLevel;
  isDimmed: boolean;
  isHighlighted: boolean;
};

type DiagramEdgeData = {
  label: string;
  relationshipType: string;
  evidenceType?: EvidenceType;
  confidence: ConfidenceLevel;
  isDimmed: boolean;
  isHighlighted: boolean;
};

@Component({
  imports: [NgDiagramBaseNodeTemplateComponent, NgDiagramPortComponent],
  template: `
    <ng-diagram-base-node-template
      [node]="node()"
      [style.--ngd-node-border-color]="nodeBorderColor()"
      [style.--ngd-node-border-color-hover]="nodeBorderHoverColor()"
      [style.--ngd-selected-node-box-shadow]="selectedNodeShadow()"
    >
      <article [class]="contentClasses()" [attr.aria-label]="node().data.label">
        <ng-diagram-port id="port-left" type="target" side="left" />
        <ng-diagram-port id="port-right" type="source" side="right" />

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
      'ng-diagram-port-hoverable-over-node relative block min-w-[14rem] max-w-[16rem] rounded-xl px-3 py-3 text-slate-100 transition-opacity',
      this.node().data.isDimmed ? 'opacity-45' : 'opacity-100',
      this.node().data.isHighlighted
        ? 'ring-1 ring-cyan-400/40'
        : 'ring-1 ring-transparent',
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
  imports: [NgDiagramBaseEdgeComponent, NgDiagramBaseEdgeLabelComponent],
  template: `
    <ng-diagram-base-edge
      [edge]="edge()"
      [stroke]="stroke()"
      [strokeWidth]="strokeWidth()"
      [strokeOpacity]="strokeOpacity()"
      [strokeDasharray]="strokeDasharray()"
    >
      <ng-diagram-base-edge-label [id]="labelId()" [positionOnEdge]="0.5">
        <span [class]="labelClasses()">{{ edge().data.label }}</span>
      </ng-diagram-base-edge-label>
    </ng-diagram-base-edge>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class GraphEdgeTemplate implements NgDiagramEdgeTemplate<DiagramEdgeData> {
  readonly edge = input.required<Edge<DiagramEdgeData>>();

  protected readonly labelId = computed(() => `${this.edge().id}-label`);

  protected readonly stroke = computed(() => {
    switch (this.edge().data.relationshipType) {
      case 'can increase':
        return 'rgb(251 113 133)';
      case 'can reduce':
        return 'rgb(52 211 153)';
      case 'tradeoff':
        return 'rgb(251 191 36)';
      case 'tested':
        return 'rgb(56 189 248)';
      case 'observed':
        return 'rgb(196 181 253)';
      default:
        return 'rgb(148 163 184)';
    }
  });

  protected readonly strokeWidth = computed(() =>
    this.edge().selected || this.edge().data.isHighlighted ? 2.75 : 2,
  );

  protected readonly strokeOpacity = computed(() =>
    this.edge().data.isDimmed
      ? 0.28
      : this.edge().data.isHighlighted
        ? 1
        : 0.72,
  );

  protected readonly strokeDasharray = computed(() =>
    this.edge().data.relationshipType === 'tested' ? '6 4' : '',
  );

  protected readonly labelClasses = computed(() => {
    return [
      'rounded-full border border-slate-700 bg-slate-950/95 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-200 shadow-sm transition-opacity',
      this.edge().data.isDimmed ? 'opacity-45' : 'opacity-100',
    ].join(' ');
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
  private readonly relationshipRules = inject(RelationshipRules);
  private readonly viewportService = inject(NgDiagramViewportService);
  protected readonly diagramStore = inject(DiagramStore);
  readonly viewportAction = input<CanvasViewportRequest | null>(null);
  private activeGraphId: string | null = null;
  private dragInProgress = false;
  private skipNextModelRefresh = false;
  private lastHandledViewportActionId = 0;
  private lastGraphRef: object | null = null;
  private lastNodesRef: readonly unknown[] | null = null;
  private lastEdgesRef: readonly unknown[] | null = null;
  private lastSelectionKey = '';
  private lastFilterKey = '';

  protected readonly isBrowser = isPlatformBrowser(this.platformId);
  protected readonly graphTitle = computed(() =>
    this.diagramStore.graphTitle(),
  );
  protected readonly activeModel = signal<ModelAdapter | null>(null);
  protected readonly canvasError = signal<string | null>(null);
  protected readonly diagramConfig = computed<NgDiagramConfig>(() => ({
    linking: {
      validateConnection: (
        source: SimpleNode | null,
        _sourcePort: Port | null,
        target: SimpleNode | null,
        _targetPort: Port | null,
      ) => {
        if (!source || !target) {
          return false;
        }

        const sourceNode = this.diagramStore
          .nodes()
          .find((node) => node.id === source.id);
        const targetNode = this.diagramStore
          .nodes()
          .find((node) => node.id === target.id);

        if (!sourceNode || !targetNode) {
          return false;
        }

        return this.relationshipRules.validateConnection({
          sourceType: sourceNode.type,
          targetType: targetNode.type,
          relationshipType:
            this.relationshipRules.getAllowedRelationshipTypes(
              sourceNode.type,
              targetNode.type,
            )[0] ?? 'influences',
          label:
            this.relationshipRules.getAllowedRelationshipTypes(
              sourceNode.type,
              targetNode.type,
            )[0] ?? 'influences',
          sourceNodeId: sourceNode.id,
          targetNodeId: targetNode.id,
        }).valid;
      },
      finalEdgeDataBuilder: (edge: Edge<DiagramEdgeData>) => ({
        ...edge,
        type: 'graph-edge',
        sourcePort: edge.sourcePort || 'port-right',
        targetPort: edge.targetPort || 'port-left',
        data: {
          label: 'influences',
          relationshipType: 'influences',
          confidence: 'low',
          isDimmed: false,
          isHighlighted: true,
        },
      }),
      temporaryEdgeDataBuilder: (edge: Edge<DiagramEdgeData>) => ({
        ...edge,
        type: 'graph-edge',
        sourcePort: edge.sourcePort || 'port-right',
        targetPort: edge.targetPort || 'port-left',
        data: {
          label: 'linking',
          relationshipType: 'influences',
          confidence: 'low',
          isDimmed: false,
          isHighlighted: true,
        },
      }),
    },
  }));
  protected readonly nodeTemplateMap = new NgDiagramNodeTemplateMap([
    ['graph-node', GraphNodeTemplate],
  ]);
  protected readonly edgeTemplateMap = new NgDiagramEdgeTemplateMap([
    ['graph-edge', GraphEdgeTemplate],
  ]);

  constructor() {
    effect(() => {
      const action = this.viewportAction();
      const model = this.activeModel();

      if (
        !action ||
        action.id === this.lastHandledViewportActionId ||
        !this.isBrowser ||
        !model
      ) {
        return;
      }

      try {
        switch (action.type) {
          case 'fit':
            this.viewportService.zoomToFit({ padding: 48 });
            break;
          case 'zoom-in':
            this.viewportService.zoom(1.15);
            break;
          case 'zoom-out':
            this.viewportService.zoom(0.85);
            break;
        }

        this.canvasError.set(null);
        this.lastHandledViewportActionId = action.id;
      } catch (error) {
        this.canvasError.set(
          error instanceof Error
            ? error.message
            : 'Unable to update the canvas viewport.',
        );
      }
    });

    combineLatest([
      toObservable(this.diagramStore.graph),
      toObservable(this.diagramStore.nodes),
      toObservable(this.diagramStore.edges),
      toObservable(this.diagramStore.selection),
      toObservable(this.diagramStore.filterState),
    ])
      .pipe(takeUntilDestroyed())
      .subscribe(([graph, nodes, edges, selection, filterState]) => {
        if (!this.isBrowser || !graph) {
          this.destroyActiveModel();
          this.canvasError.set(null);

          return;
        }

        try {
          const currentModel = this.activeModel();
          const graphChanged = this.lastGraphRef !== graph;
          const nodesChanged = this.lastNodesRef !== nodes;
          const edgesChanged = this.lastEdgesRef !== edges;
          const selectionKey = selection
            ? `${selection.kind}:${selection.id}`
            : '';
          const filterKey = JSON.stringify(filterState);
          const selectionChanged = this.lastSelectionKey !== selectionKey;
          const filterChanged = this.lastFilterKey !== filterKey;

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
                filterState,
                this.injector,
              ),
            );
            this.activeGraphId = graph.id;
          } else if (
            graphChanged ||
            nodesChanged ||
            edgesChanged ||
            selectionChanged ||
            filterChanged
          ) {
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
                  filterState,
                  this.injector,
                ),
              );
              this.activeGraphId = graph.id;
            }
          }

          this.lastGraphRef = graph;
          this.lastNodesRef = nodes;
          this.lastEdgesRef = edges;
          this.lastSelectionKey = selectionKey;
          this.lastFilterKey = filterKey;

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
    if (event.nodes.length > 0 || event.edges.length > 0) {
      this.canvasError.set(null);
    }

    this.diagramStore.updateSelection(
      event.nodes.map((node) => node.id),
      event.edges.map((edge) => edge.id),
    );
  }

  protected async onEdgeDrawn(event: EdgeDrawnEvent): Promise<void> {
    this.skipNextModelRefresh = true;

    const created = await this.diagramStore.createEdge(
      event.source.id,
      event.target.id,
    );

    if (created) {
      this.canvasError.set(null);
    }

    if (!created) {
      const graph = this.diagramStore.graph();
      const currentModel = this.activeModel();

      if (!graph) {
        return;
      }

      const graphDocument = {
        graph,
        nodes: this.diagramStore.nodes(),
        edges: this.diagramStore.edges(),
      };
      const selection = this.diagramStore.selection();
      const filterState = this.diagramStore.filterState();

      if (currentModel) {
        syncDiagramModel(currentModel, graphDocument, selection, filterState);
      } else {
        this.activeModel.set(
          buildDiagramModel(
            graphDocument,
            selection,
            filterState,
            this.injector,
          ),
        );
      }

      this.activeGraphId = graph.id;
      this.lastGraphRef = graph;
      this.lastNodesRef = this.diagramStore.nodes();
      this.lastEdgesRef = this.diagramStore.edges();
      this.lastSelectionKey = selection
        ? `${selection.kind}:${selection.id}`
        : '';
      this.lastFilterKey = JSON.stringify(filterState);
      this.canvasError.set(null);
    }
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
    this.lastSelectionKey = '';
    this.lastFilterKey = '';
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
