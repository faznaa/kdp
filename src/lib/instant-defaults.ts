import { KDPSettings, FrontMatter, BackMatter } from "./types";
import { TRIM_SIZES } from "./kdp-rules";

// Best default settings for "publish-ready" output
// Based on KDP best practices for fiction and non-fiction books
export const INSTANT_BEST_DEFAULTS: KDPSettings = {
  trimSize: TRIM_SIZES[3], // 6" × 9" - Most popular for fiction/non-fiction
  bleed: false, // Most text-based books don't need bleed
  paperColor: "cream", // Easier on eyes, preferred for fiction
  fontSize: 11, // Standard readable size (10-12pt typical range)
  lineHeight: 1.5, // Comfortable reading spacing
  fontFamily: "serif", // Traditional, professional book appearance
};

// Minimal front matter - just the essentials
export const INSTANT_FRONT_MATTER: FrontMatter = {
  titlePage: {
    kind: "title-page",
    enabled: true,
    content: "",
  },
  copyrightPage: {
    kind: "copyright-page",
    enabled: true,
    content: "", // Will be auto-generated
  },
  dedication: {
    kind: "dedication",
    enabled: false,
    content: "For everyone who believed in this book.",
  },
};

// All back matter disabled by default for quick publishing
export const INSTANT_BACK_MATTER: BackMatter = {
  aboutAuthor: {
    kind: "about-author",
    enabled: false,
    content: "",
  },
  alsoBy: {
    kind: "also-by",
    enabled: false,
    content: "",
  },
  acknowledgments: {
    kind: "acknowledgments",
    enabled: false,
    content: "",
  },
};

// Try to extract title from the first line of text
export function extractTitleFromText(text: string): string {
  const lines = text.trim().split("\n");
  if (lines.length === 0) return "";

  const firstLine = lines[0].trim();

  // Check if first line looks like a title (short, no period at end, all caps or title case)
  if (
    firstLine.length > 0 &&
    firstLine.length < 100 &&
    !firstLine.endsWith(".") &&
    !firstLine.startsWith("Chapter") &&
    !firstLine.startsWith("CHAPTER")
  ) {
    // Clean up markdown headers
    return firstLine.replace(/^#+\s*/, "");
  }

  return "";
}
