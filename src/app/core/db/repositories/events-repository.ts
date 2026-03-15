import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import type { RacingEventRecord } from '../../models/graph.models';
import { AppDb } from '../app-db';

@Injectable({
  providedIn: 'root',
})
export class EventsRepository {
  private readonly db = inject(AppDb);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  async listBySession(sessionId: string): Promise<RacingEventRecord[]> {
    if (!this.isBrowser) return [];
    return this.db.events.where('sessionId').equals(sessionId).toArray();
  }

  async listByGraph(graphId: string): Promise<RacingEventRecord[]> {
    if (!this.isBrowser) return [];
    return this.db.events.where('graphId').equals(graphId).toArray();
  }

  async put(event: RacingEventRecord): Promise<void> {
    if (!this.isBrowser) return;
    await this.db.events.put(event);
  }

  async deleteBySession(sessionId: string): Promise<void> {
    if (!this.isBrowser) return;
    await this.db.events.where('sessionId').equals(sessionId).delete();
  }

  async deleteByGraph(graphId: string): Promise<void> {
    if (!this.isBrowser) return;
    await this.db.events.where('graphId').equals(graphId).delete();
  }
}
