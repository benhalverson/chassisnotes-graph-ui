import { Injectable, inject } from '@angular/core';
import type { GraphNodeRecord } from '../../models/graph.models';
import { AppDb } from '../app-db';

@Injectable({
  providedIn: 'root',
})
export class NodesRepository {
  private readonly db = inject(AppDb);

  listByGraphId(graphId: string): Promise<GraphNodeRecord[]> {
    return this.db.nodes.where('graphId').equals(graphId).toArray();
  }

  async replaceForGraph(
    graphId: string,
    nodes: GraphNodeRecord[],
  ): Promise<void> {
    await this.db.transaction('rw', this.db.nodes, async () => {
      await this.deleteByGraphId(graphId);
      await this.db.nodes.bulkPut(nodes);
    });
  }

  async bulkPut(nodes: GraphNodeRecord[]): Promise<void> {
    await this.db.nodes.bulkPut(nodes);
  }

  deleteByGraphId(graphId: string): Promise<void> {
    return this.db.nodes
      .where('graphId')
      .equals(graphId)
      .delete()
      .then(() => undefined);
  }
}
