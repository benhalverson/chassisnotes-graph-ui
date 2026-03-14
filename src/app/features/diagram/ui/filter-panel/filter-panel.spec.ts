import { signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import type { DiagramFilters } from '../../state/diagram-store';
import { DiagramStore } from '../../state/diagram-store';

import { FilterPanel } from './filter-panel';

describe('FilterPanel', () => {
  let fixture: ComponentFixture<FilterPanel>;

  const createFilters = (): DiagramFilters => ({
    nodeTypes: [],
    phaseTags: [],
    confidenceLevels: [],
    evidenceTypes: [],
    highlightSelectionNeighborhood: true,
  });

  const mockStore = {
    filters: signal<DiagramFilters>(createFilters()),
    toggleNodeTypeFilter: vi.fn<(type: string, enabled: boolean) => void>(),
    togglePhaseTagFilter: vi.fn<(tag: string, enabled: boolean) => void>(),
    toggleConfidenceFilter:
      vi.fn<(confidence: string, enabled: boolean) => void>(),
    toggleEvidenceTypeFilter:
      vi.fn<(evidenceType: string, enabled: boolean) => void>(),
    setSelectionNeighborhoodHighlight: vi.fn<(enabled: boolean) => void>(),
    resetFilters: vi.fn<() => void>(),
  };

  beforeEach(async () => {
    mockStore.filters.set(createFilters());
    mockStore.toggleNodeTypeFilter.mockReset();
    mockStore.togglePhaseTagFilter.mockReset();
    mockStore.toggleConfidenceFilter.mockReset();
    mockStore.toggleEvidenceTypeFilter.mockReset();
    mockStore.setSelectionNeighborhoodHighlight.mockReset();
    mockStore.resetFilters.mockReset();

    await TestBed.configureTestingModule({
      imports: [FilterPanel],
      providers: [{ provide: DiagramStore, useValue: mockStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterPanel);
    fixture.detectChanges();
  });

  it('reflects the active filters from the store signal', () => {
    mockStore.filters.set({
      ...createFilters(),
      nodeTypes: ['setup'],
      highlightSelectionNeighborhood: false,
    });

    fixture.detectChanges();

    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('label'),
    ) as HTMLLabelElement[];
    const setupCheckbox = labels
      .find((label) => label.textContent?.includes('setup'))
      ?.querySelector('input') as HTMLInputElement | null;
    const neighborhoodCheckbox = labels
      .find((label) =>
        label.textContent?.includes('Highlight one-hop neighborhood'),
      )
      ?.querySelector('input') as HTMLInputElement | null;

    expect(setupCheckbox?.checked).toBe(true);
    expect(neighborhoodCheckbox?.checked).toBe(false);
  });

  it('toggles a node type filter through the store', () => {
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('label'),
    ) as HTMLLabelElement[];
    const setupCheckbox = labels
      .find((label) => label.textContent?.includes('setup'))
      ?.querySelector('input') as HTMLInputElement | null;

    setupCheckbox?.click();

    expect(mockStore.toggleNodeTypeFilter).toHaveBeenCalledWith('setup', true);
  });

  it('updates neighborhood highlighting and resets filters', () => {
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('label'),
    ) as HTMLLabelElement[];
    const neighborhoodCheckbox = labels
      .find((label) =>
        label.textContent?.includes('Highlight one-hop neighborhood'),
      )
      ?.querySelector('input') as HTMLInputElement | null;
    const clearButton = (
      Array.from(
        fixture.nativeElement.querySelectorAll('button'),
      ) as HTMLButtonElement[]
    ).find((button) => button.textContent?.includes('Clear')) as
      | HTMLButtonElement
      | undefined;

    neighborhoodCheckbox?.click();
    clearButton?.click();

    expect(mockStore.setSelectionNeighborhoodHighlight).toHaveBeenCalledWith(
      false,
    );
    expect(mockStore.resetFilters).toHaveBeenCalledTimes(1);
  });
});
