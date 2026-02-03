# KDP Book Formatter - Documentation

A Next.js application for formatting manuscripts into KDP (Kindle Direct Publishing) ready PDFs.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Core Components](#core-components)
- [Library Modules](#library-modules)
- [Data Types](#data-types)
- [Workflow](#workflow)

---

## Overview

KDP Book Formatter is a web-based tool that helps authors prepare their manuscripts for Amazon's Kindle Direct Publishing platform. It handles:

- Document upload (DOCX and PDF)
- Automatic chapter detection
- KDP-compliant page formatting
- Rich text editing
- PDF generation with proper margins, gutters, and trim sizes

---

## Features

### Instant KDP Mode (`/instant`)

A 4-step wizard for quick book formatting:

1. **Upload** - Drag & drop DOCX or PDF files
2. **Info** - Review detected chapters, edit titles, merge chapters
3. **Settings** - Configure trim size, paper color, fonts
4. **Preview** - View and download the formatted PDF

### Rich Text Editing

- Bold, italic, underline formatting
- Font family selection (Serif, Sans-serif, Monospace)
- Font size adjustment (8-24pt)
- List styles (bullet, numbered, dash)
- Text indentation
- Heading alignment (left, center, right)
- "Apply to all headings" batch option

### Book Structure

- **Front Matter**: Title page, copyright page, dedication
- **Body**: Chapters with automatic detection
- **Back Matter**: About author, also by, acknowledgments

### Layout Options

- Chapter start side (any, left, right)
- Manual blank page insertion
- Two-page spread preview (book view mode)

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main editor page
│   ├── layout.tsx            # Root layout
│   └── instant/
│       └── page.tsx          # Instant KDP wizard
├── components/
│   ├── instant/
│   │   ├── WizardStepper.tsx       # Step indicator
│   │   ├── UploadStep.tsx          # File upload (Step 1)
│   │   ├── ConfirmInfoStep.tsx     # Chapter review (Step 2)
│   │   ├── SettingsStep.tsx        # KDP settings (Step 3)
│   │   ├── PreviewStep.tsx         # PDF preview (Step 4)
│   │   └── AdvancedEditorStep.tsx  # Rich text editor
│   ├── BookMatterPanel.tsx   # Front/back matter editor
│   ├── ChapterList.tsx       # Chapter navigation
│   ├── Editor.tsx            # Text editor component
│   ├── KDPSettings.tsx       # Settings panel
│   ├── PDFDownload.tsx       # PDF export button
│   ├── PrintPreview.tsx      # Page preview component
│   └── ValidationPanel.tsx   # KDP validation warnings
└── lib/
    ├── types.ts              # TypeScript interfaces
    ├── kdp-rules.ts          # KDP validation & margins
    ├── chapter-splitter.ts   # Chapter detection
    ├── book-matter.ts        # Section assembly
    ├── pdf-generator.ts      # PDF creation
    ├── pdf-extractor.ts      # PDF text extraction
    ├── instant-defaults.ts   # Default settings
    └── storage.ts            # Local storage handling
```

---

## Core Components

### UploadStep (`src/components/instant/UploadStep.tsx`)

Handles file upload with drag-and-drop support.

**Supported formats:**
- `.docx` - Uses mammoth.js for text extraction
- `.pdf` - Uses PDF.js for text extraction

**Props:**
```typescript
interface UploadStepProps {
  onFileProcessed: (text: string, fileName: string) => void;
  onNext: () => void;
}
```

### ConfirmInfoStep (`src/components/instant/ConfirmInfoStep.tsx`)

Displays detected chapters for review and editing.

**Features:**
- Edit book title and author name
- Edit individual chapter titles
- Merge chapters (when detection incorrectly splits content)
- Word count display per chapter

**Props:**
```typescript
interface ConfirmInfoStepProps {
  bookTitle: string;
  authorName: string;
  chapters: Chapter[];
  onTitleChange: (title: string) => void;
  onAuthorChange: (author: string) => void;
  onChapterTitleChange: (id: string, title: string) => void;
  onChapterMergeWithPrevious: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}
```

### SettingsStep (`src/components/instant/SettingsStep.tsx`)

KDP formatting configuration.

**Options:**
- Trim size (14 standard KDP sizes)
- Paper color (white/cream)
- Bleed settings
- Font size (8-16pt)
- Line height (1.0-2.0)
- Font family (serif/sans-serif/monospace)

### PreviewStep (`src/components/instant/PreviewStep.tsx`)

PDF preview and export.

**Features:**
- Single page and book view (two-page spread) modes
- Front/back matter toggle
- Chapter start side options
- Blank page insertion
- PDF download

### AdvancedEditorStep (`src/components/instant/AdvancedEditorStep.tsx`)

Rich text editor for chapter content.

**Toolbar options:**
- Text formatting (bold, italic, underline)
- Font family and size
- List styles
- Indentation
- Heading alignment with "apply to all" option

**Implementation:** Uses native `contentEditable` with `document.execCommand()` for broad browser compatibility.

---

## Library Modules

### types.ts

Core TypeScript interfaces for the application.

```typescript
// Book trim dimensions
interface TrimSize {
  label: string;
  width: number;   // inches
  height: number;  // inches
}

// KDP formatting settings
interface KDPSettings {
  trimSize: TrimSize;
  bleed: boolean;
  paperColor: "white" | "cream";
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
}

// Page margins
interface Margins {
  top: number;
  bottom: number;
  inside: number;   // gutter side
  outside: number;
}

// Chapter data
interface Chapter {
  id: string;
  title: string;
  content: string;
  htmlContent?: string;  // Rich text HTML
  style?: ChapterStyle;
}

// Chapter styling
interface ChapterStyle {
  headingAlignment: "left" | "center" | "right";
}

// Section types
type SectionKind =
  | "title-page"
  | "copyright-page"
  | "dedication"
  | "chapter"
  | "about-author"
  | "also-by"
  | "acknowledgments"
  | "blank-page";
```

### kdp-rules.ts

KDP compliance validation and calculations.

**Available trim sizes:**
- 5" × 8", 5.25" × 8", 5.5" × 8.5"
- 6" × 9" (most popular)
- 6.14" × 9.21", 6.69" × 9.61"
- 7" × 10", 7.44" × 9.69", 7.5" × 9.25"
- 8" × 10", 8.25" × 6", 8.25" × 8.25"
- 8.5" × 8.5", 8.5" × 11"

**Key functions:**

```typescript
// Get minimum gutter margin based on page count
getMinGutter(pageCount: number): number

// Get minimum margins for KDP compliance
getMinMargins(pageCount: number, bleed: boolean): Margins

// Get recommended comfortable margins
getRecommendedMargins(pageCount: number, bleed: boolean): Margins

// Estimate page count from text
estimatePageCount(text: string, settings: KDPSettings, margins: Margins): number

// Validate settings against KDP requirements
validateKDP(settings: KDPSettings, pageCount: number, margins: Margins): ValidationIssue[]
```

**Gutter requirements by page count:**
| Pages | Min Gutter |
|-------|------------|
| 1-150 | 0.375" |
| 151-300 | 0.500" |
| 301-500 | 0.625" |
| 501-700 | 0.750" |
| 701-828 | 0.875" |

### chapter-splitter.ts

Automatic chapter detection from text.

**Detected patterns:**
- `Chapter 1`, `Chapter I` (roman numerals)
- `Ch. 1`
- `Part 1`, `Part I`
- `Section 1`
- `Prologue`, `Epilogue`, `Introduction`, `Foreword`, `Preface`, `Afterword`
- `Appendix`, `Acknowledgments`, `Dedication`
- `1. Title` (numbered sections)
- Markdown headings (`#`, `##`)

**Title sanitization:**
If a detected chapter title has more than 10 words, it's considered incorrectly detected. The module attempts to split at:
1. Punctuation separators (colon, em-dash, period)
2. First sentence boundary
3. Falls back to first 6 words

Overflow text is preserved as chapter content.

### pdf-extractor.ts

Extracts text from PDF files using PDF.js.

**Features:**
- Analyzes line spacing to distinguish paragraph breaks from line wraps
- Joins wrapped lines with spaces
- Only preserves actual paragraph breaks (>1.5x average line spacing)
- Handles hyphenated words at line endings

### pdf-generator.ts

Generates KDP-compliant PDFs using jsPDF.

**Features:**
- Proper margin handling for recto/verso pages
- Bleed support
- Page numbering (chapters and back matter only)
- Section-specific formatting:
  - Title page: centered, large bold title
  - Copyright page: small font, bottom-aligned
  - Dedication: centered italic
  - Chapters: heading with body text
- Rich text support (bold, italic via HTML tags)
- Heading alignment

### book-matter.ts

Assembles book sections in proper order.

**Order:**
1. Front matter (no page numbers)
   - Title page
   - Copyright page
   - Dedication
2. Body chapters (with page numbers)
3. Back matter (with page numbers)
   - About the Author
   - Also By
   - Acknowledgments

### instant-defaults.ts

Default settings optimized for publishing.

```typescript
const INSTANT_BEST_DEFAULTS: KDPSettings = {
  trimSize: "6\" × 9\"",      // Most popular size
  bleed: false,               // Standard for text books
  paperColor: "cream",        // Easier on eyes
  fontSize: 11,               // Standard readable size
  lineHeight: 1.5,            // Comfortable spacing
  fontFamily: "serif",        // Traditional appearance
};
```

---

## Data Types

### ValidationIssue

```typescript
interface ValidationIssue {
  type: "error" | "warning";
  category: "margins" | "page-count" | "bleed" | "content" | "trim";
  message: string;
}
```

### RenderableSection

```typescript
interface RenderableSection {
  id: string;
  kind: SectionKind;
  title: string;
  content: string;
  htmlContent?: string;
  style?: ChapterStyle;
  showPageNumber: boolean;
}
```

### FrontMatter / BackMatter

```typescript
interface FrontMatter {
  titlePage: MatterSection;
  copyrightPage: MatterSection;
  dedication: MatterSection;
}

interface BackMatter {
  aboutAuthor: MatterSection;
  alsoBy: MatterSection;
  acknowledgments: MatterSection;
}

interface MatterSection {
  kind: SectionKind;
  enabled: boolean;
  content: string;
}
```

---

## Workflow

### Instant KDP Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Upload    │ ──▶ │    Info     │ ──▶ │  Settings   │ ──▶ │   Preview   │
│   (.docx    │     │  (chapters, │     │  (trim,     │     │  (download  │
│    .pdf)    │     │   title)    │     │   fonts)    │     │    PDF)     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### Chapter Detection Flow

```
Raw Text ──▶ Split by newlines ──▶ Match chapter patterns ──▶ Sanitize titles ──▶ Chapter[]
```

### PDF Generation Flow

```
Sections + Settings + Margins ──▶ jsPDF ──▶ Add pages ──▶ Render content ──▶ Blob
```

---

## KDP Requirements Reference

| Requirement | Value |
|-------------|-------|
| Min pages | 24 |
| Max pages | 828 |
| Page count | Must be even |
| Min outside margin | 0.25" (no bleed) / 0.375" (with bleed) |
| Min top/bottom | 0.25" (no bleed) / 0.375" (with bleed) |
| Bleed extension | 0.125" |

---

## Dependencies

- **Next.js** - React framework
- **jsPDF** - PDF generation
- **PDF.js (pdfjs-dist)** - PDF text extraction
- **mammoth** - DOCX text extraction
- **Tailwind CSS** - Styling
