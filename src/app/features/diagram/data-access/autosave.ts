import { Injectable } from '@angular/core';

type AutosaveTask = () => void | Promise<void>;

type PendingAutosave = {
  timeoutId: ReturnType<typeof setTimeout>;
  task: AutosaveTask;
};

@Injectable({
  providedIn: 'root',
})
export class Autosave {
  private readonly pendingByKey = new Map<string, PendingAutosave>();

  schedule(key: string, task: AutosaveTask, delayMs = 500): void {
    this.cancel(key);

    const timeoutId = setTimeout(async () => {
      this.pendingByKey.delete(key);
      await task();
    }, delayMs);

    this.pendingByKey.set(key, {
      timeoutId,
      task,
    });
  }

  cancel(key: string): void {
    const pending = this.pendingByKey.get(key);

    if (!pending) {
      return;
    }

    clearTimeout(pending.timeoutId);
    this.pendingByKey.delete(key);
  }

  hasPending(key: string): boolean {
    return this.pendingByKey.has(key);
  }
}
