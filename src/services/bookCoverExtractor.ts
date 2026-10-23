import * as pdfjsLib from 'pdfjs-dist/build/pdf.js';
import ePub from 'epubjs';
import { bookSearchService } from './bookSearchService';

// Configure Mozilla PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

export interface ExtractedCoverResult {
  coverUrl: string;
  title?: string;
  author?: string;
  totalPages?: number;
}

/**
 * Clean up titles and author names from filenames (removes oceanofpdf.com, extension, underscores, etc.)
 */
export function cleanFilenameMeta(fileName: string): { title: string; author?: string } {
  // Strip extension
  let name = fileName.replace(/\.[^/.]+$/, '');

  // Strip oceanofpdf.com prefixes/suffixes
  name = name.replace(/^(oceanofpdf\.com|[\[(]oceanofpdf\.com[\])])[\s_.-]*/i, '');
  name = name.replace(/[\s_.-]*(oceanofpdf\.com|[\[(]oceanofpdf\.com[\])])$/i, '');
  name = name.replace(/oceanofpdf\.com/gi, '');

  // Replace underscores and multiple dashes with spaces
  name = name.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();

  // Try to parse "Title by Author"
  if (name.includes(' by ')) {
    const parts = name.split(/\s+by\s+/i);
    if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
      return { title: parts[0].trim(), author: parts[1].trim() };
    }
  }

  // Try to parse "Title - Author"
  if (name.includes(' - ')) {
    const parts = name.split(' - ');
    if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
      return { title: parts[0].trim(), author: parts[1].trim() };
    }
  }

  return { title: name };
}

/**
 * Render page 1 of a PDF onto an off-screen canvas and export as a lightweight, crisp JPEG data URL
 */
export async function extractPdfCover(fileBlob: Blob | ArrayBuffer): Promise<ExtractedCoverResult | null> {
  try {
    let arrayBuffer: ArrayBuffer;
    if (fileBlob instanceof ArrayBuffer) {
      arrayBuffer = fileBlob;
    } else {
      arrayBuffer = await fileBlob.arrayBuffer();
    }

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
      cMapPacked: true,
    });

    const doc = await loadingTask.promise;
    let title: string | undefined;
    let author: string | undefined;

    try {
      const meta = await doc.getMetadata();
      const info = meta?.info as any;
      if (info?.Title && typeof info.Title === 'string' && info.Title.trim().length > 1) {
        title = info.Title.trim();
      }
      if (info?.Author && typeof info.Author === 'string' && info.Author.trim().length > 1) {
        author = info.Author.trim();
      }
    } catch {}

    const page = await doc.getPage(1);
    const unscaledViewport = page.getViewport({ scale: 1.0 });

    // Target thumbnail width around 320px for high definition on retina displays while keeping size small (~20KB)
    const targetWidth = 320;
    const scale = targetWidth / unscaledViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;

    const coverUrl = canvas.toDataURL('image/jpeg', 0.88);

    return {
      coverUrl,
      title,
      author,
      totalPages: doc.numPages,
    };
  } catch (err) {
    console.warn('PDF cover extraction error:', err);
    return null;
  }
}

/**
 * Extract cover image and metadata from an EPUB file
 */
export async function extractEpubCover(fileBlob: Blob | ArrayBuffer): Promise<ExtractedCoverResult | null> {
  try {
    let arrayBuffer: ArrayBuffer;
    if (fileBlob instanceof ArrayBuffer) {
      arrayBuffer = fileBlob;
    } else {
      arrayBuffer = await fileBlob.arrayBuffer();
    }

    const book = ePub(arrayBuffer);
    await book.ready;

    let title: string | undefined;
    let author: string | undefined;

    try {
      const meta = await (book as any).loaded.metadata;
      if (meta?.title) title = meta.title;
      if (meta?.creator) author = meta.creator;
    } catch {}

    const rawCoverUrl = await book.coverUrl();
    if (rawCoverUrl) {
      // If it is a temporary blob URL, convert to permanent data URL so it never expires in IndexedDB
      if (rawCoverUrl.startsWith('blob:') || rawCoverUrl.startsWith('http')) {
        try {
          const resp = await fetch(rawCoverUrl);
          const blob = await resp.blob();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          return { coverUrl: dataUrl, title, author };
        } catch {
          return { coverUrl: rawCoverUrl, title, author };
        }
      }
      return { coverUrl: rawCoverUrl, title, author };
    }

    return null;
  } catch (err) {
    console.warn('EPUB cover extraction error:', err);
    return null;
  }
}

