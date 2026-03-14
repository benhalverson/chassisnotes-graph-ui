import { TestBed } from '@angular/core/testing';

import { PngExport } from './png-export';

describe('PngExport', () => {
  let service: PngExport;
  let createObjectUrlSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectUrlSpy: ReturnType<typeof vi.spyOn>;
  let createElementSpy: ReturnType<typeof vi.spyOn>;
  let clickSpy: ReturnType<typeof vi.fn>;
  let originalImage: typeof Image;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PngExport);
    clickSpy = vi.fn();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    createObjectUrlSpy?.mockRestore();
    revokeObjectUrlSpy?.mockRestore();
    createElementSpy?.mockRestore();

    if (originalImage) {
      globalThis.Image = originalImage;
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should reject export when the diagram svg is unavailable', async () => {
    await expect(service.exportCurrentDiagram('Baseline Map')).rejects.toThrow(
      /not ready to export/i,
    );
  });

  it('should export the rendered diagram as png', async () => {
    document.body.innerHTML =
      '<div data-diagram-export-root><svg xmlns="http://www.w3.org/2000/svg"></svg></div>';

    const svg = document.querySelector('svg') as SVGSVGElement;
    vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
      width: 320,
      height: 180,
      top: 0,
      left: 0,
      right: 320,
      bottom: 180,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const canvasContext = {
      fillStyle: '',
      fillRect: vi.fn(),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
    const canvasElement = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => canvasContext),
      toBlob: vi.fn((callback: BlobCallback) => callback(new Blob(['png']))),
    } as unknown as HTMLCanvasElement;
    const originalCreateElement = document.createElement.bind(document);
    createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return canvasElement;
      }

      if (tagName === 'a') {
        return {
          href: '',
          download: '',
          click: clickSpy,
        } as unknown as HTMLAnchorElement;
      }

      return originalCreateElement(tagName);
    });
    createObjectUrlSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValueOnce('blob:svg')
      .mockReturnValueOnce('blob:png');
    revokeObjectUrlSpy = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => {});

    originalImage = globalThis.Image;
    globalThis.Image = class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        this.onload?.();
      }
    } as unknown as typeof Image;

    await service.exportCurrentDiagram('Baseline Map');

    expect(createObjectUrlSpy).toHaveBeenCalledTimes(2);
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:svg');
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:png');
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});
