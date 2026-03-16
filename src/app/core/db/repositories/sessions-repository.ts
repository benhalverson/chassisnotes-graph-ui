import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import type { SessionRecord } from '../../models/graph.models';
import { AppDb } from '../app-db';

@Injectable({
  providedIn: 'root',
})
export class SessionsRepository {
  private readonly db = inject(AppDb);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  async listByGraph(graphId: string): Promise<SessionRecord[]> {
    if (!this.isBrowser) return [];
    return this.db.sessions
      .where('graphId')
      .equals(graphId)
      .sortBy('updatedAt');
  }

  async get(sessionId: string): Promise<SessionRecord | undefined> {
    if (!this.isBrowser) return undefined;
    return this.db.sessions.get(sessionId);
  }

  async put(session: SessionRecord): Promise<void> {
    if (!this.isBrowser) return;
    await this.db.sessions.put(session);
  }

  async deleteByGraph(graphId: string): Promise<void> {
    if (!this.isBrowser) return;
    await this.db.sessions.where('graphId').equals(graphId).delete();
  }
}