/**
 * Generate an elegant classic clothbound book cover on HTML Canvas when no image is embedded
 */
export function generateClassicCoverCanvas(title: string, author?: string, format = 'DOC'): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 450;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const palettes = [
    ['#1c1917', '#e5e7eb'], // Warm Stone
    ['#18181b', '#f4f4f5'], // Deep Zinc
    ['#09090b', '#e4e4e7'], // Obsidian Cloth
    ['#1e293b', '#e2e8f0'], // Archival Slate
    ['#292524', '#fde047'], // Antique Leather
  ];

  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = (hash << 5) - hash + title.charCodeAt(i);
  const selected = palettes[Math.abs(hash) % palettes.length];

  // Base solid archival cloth cover
  ctx.fillStyle = selected[0];
  ctx.fillRect(0, 0, 300, 450);

  // Left spine shadow & highlight
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(0, 0, 18, 450);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.fillRect(18, 0, 2, 450);

  // Decorative border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(28, 28, 244, 394);

  // Header format pill
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.font = 'bold 10px monospace';
  ctx.fillText(`LIREAD · ${format.toUpperCase()}`, 38, 52);

  // Foil ornament line
  ctx.fillStyle = selected[2];
  ctx.fillRect(38, 62, 32, 2);

  // Title text (with line wrapping)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px serif';
  const words = title.split(' ');
  let line = '';
  let y = 145;
  for (const word of words) {
    const testLine = line + word + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > 220 && line !== '') {
      ctx.fillText(line.trim(), 38, y);
      line = word + ' ';
      y += 28;
      if (y > 270) break;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), 38, y);

  // Author
  const authorText = author && author !== 'Unknown Author' ? author : 'Literary Edition';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
  ctx.font = 'italic 13px sans-serif';
  ctx.fillText(authorText, 38, y + 36);

  // Bottom classic edition badge
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.font = '9px monospace';
  ctx.fillText('PERSONAL ARCHIVE', 38, 400);

  return canvas.toDataURL('image/jpeg', 0.88);
}

/**
 * Universal Cover Extractor: Tries direct file page extraction (PDF page 1, EPUB cover),
 * then Open Library search, then canvas generation.
 */
export async function extractBookCover(book: {
  fileBlob?: Blob | ArrayBuffer;
  format: string;
  title: string;
  author?: string;
}): Promise<ExtractedCoverResult> {
  // 1. Direct PDF Extraction
  if (book.format.toLowerCase() === 'pdf' && book.fileBlob) {
    const pdfRes = await extractPdfCover(book.fileBlob);
    if (pdfRes && pdfRes.coverUrl) {
      return pdfRes;
    }
  }

  // 2. Direct EPUB Extraction
  if (book.format.toLowerCase() === 'epub' && book.fileBlob) {
    const epubRes = await extractEpubCover(book.fileBlob);
    if (epubRes && epubRes.coverUrl) {
      return epubRes;
    }
  }

  // 3. Open Library Cover Search by clean title
  try {
    const clean = book.title.replace(/\b(oceanofpdf\.com|pdf|epub|txt|free)\b/gi, '').trim();
    if (clean.length >= 3) {
      const searchRes = await bookSearchService.searchBooks(clean, { limit: 1 });
      if (searchRes.books.length > 0 && searchRes.books[0].coverImageUrl) {
        return {
          coverUrl: searchRes.books[0].coverImageUrl,
          title: searchRes.books[0].title,
          author: searchRes.books[0].author,
        };
      }
    }
  } catch {}

  // 4. Elegant Canvas Generation fallback
  const generatedCover = generateClassicCoverCanvas(book.title, book.author, book.format);
  return {
    coverUrl: generatedCover,
  };
}
