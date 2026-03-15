import { Injectable } from '@angular/core';
import type {
  ConfidenceLevel,
  EvidenceType,
  GraphEdgeRecord,
  GraphNodeRecord,
  GraphPhaseTag,
} from '../../../core/models/graph.models';

export interface DiagnosticSuggestion {
  title: string;
  confidence: ConfidenceLevel;
  reasoning: string;
  setupNodeId: string | null;
  relatedNodeIds: string[];
  score: number;
}

export interface ExperimentHistoryEntry {
  id: string;
  title: string;
  outcome: string;
  confidence: ConfidenceLevel;
  phaseTags: GraphPhaseTag[];
  nodeId: string;
}

export interface DiagnosticContext {
  symptomLabel: string;
  phase: GraphPhaseTag;
  nodes: readonly GraphNodeRecord[];
  edges: readonly GraphEdgeRecord[];
}

export interface SymptomHighlightSet {
  symptomNodeIds: string[];
  setupNodeIds: string[];
  outcomeNodeIds: string[];
  experimentNodeIds: string[];
  edgeIds: string[];
}

const CONFIDENCE_SCORE: Record<ConfidenceLevel, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const EVIDENCE_SCORE: Record<EvidenceType, number> = {
  'repeated-test': 3,
  observed: 2,
  theory: 1,
};

/**
 * Pure service that derives ranked diagnostic suggestions and experiment
 * history from the in-memory graph document state.
 *
 * All methods are free of side-effects and suitable for use in computed()
 * contexts or unit tests.
 */
@Injectable({
  providedIn: 'root',
})
export class SuggestionEngine {
  /**
   * Return ranked setup suggestions for the given symptom and corner phase.
   *
   * Strategy:
   * 1. Find symptom nodes whose title loosely matches the selected label.
   * 2. Walk edges whose target is a matched symptom node and whose source is
   *    a setup node – each such edge represents a candidate adjustment.
   * 3. Score each candidate using edge confidence and evidence strength.
   * 4. Attach experiment counts as additional reasoning evidence.
   */
  getSuggestions(context: DiagnosticContext): DiagnosticSuggestion[] {
    const { symptomLabel, phase, nodes, edges } = context;

    const symptomNodes = this.findMatchingSymptomNodes(symptomLabel, phase, nodes);

    if (symptomNodes.length === 0) {
      return [];
    }

    const symptomNodeIds = new Set(symptomNodes.map((n) => n.id));

    const setupById = new Map<string, GraphNodeRecord>(
      nodes.filter((n) => n.type === 'setup').map((n) => [n.id, n]),
    );

    const experimentsBySetupId = this.buildExperimentsBySetupId(nodes, edges);

    const candidateMap = new Map<string, DiagnosticSuggestion>();

    for (const edge of edges) {
      if (!symptomNodeIds.has(edge.targetNodeId)) {
        continue;
      }

      const setupNode = setupById.get(edge.sourceNodeId);

      if (!setupNode) {
        continue;
      }

      const existing = candidateMap.get(setupNode.id);
      const edgeScore =
        CONFIDENCE_SCORE[edge.confidence] *
        EVIDENCE_SCORE[edge.evidenceType ?? 'theory'];

      if (existing && existing.score >= edgeScore) {
        continue;
      }

      const experimentCount =
        experimentsBySetupId.get(setupNode.id)?.length ?? 0;
      const reasoning = this.buildReasoning(edge.confidence, edge.evidenceType, experimentCount);

      const relatedNodeIds: string[] = [setupNode.id, ...symptomNodes.map((n) => n.id)];
      const relatedExperiments = experimentsBySetupId.get(setupNode.id) ?? [];

      for (const exp of relatedExperiments) {
        relatedNodeIds.push(exp.id);
      }

      candidateMap.set(setupNode.id, {
        title: setupNode.title,
        confidence: edge.confidence,
        reasoning,
        setupNodeId: setupNode.id,
        relatedNodeIds,
        score: edgeScore,
      });
    }

    return [...candidateMap.values()].sort((a, b) => b.score - a.score);
  }

  /**
   * Return all experiment nodes from the graph along with their observed
   * outcome titles, sorted from most recent to oldest by nodeId alphabetical
   * order (which mirrors insertion order for UUID-based IDs).
   */
  getExperimentHistory(
    nodes: readonly GraphNodeRecord[],
    edges: readonly GraphEdgeRecord[],
  ): ExperimentHistoryEntry[] {
    const experimentNodes = nodes.filter((n) => n.type === 'experiment');
    const outcomeById = new Map<string, GraphNodeRecord>(
      nodes.filter((n) => n.type === 'outcome').map((n) => [n.id, n]),
    );

    return experimentNodes.map((exp) => {
      const outcomeEdge = edges.find(
        (e) => e.sourceNodeId === exp.id && outcomeById.has(e.targetNodeId),
      );
      const outcome = outcomeEdge
        ? (outcomeById.get(outcomeEdge.targetNodeId)?.title ?? 'Outcome recorded')
        : 'No outcome recorded';

      return {
        id: exp.id,
        title: exp.title,
        outcome,
        confidence: exp.confidence,
        phaseTags: exp.phaseTags,
        nodeId: exp.id,
      };
    });
  }

