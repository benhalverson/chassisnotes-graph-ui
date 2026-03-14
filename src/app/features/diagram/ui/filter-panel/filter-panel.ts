import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  CONFIDENCE_LEVELS,
  type ConfidenceLevel,
  EVIDENCE_TYPES,
  type EvidenceType,
  GRAPH_NODE_TYPES,
  GRAPH_PHASE_TAGS,
  type GraphNodeType,
  type GraphPhaseTag,
} from '../../../../core/models/graph.models';
import { DiagramStore } from '../../state/diagram-store';

@Component({
  selector: 'app-filter-panel',
  imports: [],
  templateUrl: './filter-panel.html',
  styleUrl: './filter-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterPanel {
  protected readonly diagramStore = inject(DiagramStore);
  protected readonly filters = this.diagramStore.filters;
  protected readonly nodeTypes = GRAPH_NODE_TYPES.filter(
    (nodeType) => nodeType !== 'group',
  );
  protected readonly phaseTags = GRAPH_PHASE_TAGS;
  protected readonly confidenceLevels = CONFIDENCE_LEVELS;
  protected readonly evidenceTypes = EVIDENCE_TYPES;

  protected hasNodeTypeFilter(type: GraphNodeType): boolean {
    return this.filters().nodeTypes.includes(type);
  }

  protected hasPhaseTagFilter(tag: GraphPhaseTag): boolean {
    return this.filters().phaseTags.includes(tag);
  }

  protected hasConfidenceFilter(confidence: ConfidenceLevel): boolean {
    return this.filters().confidenceLevels.includes(confidence);
  }

  protected hasEvidenceTypeFilter(evidenceType: EvidenceType): boolean {
    return this.filters().evidenceTypes.includes(evidenceType);
  }

  protected toggleNodeType(type: GraphNodeType, checked: boolean): void {
    this.diagramStore.toggleNodeTypeFilter(type, checked);
  }

  protected togglePhaseTag(tag: GraphPhaseTag, checked: boolean): void {
    this.diagramStore.togglePhaseTagFilter(tag, checked);
  }

  protected toggleConfidence(
    confidence: ConfidenceLevel,
    checked: boolean,
  ): void {
    this.diagramStore.toggleConfidenceFilter(confidence, checked);
  }

  protected toggleEvidenceType(
    evidenceType: EvidenceType,
    checked: boolean,
  ): void {
    this.diagramStore.toggleEvidenceTypeFilter(evidenceType, checked);
  }

  protected toggleSelectionNeighborhood(checked: boolean): void {
    this.diagramStore.setSelectionNeighborhoodHighlight(checked);
  }

  protected resetFilters(): void {
    this.diagramStore.resetFilters();
  }
}
