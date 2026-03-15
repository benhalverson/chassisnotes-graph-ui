import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ComponentRef } from '@angular/core';

import { EditorContextHeader } from './editor-context-header';

type ComponentWithProtected = { saveStatusText: () => string };

describe('EditorContextHeader', () => {
  let component: EditorContextHeader;
  let componentRef: ComponentRef<EditorContextHeader>;
  let fixture: ComponentFixture<EditorContextHeader>;

  function saveStatusText(): string {
    return (component as unknown as ComponentWithProtected).saveStatusText();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorContextHeader],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(EditorContextHeader);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('graphTitle', 'Test Graph');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('saveStatusText', () => {
    it('returns "Saving…" when status is saving', async () => {
      componentRef.setInput('saveStatus', 'saving');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(saveStatusText()).toBe('Saving…');
    });

    it('returns "Saved" when status is saved', async () => {
      componentRef.setInput('saveStatus', 'saved');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(saveStatusText()).toBe('Saved');
    });

    it('returns empty string when status is idle and no lastSavedAt', async () => {
      componentRef.setInput('saveStatus', 'idle');
      componentRef.setInput('lastSavedAt', null);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(saveStatusText()).toBe('');
    });

    describe('idle with lastSavedAt – formatRelativeTime boundaries', () => {
      const NOW = new Date('2024-06-01T12:00:00.000Z').getTime();

      beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(NOW);
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      async function setLastSavedAt(offsetMs: number): Promise<void> {
        componentRef.setInput('saveStatus', 'idle');
        componentRef.setInput('lastSavedAt', new Date(NOW - offsetMs).toISOString());
        fixture.detectChanges();
        await fixture.whenStable();
      }

      it('returns "Last saved just now" when saved less than 5 seconds ago', async () => {
        await setLastSavedAt(3_000);
        expect(saveStatusText()).toBe('Last saved just now');
      });

      it('returns "Last saved Xs ago" when saved between 5 and 59 seconds ago', async () => {
        await setLastSavedAt(30_000);
        expect(saveStatusText()).toBe('Last saved 30s ago');
      });

      it('returns "Last saved Xm ago" when saved between 1 and 59 minutes ago', async () => {
        await setLastSavedAt(5 * 60_000);
        expect(saveStatusText()).toBe('Last saved 5m ago');
      });

      it('returns "Last saved over an hour ago" when saved 60+ minutes ago', async () => {
        await setLastSavedAt(61 * 60_000);
        expect(saveStatusText()).toBe('Last saved over an hour ago');
      });

      it('returns "Last saved just now" when saved exactly 4 seconds ago (below 5s threshold)', async () => {
        await setLastSavedAt(4_000);
        expect(saveStatusText()).toBe('Last saved just now');
      });

      it('returns "Last saved 5s ago" when saved exactly 5 seconds ago (at 5s threshold)', async () => {
        await setLastSavedAt(5_000);
        expect(saveStatusText()).toBe('Last saved 5s ago');
      });

      it('returns "Last saved 59s ago" when saved exactly 59 seconds ago (below 60s threshold)', async () => {
        await setLastSavedAt(59_000);
        expect(saveStatusText()).toBe('Last saved 59s ago');
      });

      it('returns "Last saved 1m ago" when saved exactly 60 seconds ago (at 60s threshold)', async () => {
        await setLastSavedAt(60_000);
        expect(saveStatusText()).toBe('Last saved 1m ago');
      });
    });
  });
});
