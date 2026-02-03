import { getDocument, GlobalWorkerOptions, version } from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

// Use a CDN-hosted worker matching the installed pdfjs-dist version.
if (typeof window !== "undefined" && !GlobalWorkerOptions.workerSrc) {
  GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
}

/**
 * Extract all text from a PDF ArrayBuffer, page by page.
 * Removes unwanted line breaks from text wrapping while preserving paragraph breaks.
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
    let lastLineHeight: number | null = null;
    const lines: Array<{ text: string; gapBefore: number }> = [];
    let lineText = "";

    for (const item of content.items) {
      // Skip non-text items (marked content, etc.)
      if (!("str" in item)) continue;
      const textItem = item as TextItem;

      // Get Y coordinate and estimate line height from transform
      const y = textItem.transform[5];
      const height = Math.abs(textItem.transform[0]) || 12; // Default to 12 if not available

      if (lastY !== null && Math.abs(y - lastY) > 2) {
        // Line break detected - calculate the gap
        const gap = Math.abs(lastY - y);
        lines.push({ text: lineText, gapBefore: gap });
        lineText = textItem.str;
        lastLineHeight = height;
      } else {
        lineText += textItem.str;
      }
      lastY = y;
      if (lastLineHeight === null) lastLineHeight = height;
    }

    if (lineText) {
      lines.push({ text: lineText, gapBefore: 0 });
    }

    // Calculate average line spacing to detect paragraph breaks
    const gaps = lines.map((l) => l.gapBefore).filter((g) => g > 0);
    const avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 14;
    // Paragraph break threshold: 1.5x the average line spacing
    const paragraphThreshold = avgGap * 1.5;

    // Join lines: use space for regular line breaks, double newline for paragraph breaks
    const paragraphs: string[] = [];
    let currentParagraph = "";

    for (const line of lines) {
      const trimmedText = line.text.trim();
      if (!trimmedText) {
        // Empty line indicates paragraph break
        if (currentParagraph) {
          paragraphs.push(currentParagraph);
          currentParagraph = "";
        }
        continue;
      }

      // Check if this is a paragraph break (large gap) or regular line wrap
      const isParagraphBreak = line.gapBefore > paragraphThreshold;

      if (isParagraphBreak && currentParagraph) {
        paragraphs.push(currentParagraph);
        currentParagraph = trimmedText;
      } else if (currentParagraph) {
        // Join with space, handling hyphenation
        if (currentParagraph.endsWith("-")) {
          // Remove hyphen and join directly (word was split)
          currentParagraph = currentParagraph.slice(0, -1) + trimmedText;
        } else {
          currentParagraph += " " + trimmedText;
        }
      } else {
        currentParagraph = trimmedText;
      }
    }

    if (currentParagraph) {
      paragraphs.push(currentParagraph);
    }

    pageTexts.push(paragraphs.join("\n\n"));
  }

  return pageTexts.join("\n\n");
}
