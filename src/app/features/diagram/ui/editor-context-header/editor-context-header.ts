import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';

export type SaveStatus = 'saved' | 'saving' | 'idle';

@Component({
  selector: 'app-editor-context-header',
  imports: [RouterLink],
  templateUrl: './editor-context-header.html',
  styleUrl: './editor-context-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorContextHeader {
  readonly graphTitle = input.required<string>();
  readonly saveStatus = input<SaveStatus>('idle');
  readonly lastSavedAt = input<string | null>(null);

  protected readonly saveStatusText = computed(() => {
    const status = this.saveStatus();

    if (status === 'saving') {
      return 'Saving…';
    }

    if (status === 'saved') {
      return 'Saved';
    }

    const lastSaved = this.lastSavedAt();

    if (lastSaved) {
      return `Last saved ${this.formatRelativeTime(lastSaved)}`;
    }

    return '';
  });

  private formatRelativeTime(isoString: string): string {
    const savedDate = new Date(isoString);
    const now = Date.now();
    const diffMs = now - savedDate.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);

    if (diffSeconds < 5) {
      return 'just now';
    }

    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    }

    const diffMinutes = Math.floor(diffSeconds / 60);

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    }

    return 'over an hour ago';
  }
}
