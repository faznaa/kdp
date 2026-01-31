import { Chapter } from "./types";

// Patterns to detect chapter headings
const CHAPTER_PATTERNS = [
  /^chapter\s+\d+/i,
  /^chapter\s+[ivxlcdm]+/i,          // Roman numerals
  /^ch\.\s*\d+/i,
  /^part\s+\d+/i,
  /^part\s+[ivxlcdm]+/i,
  /^section\s+\d+/i,
  /^prologue$/i,
  /^epilogue$/i,
  /^introduction$/i,
  /^foreword$/i,
  /^preface$/i,
  /^afterword$/i,
  /^appendix/i,
  /^acknowledgments?$/i,
  /^dedication$/i,
  /^\d+\.\s+\S/,                       // "1. Title"
  /^#\s+/,                             // Markdown heading
  /^##\s+/,                            // Markdown heading level 2
];

function isChapterHeading(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return CHAPTER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function splitIntoChapters(text: string): Chapter[] {
  if (!text.trim()) return [];

  const lines = text.split("\n");
  const chapters: Chapter[] = [];
  let currentTitle = "";
  let currentLines: string[] = [];
  let foundAnyChapter = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isChapterHeading(line)) {
      // Save previous chapter if it has content
      if (currentLines.length > 0 || foundAnyChapter) {
        const content = currentLines.join("\n").trim();
        if (content || foundAnyChapter) {
          chapters.push({
            id: generateId(),
            title: currentTitle || `Chapter ${chapters.length + 1}`,
            content,
          });
        }
      }
      foundAnyChapter = true;
      currentTitle = line.trim().replace(/^#+\s*/, "");
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  // Push the last chapter
  const lastContent = currentLines.join("\n").trim();
  if (foundAnyChapter) {
    chapters.push({
      id: generateId(),
      title: currentTitle || `Chapter ${chapters.length + 1}`,
      content: lastContent,
    });
  } else if (lastContent) {
    // No chapter headings found — treat as single chapter
    chapters.push({
      id: generateId(),
      title: "Chapter 1",
      content: lastContent,
    });
  }

  return chapters;
}

// Recombine chapters back to full text
export function chaptersToText(chapters: Chapter[]): string {
  return chapters
    .map((ch) => `${ch.title}\n\n${ch.content}`)
    .join("\n\n\n");
}
