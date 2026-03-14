import { Injectable, inject } from '@angular/core';
import type { GraphEdgeRecord } from '../../models/graph.models';
import { AppDb } from '../app-db';

@Injectable({
  providedIn: 'root',
})
export class EdgesRepository {
  private readonly db = inject(AppDb);

  listByGraphId(graphId: string): Promise<GraphEdgeRecord[]> {
    return this.db.edges.where('graphId').equals(graphId).toArray();
  }

  async replaceForGraph(
    graphId: string,
    edges: GraphEdgeRecord[],
  ): Promise<void> {
    await this.db.transaction('rw', this.db.edges, async () => {
      await this.deleteByGraphId(graphId);
      await this.db.edges.bulkPut(edges);
    });
  }

  async bulkPut(edges: GraphEdgeRecord[]): Promise<void> {
    await this.db.edges.bulkPut(edges);
  }

  deleteByGraphId(graphId: string): Promise<void> {
    return this.db.edges
      .where('graphId')
      .equals(graphId)
      .delete()
      .then(() => undefined);
  }
}
