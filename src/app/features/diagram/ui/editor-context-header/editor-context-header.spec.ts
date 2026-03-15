import type { ComponentRef } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EditorContextHeader } from './editor-context-header';

function getStatusText(fixture: ComponentFixture<EditorContextHeader>): string {
  const span: HTMLSpanElement | null = fixture.nativeElement.querySelector(
    '[aria-live="polite"]',
  );
  return span?.textContent?.trim() ?? '';
}

describe('EditorContextHeader', () => {
  let component: EditorContextHeader;
  let componentRef: ComponentRef<EditorContextHeader>;
  let fixture: ComponentFixture<EditorContextHeader>;

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

  it('should display the graph title', () => {
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading.textContent.trim()).toBe('Test Graph');
  });

  it('should show no status text when idle with no lastSavedAt', () => {
    componentRef.setInput('saveStatus', 'idle');
    fixture.detectChanges();
    expect(getStatusText(fixture)).toBe('');
  });

  it('should show "Saving…" when saveStatus is saving', () => {
    componentRef.setInput('saveStatus', 'saving');
    fixture.detectChanges();
    expect(getStatusText(fixture)).toBe('Saving…');
  });

  it('should show "Saved" when saveStatus is saved', () => {
    componentRef.setInput('saveStatus', 'saved');
    fixture.detectChanges();
    expect(getStatusText(fixture)).toBe('Saved');
  });

  it('should show relative time when idle with lastSavedAt just now', () => {
    componentRef.setInput('saveStatus', 'idle');
    componentRef.setInput('lastSavedAt', new Date().toISOString());
    fixture.detectChanges();
    expect(getStatusText(fixture)).toBe('Last saved just now');
  });

  it('should show seconds ago for recent saves', () => {
    const tenSecondsAgo = new Date(Date.now() - 10_000).toISOString();
    componentRef.setInput('saveStatus', 'idle');
    componentRef.setInput('lastSavedAt', tenSecondsAgo);
    fixture.detectChanges();
    expect(getStatusText(fixture)).toMatch(/Last saved \d+s ago/);
  });

  it('should show minutes ago for older saves', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    componentRef.setInput('saveStatus', 'idle');
    componentRef.setInput('lastSavedAt', fiveMinutesAgo);
    fixture.detectChanges();
    expect(getStatusText(fixture)).toBe('Last saved 5m ago');
  });

  it('should show "over an hour ago" for old saves', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60_000).toISOString();
    componentRef.setInput('saveStatus', 'idle');
    componentRef.setInput('lastSavedAt', twoHoursAgo);
    fixture.detectChanges();
    expect(getStatusText(fixture)).toBe('Last saved over an hour ago');
  });

  it('should have a back link to /graphs', () => {
    fixture.detectChanges();
    const backLink: HTMLAnchorElement = fixture.nativeElement.querySelector(
      'a[aria-label="Back to Graphs"]',
    );
    expect(backLink).toBeTruthy();
  });

  it('should have aria-live on save status span', () => {
    componentRef.setInput('saveStatus', 'saving');
    fixture.detectChanges();
    const statusSpan = fixture.nativeElement.querySelector('[aria-live]');
    expect(statusSpan).toBeTruthy();
    expect(statusSpan.getAttribute('aria-live')).toBe('polite');
  });
});
