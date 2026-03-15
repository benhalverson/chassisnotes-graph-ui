import { isPlatformBrowser } from '@angular/common';
import { Injectable, inject, PLATFORM_ID } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PngExport {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  async exportCurrentDiagram(graphName: string): Promise<void> {
    if (!this.isBrowser) {
      throw new Error('PNG export is available in the browser only.');
    }

    const svgElement = globalThis.document.querySelector(
      '[data-diagram-export-root] svg',
    ) as SVGSVGElement | null;

    if (!svgElement) {
      throw new Error('The diagram canvas is not ready to export.');
    }

    const width = Math.max(
      Math.ceil(svgElement.getBoundingClientRect().width),
      1,
    );
    const height = Math.max(
      Math.ceil(svgElement.getBoundingClientRect().height),
      1,
    );
    const serializer = new XMLSerializer();
    const svgMarkup = normalizeSvgMarkup(
      serializer.serializeToString(svgElement),
      width,
      height,
    );
    const svgUrl = globalThis.URL.createObjectURL(
      new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' }),
    );

    try {
      const image = await loadImage(svgUrl);
      const canvas = globalThis.document.createElement('canvas');

      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('PNG export could not create a drawing context.');
      }

      context.fillStyle = '#020617';
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      const pngBlob = await canvasToBlob(canvas);
      const pngUrl = globalThis.URL.createObjectURL(pngBlob);

      try {
        const anchor = globalThis.document.createElement('a');

        anchor.href = pngUrl;
        anchor.download = `${sanitizeFileSegment(graphName)}.png`;
        anchor.click();
      } finally {
        globalThis.URL.revokeObjectURL(pngUrl);
      }
    } finally {
      globalThis.URL.revokeObjectURL(svgUrl);
    }
  }
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(
        new Error('The diagram image could not be rendered for PNG export.'),
      );
    image.src = source;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('The diagram image could not be encoded as PNG.'));

        return;
      }

      resolve(blob);
    }, 'image/png');
  });
}

function normalizeSvgMarkup(
  markup: string,
  width: number,
  height: number,
): string {
  let normalizedMarkup = markup;

  if (!normalizedMarkup.includes('xmlns="http://www.w3.org/2000/svg"')) {
    normalizedMarkup = normalizedMarkup.replace(
      '<svg',
      '<svg xmlns="http://www.w3.org/2000/svg"',
    );
  }

  if (!normalizedMarkup.includes('xmlns:xlink=')) {
    normalizedMarkup = normalizedMarkup.replace(
      '<svg',
      '<svg xmlns:xlink="http://www.w3.org/1999/xlink"',
    );
  }

  if (!/width="\d/.test(normalizedMarkup)) {
    normalizedMarkup = normalizedMarkup.replace(
      '<svg',
      `<svg width="${width}"`,
    );
  }

  if (!/height="\d/.test(normalizedMarkup)) {
    normalizedMarkup = normalizedMarkup.replace(
      '<svg',
      `<svg height="${height}"`,
    );
  }

  return normalizedMarkup;
}

function sanitizeFileSegment(value: string): string {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'graph-export';
}
