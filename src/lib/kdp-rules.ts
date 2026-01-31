import { TrimSize, Margins, KDPSettings, ValidationIssue } from "./types";

// Official KDP trim sizes (inches)
export const TRIM_SIZES: TrimSize[] = [
  { label: '5" × 8"', width: 5, height: 8 },
  { label: '5.25" × 8"', width: 5.25, height: 8 },
  { label: '5.5" × 8.5"', width: 5.5, height: 8.5 },
  { label: '6" × 9"', width: 6, height: 9 },
  { label: '6.14" × 9.21"', width: 6.14, height: 9.21 },
  { label: '6.69" × 9.61"', width: 6.69, height: 9.61 },
  { label: '7" × 10"', width: 7, height: 10 },
  { label: '7.44" × 9.69"', width: 7.44, height: 9.69 },
  { label: '7.5" × 9.25"', width: 7.5, height: 9.25 },
  { label: '8" × 10"', width: 8, height: 10 },
  { label: '8.25" × 6"', width: 8.25, height: 6 },
  { label: '8.25" × 8.25"', width: 8.25, height: 8.25 },
  { label: '8.5" × 8.5"', width: 8.5, height: 8.5 },
  { label: '8.5" × 11"', width: 8.5, height: 11 },
];

// KDP gutter (inside margin) based on page count
export function getMinGutter(pageCount: number): number {
  if (pageCount <= 150) return 0.375;
  if (pageCount <= 300) return 0.5;
  if (pageCount <= 500) return 0.625;
  if (pageCount <= 700) return 0.75;
  return 0.875; // 701-828
}

// KDP minimum margins
export function getMinMargins(pageCount: number, bleed: boolean): Margins {
  const gutter = getMinGutter(pageCount);

  if (bleed) {
    return {
      top: 0.375,
      bottom: 0.375,
      inside: gutter,
      outside: 0.375,
    };
  }

  return {
    top: 0.25,
    bottom: 0.25,
    inside: gutter,
    outside: 0.25,
  };
}

// Recommended comfortable margins (slightly larger than minimum)
export function getRecommendedMargins(pageCount: number, bleed: boolean): Margins {
  const min = getMinMargins(pageCount, bleed);
  return {
    top: Math.max(min.top, 0.5),
    bottom: Math.max(min.bottom, 0.5),
    inside: min.inside + 0.125, // slightly more gutter for readability
    outside: Math.max(min.outside, 0.5),
  };
}

// Calculate the text block dimensions
export function getTextBlockSize(
  trimSize: TrimSize,
  margins: Margins
): { width: number; height: number } {
  return {
    width: trimSize.width - margins.inside - margins.outside,
    height: trimSize.height - margins.top - margins.bottom,
  };
}

// Bleed dimensions - KDP requires 0.125" bleed on outside, top, bottom
export function getBleedDimensions(trimSize: TrimSize): {
  width: number;
  height: number;
} {
  return {
    width: trimSize.width + 0.125, // bleed only on outside edge
    height: trimSize.height + 0.25, // bleed on top and bottom
  };
}

// Estimate page count from text content
export function estimatePageCount(
  text: string,
  settings: KDPSettings,
  margins: Margins
): number {
  if (!text.trim()) return 0;

  const textBlock = getTextBlockSize(settings.trimSize, margins);
  // Convert inches to points (1 inch = 72 points)
  const textWidthPt = textBlock.width * 72;
  const textHeightPt = textBlock.height * 72;

  const lineHeightPt = settings.fontSize * settings.lineHeight;
  const linesPerPage = Math.floor(textHeightPt / lineHeightPt);

  // Approximate characters per line based on font size and text width
  // Average character width is roughly 0.5 * font size for most fonts
  const avgCharWidth = settings.fontSize * 0.48;
  const charsPerLine = Math.floor(textWidthPt / avgCharWidth);

  if (charsPerLine <= 0 || linesPerPage <= 0) return 1;

  const lines = text.split("\n");
  let totalLines = 0;

  for (const line of lines) {
    if (line.trim() === "") {
      totalLines += 1;
    } else {
      totalLines += Math.max(1, Math.ceil(line.length / charsPerLine));
    }
  }

  const pages = Math.max(1, Math.ceil(totalLines / linesPerPage));
  // KDP requires even page count (recto/verso)
  return pages % 2 === 0 ? pages : pages + 1;
}

// Full KDP validation
export function validateKDP(
  settings: KDPSettings,
  pageCount: number,
  margins: Margins
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const minMargins = getMinMargins(pageCount, settings.bleed);

  // Page count validation
  if (pageCount < 24) {
    issues.push({
      type: "error",
      category: "page-count",
      message: `Page count is ${pageCount}. KDP requires a minimum of 24 pages.`,
    });
  }
  if (pageCount > 828) {
    issues.push({
      type: "error",
      category: "page-count",
      message: `Page count is ${pageCount}. KDP allows a maximum of 828 pages.`,
    });
  }
  if (pageCount % 2 !== 0) {
    issues.push({
      type: "warning",
      category: "page-count",
      message: "Page count should be even for a properly bound book.",
    });
  }

  // Margin validation
  if (margins.top < minMargins.top) {
    issues.push({
      type: "error",
      category: "margins",
      message: `Top margin (${margins.top}") is below KDP minimum (${minMargins.top}").`,
    });
  }
  if (margins.bottom < minMargins.bottom) {
    issues.push({
      type: "error",
      category: "margins",
      message: `Bottom margin (${margins.bottom}") is below KDP minimum (${minMargins.bottom}").`,
    });
  }
  if (margins.inside < minMargins.inside) {
    issues.push({
      type: "error",
      category: "margins",
      message: `Inside margin/gutter (${margins.inside}") is below KDP minimum (${minMargins.inside}") for ${pageCount} pages.`,
    });
  }
  if (margins.outside < minMargins.outside) {
    issues.push({
      type: "error",
      category: "margins",
      message: `Outside margin (${margins.outside}") is below KDP minimum (${minMargins.outside}").`,
    });
  }

  // Bleed validation
  if (settings.bleed) {
    const textBlock = getTextBlockSize(settings.trimSize, margins);
    if (textBlock.width < 1 || textBlock.height < 1) {
      issues.push({
        type: "error",
        category: "bleed",
        message: "Text area is too small with current bleed margins.",
      });
    }
    issues.push({
      type: "warning",
      category: "bleed",
      message:
        "Bleed is enabled. Ensure any images or backgrounds extend 0.125\" beyond trim edges.",
    });
  }

  // Content validation
  if (pageCount === 0) {
    issues.push({
      type: "warning",
      category: "content",
      message: "No content detected. Paste your book text to begin.",
    });
  }

  // Check text block isn't unreasonably small
  const textBlock = getTextBlockSize(settings.trimSize, margins);
  if (textBlock.width < 2) {
    issues.push({
      type: "warning",
      category: "margins",
      message: "Text area width is very narrow. Consider reducing margins or choosing a wider trim size.",
    });
  }

  return issues;
}

export const DEFAULT_SETTINGS: KDPSettings = {
  trimSize: TRIM_SIZES[3], // 6" × 9"
  bleed: false,
  paperColor: "white",
  fontSize: 11,
  lineHeight: 1.5,
  fontFamily: "serif",
};
