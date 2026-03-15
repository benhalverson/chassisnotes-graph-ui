import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { GraphsRepository } from '../../../../core/db/repositories/graphs-repository';
import type {
  GraphExportPayload,
  GraphRecord,
} from '../../../../core/models/graph.models';
import { GraphJsonIo } from '../../data-access/graph-json-io';
import { PngExport } from '../../data-access/png-export';

import { ImportExportDialog } from './import-export-dialog';

describe('ImportExportDialog', () => {
  let component: ImportExportDialog;
  let fixture: ComponentFixture<ImportExportDialog>;
  const routerSpy = {
    navigate: vi.fn<(commands: unknown[]) => Promise<boolean>>(),
  };
  const repositoryStub = {
    exportGraph:
      vi.fn<(graphId: string) => Promise<GraphExportPayload | null>>(),
    importGraph: vi.fn<(candidate: unknown) => Promise<GraphRecord>>(),
  } satisfies Pick<GraphsRepository, 'exportGraph' | 'importGraph'>;
  const graphJsonIoStub = {
    stringify: vi.fn<(payload: unknown) => string>(),
    parse: vi.fn<(rawJson: string) => unknown>(),
    buildFilename: vi.fn<(graph: { slug: string; name: string }) => string>(),
  } satisfies Pick<GraphJsonIo, 'stringify' | 'parse' | 'buildFilename'>;
  const pngExportStub = {
    exportCurrentDiagram: vi.fn<(graphName: string) => Promise<void>>(),
  } satisfies Pick<PngExport, 'exportCurrentDiagram'>;
  let createdObjectUrl = '';
  let createdBlob: Blob | MediaSource | null = null;
  let revokeSpy: ReturnType<typeof vi.spyOn>;
  let createSpy: ReturnType<typeof vi.spyOn>;
  let clickSpy: ReturnType<typeof vi.fn>;
  let createElementSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    routerSpy.navigate.mockReset();
    routerSpy.navigate.mockResolvedValue(true);
    repositoryStub.exportGraph.mockReset();
    repositoryStub.exportGraph.mockResolvedValue({
      graph: {
        id: 'graph-1',
        name: 'Baseline Map',
        slug: 'baseline-map',
        chassis: 'Associated B7',
        classType: '2wd-buggy',
        surface: 'carpet',
        notes: '',
        createdAt: '2026-03-14T00:00:00.000Z',
        updatedAt: '2026-03-14T00:00:00.000Z',
        version: 1,
      },
      schemaVersion: 1,
      exportTimestamp: '2026-03-14T00:00:00.000Z',
      nodes: [],
      edges: [],
    });
    repositoryStub.importGraph.mockReset();
    repositoryStub.importGraph.mockResolvedValue({
      id: 'graph-imported',
      name: 'Imported graph',
      slug: 'imported-graph',
      chassis: 'Associated B7',
      classType: '2wd-buggy',
      surface: 'carpet',
      notes: '',
      createdAt: '2026-03-14T00:00:00.000Z',
      updatedAt: '2026-03-14T00:00:00.000Z',
      version: 1,
    });
    graphJsonIoStub.stringify.mockReset();
    graphJsonIoStub.stringify.mockReturnValue('{"schemaVersion":1}');
    graphJsonIoStub.parse.mockReset();
    graphJsonIoStub.parse.mockReturnValue({ schemaVersion: 1 });
    graphJsonIoStub.buildFilename.mockReset();
    graphJsonIoStub.buildFilename.mockReturnValue('baseline-map.json');
    pngExportStub.exportCurrentDiagram.mockReset();
    pngExportStub.exportCurrentDiagram.mockResolvedValue();
    createdObjectUrl = 'blob:test';
    createdBlob = null;
    clickSpy = vi.fn();
    createSpy = vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      createdBlob = blob;

      return createdObjectUrl;
    });
    revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const originalCreateElement = document.createElement.bind(document);
    createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          return {
            href: '',
            download: '',
            click: clickSpy,
          } as unknown as HTMLAnchorElement;
        }

        return originalCreateElement(tagName);
      });

    await TestBed.configureTestingModule({
      imports: [ImportExportDialog],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: GraphsRepository, useValue: repositoryStub },
        { provide: GraphJsonIo, useValue: graphJsonIoStub },
        { provide: PngExport, useValue: pngExportStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportExportDialog);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('graphId', 'graph-1');
    fixture.componentRef.setInput('graphName', 'Baseline Map');
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    createSpy.mockRestore();
    revokeSpy.mockRestore();
    createElementSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should export the current graph as JSON', async () => {
    await (
      component as ImportExportDialog & { exportJson(): Promise<void> }
    ).exportJson();
    fixture.detectChanges();

    expect(repositoryStub.exportGraph).toHaveBeenCalledWith('graph-1');
    expect(graphJsonIoStub.stringify).toHaveBeenCalled();
    expect(graphJsonIoStub.buildFilename).toHaveBeenCalled();
    expect(createdBlob).toBeInstanceOf(Blob);
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalledWith(createdObjectUrl);
    expect(fixture.nativeElement.textContent).toContain('Graph JSON exported.');
  });

  it('should import a selected json file and navigate to the new graph', async () => {
    const closeSpy = vi.fn();
    component.closeRequested.subscribe(closeSpy);
    const file = new File(['{"schemaVersion":1}'], 'graph.json', {
      type: 'application/json',
    });

    await (
      component as ImportExportDialog & {
        onFileInputChange(event: Event): Promise<void>;
      }
    ).onFileInputChange({
      target: {
        files: {
          item: (index: number) => (index === 0 ? file : null),
        },
        value: 'graph.json',
      },
    } as unknown as Event);
    fixture.detectChanges();

    expect(graphJsonIoStub.parse).toHaveBeenCalledWith('{"schemaVersion":1}');
    expect(repositoryStub.importGraph).toHaveBeenCalledWith({
      schemaVersion: 1,
    });
    expect(routerSpy.navigate).toHaveBeenCalledWith([
      '/graphs',
      'graph-imported',
    ]);
    expect(closeSpy).toHaveBeenCalled();
  });

  it('should export the rendered graph as png', async () => {
    await (
      component as ImportExportDialog & { exportPng(): Promise<void> }
    ).exportPng();
    fixture.detectChanges();

    expect(pngExportStub.exportCurrentDiagram).toHaveBeenCalledWith(
      'Baseline Map',
    );
    expect(fixture.nativeElement.textContent).toContain('Graph PNG exported.');
  });

  it('should surface import failures', async () => {
    repositoryStub.importGraph.mockRejectedValueOnce(
      new Error('Broken import'),
    );
    const file = new File(['{"schemaVersion":1}'], 'graph.json', {
      type: 'application/json',
    });

    await (
      component as ImportExportDialog & {
        onFileInputChange(event: Event): Promise<void>;
      }
    ).onFileInputChange({
      target: {
        files: {
          item: (index: number) => (index === 0 ? file : null),
        },
        value: 'graph.json',
      },
    } as unknown as Event);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Broken import');
  });
});
