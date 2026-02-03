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

// If a title has more than 10 words, something went wrong with detection
// Try to split at sensible break points and return [title, overflow]
function sanitizeChapterTitle(rawTitle: string): { title: string; overflow: string } {
  const trimmed = rawTitle.trim();
  const words = trimmed.split(/\s+/);

  // If 10 words or fewer, it's fine
  if (words.length <= 10) {
    return { title: trimmed, overflow: "" };
  }

  // Title is too long - try to find a sensible break point

  // 1. Check for common separators that indicate title end
  const separatorPatterns = [
    /^(chapter\s+\d+[.:]\s*[^.!?\n]{0,50})[.!?\n]/i,  // "Chapter 1: Title." or "Chapter 1. Title."
    /^(chapter\s+[ivxlcdm]+[.:]\s*[^.!?\n]{0,50})[.!?\n]/i,
    /^(part\s+\d+[.:]\s*[^.!?\n]{0,50})[.!?\n]/i,
    /^(prologue[.:]\s*[^.!?\n]{0,50})[.!?\n]/i,
    /^(epilogue[.:]\s*[^.!?\n]{0,50})[.!?\n]/i,
    /^(\d+\.\s+[^.!?\n]{0,50})[.!?\n]/i,
  ];

  for (const pattern of separatorPatterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      const title = match[1].trim();
      const overflow = trimmed.slice(match[0].length - 1).trim(); // -1 to not include the separator
      if (title.split(/\s+/).length <= 10) {
        return { title, overflow };
      }
    }
  }

  // 2. Look for colon, em-dash, or double-hyphen as title separator
  const colonMatch = trimmed.match(/^([^:]{5,60}):\s*(.+)$/);
  if (colonMatch) {
    const potentialTitle = colonMatch[1].trim();
    if (potentialTitle.split(/\s+/).length <= 10) {
      return { title: potentialTitle, overflow: colonMatch[2].trim() };
    }
  }

  const dashMatch = trimmed.match(/^([^—–-]{5,60})[—–]\s*(.+)$/);
  if (dashMatch) {
    const potentialTitle = dashMatch[1].trim();
    if (potentialTitle.split(/\s+/).length <= 10) {
      return { title: potentialTitle, overflow: dashMatch[2].trim() };
    }
  }

  // 3. Look for a period that might end the title (first sentence)
  const periodMatch = trimmed.match(/^([^.]{10,80}\.)\s+(.+)$/);
  if (periodMatch) {
    const potentialTitle = periodMatch[1].trim();
    if (potentialTitle.split(/\s+/).length <= 10) {
      return { title: potentialTitle, overflow: periodMatch[2].trim() };
    }
  }

  // 4. Fallback: just take the first 6-8 words as title
  // Look for chapter pattern and keep it plus a few words
  const chapterMatch = trimmed.match(/^(chapter\s+\d+|chapter\s+[ivxlcdm]+|part\s+\d+|prologue|epilogue|\d+\.)/i);
  if (chapterMatch) {
    // Keep chapter indicator + next 4 words max
    const indicator = chapterMatch[0];
    const rest = trimmed.slice(indicator.length).trim();
    const restWords = rest.split(/\s+/);
    const titleWords = restWords.slice(0, 4).join(" ");
    const overflowWords = restWords.slice(4).join(" ");
    return {
      title: (indicator + " " + titleWords).trim(),
      overflow: overflowWords
    };
  }

  // 5. Ultimate fallback: first 6 words
  return {
    title: words.slice(0, 6).join(" "),
    overflow: words.slice(6).join(" ")
  };
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

      // Sanitize the chapter title - if too long, split it
      const rawTitle = line.trim().replace(/^#+\s*/, "");
      const { title, overflow } = sanitizeChapterTitle(rawTitle);
      currentTitle = title;
      currentLines = overflow ? [overflow] : [];
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