  /**
   * Compute the full set of node and edge IDs that are relevant to the
   * selected symptom, suitable for driving graph highlighting.
   */
  getHighlightSet(context: DiagnosticContext): SymptomHighlightSet {
    const { symptomLabel, phase, nodes, edges } = context;

    const symptomNodes = this.findMatchingSymptomNodes(symptomLabel, phase, nodes);
    const symptomNodeIds = new Set(symptomNodes.map((n) => n.id));

    const setupNodeIds = new Set<string>();
    const outcomeNodeIds = new Set<string>();
    const experimentNodeIds = new Set<string>();
    const relevantEdgeIds = new Set<string>();

    const nodeById = new Map<string, GraphNodeRecord>(
      nodes.map((n) => [n.id, n]),
    );

    for (const edge of edges) {
      if (symptomNodeIds.has(edge.targetNodeId)) {
        const source = nodeById.get(edge.sourceNodeId);

        if (source?.type === 'setup') {
          setupNodeIds.add(source.id);
          relevantEdgeIds.add(edge.id);
        }

        if (source?.type === 'experiment') {
          experimentNodeIds.add(source.id);
          relevantEdgeIds.add(edge.id);
        }
      }

      if (symptomNodeIds.has(edge.sourceNodeId)) {
        const target = nodeById.get(edge.targetNodeId);

        if (target?.type === 'outcome') {
          outcomeNodeIds.add(target.id);
          relevantEdgeIds.add(edge.id);
        }
      }

      if (setupNodeIds.has(edge.sourceNodeId)) {
        const target = nodeById.get(edge.targetNodeId);

        if (target?.type === 'experiment') {
          experimentNodeIds.add(target.id);
          relevantEdgeIds.add(edge.id);
        }
      }

      if (setupNodeIds.has(edge.targetNodeId)) {
        const source = nodeById.get(edge.sourceNodeId);

        if (source?.type === 'experiment') {
          experimentNodeIds.add(source.id);
          relevantEdgeIds.add(edge.id);
        }
      }
    }

    return {
      symptomNodeIds: [...symptomNodeIds],
      setupNodeIds: [...setupNodeIds],
      outcomeNodeIds: [...outcomeNodeIds],
      experimentNodeIds: [...experimentNodeIds],
      edgeIds: [...relevantEdgeIds],
    };
  }

  /**
   * Compute an updated confidence level for a relationship based on its
   * current level and a new experiment result.
   *
   * Rules:
   * - 'improved' result nudges confidence up one level
   * - 'worsened' result nudges confidence down one level
   * - 'neutral' result keeps confidence unchanged
   */
  computeUpdatedConfidence(
    current: ConfidenceLevel,
    result: 'improved' | 'worsened' | 'neutral',
  ): ConfidenceLevel {
    if (result === 'neutral') {
      return current;
    }

    const levels: ConfidenceLevel[] = ['low', 'medium', 'high'];
    const index = levels.indexOf(current);

    if (result === 'improved') {
      return levels[Math.min(index + 1, levels.length - 1)] ?? current;
    }

    return levels[Math.max(index - 1, 0)] ?? current;
  }

  private findMatchingSymptomNodes(
    symptomLabel: string,
    phase: GraphPhaseTag,
    nodes: readonly GraphNodeRecord[],
  ): GraphNodeRecord[] {
    const normalized = symptomLabel.toLowerCase().replace(/[-\s]+/g, ' ');

    return nodes.filter((node) => {
      if (node.type !== 'symptom') {
        return false;
      }

      const titleMatch = node.title.toLowerCase().includes(normalized) ||
        normalized.includes(node.title.toLowerCase());

      const phaseMatch =
        node.phaseTags.length === 0 || node.phaseTags.includes(phase);

      return titleMatch && phaseMatch;
    });
  }

  private buildExperimentsBySetupId(
    nodes: readonly GraphNodeRecord[],
    edges: readonly GraphEdgeRecord[],
  ): Map<string, GraphNodeRecord[]> {
    const experimentNodes = new Map<string, GraphNodeRecord>(
      nodes.filter((n) => n.type === 'experiment').map((n) => [n.id, n]),
    );

    const result = new Map<string, GraphNodeRecord[]>();

    for (const edge of edges) {
      const experiment = experimentNodes.get(edge.sourceNodeId);

      if (experiment) {
        const existing = result.get(edge.targetNodeId) ?? [];
        existing.push(experiment);
        result.set(edge.targetNodeId, existing);
      }

      const experimentAsTarget = experimentNodes.get(edge.targetNodeId);

      if (experimentAsTarget) {
        const existing = result.get(edge.sourceNodeId) ?? [];
        existing.push(experimentAsTarget);
        result.set(edge.sourceNodeId, existing);
      }
    }

    return result;
  }

  private buildReasoning(
    confidence: ConfidenceLevel,
    evidenceType: EvidenceType | undefined,
    experimentCount: number,
  ): string {
    const parts: string[] = [];

    if (experimentCount > 0) {
      parts.push(
        `${experimentCount} experiment${experimentCount === 1 ? '' : 's'} recorded`,
      );
    }

    if (evidenceType === 'repeated-test') {
      parts.push('confirmed by repeated testing');
    } else if (evidenceType === 'observed') {
      parts.push('observed in practice');
    } else {
      parts.push('theoretical relationship in graph');
    }

    if (confidence === 'high') {
      parts.push('high confidence relationship');
    }

    return parts.join(' · ');
  }
}
