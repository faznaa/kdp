import { getDocument, GlobalWorkerOptions, version } from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

// Use a CDN-hosted worker matching the installed pdfjs-dist version.
if (typeof window !== "undefined" && !GlobalWorkerOptions.workerSrc) {
  GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
}

/**
 * Extract all text from a PDF ArrayBuffer, page by page.
 * Pages are separated by double newlines.
 */
export async function extractTextFromPDF(
  data: ArrayBuffer
): Promise<string> {
  const pdf = await getDocument({ data }).promise;
  const pageTexts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    let lastY: number | null = null;
    let lineText = "";
    const lines: string[] = [];

    for (const item of content.items) {
      // Skip non-text items (marked content, etc.)
      if (!("str" in item)) continue;
      const textItem = item as TextItem;

      // Detect line breaks by checking if the Y coordinate changed
      const y = textItem.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        lines.push(lineText);
        lineText = textItem.str;
      } else {
        lineText += textItem.str;
      }
      lastY = y;
    }

    if (lineText) {
      lines.push(lineText);
    }

    pageTexts.push(lines.join("\n"));
  }

  return pageTexts.join("\n\n");
}
