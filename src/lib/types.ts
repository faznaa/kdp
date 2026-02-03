export interface TrimSize {
  label: string;
  width: number;  // inches
  height: number; // inches
}

export interface KDPSettings {
  trimSize: TrimSize;
  bleed: boolean;
  paperColor: "white" | "cream";
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
}

export interface Margins {
  top: number;
  bottom: number;
  inside: number;  // gutter side
  outside: number;
}

export type HeadingAlignment = "left" | "center" | "right";

export interface ChapterStyle {
  headingAlignment: HeadingAlignment;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  htmlContent?: string; // Rich text HTML content (optional)
  style?: ChapterStyle; // Chapter-specific styling
}

export interface BookProject {
  id: string;
  title: string;
  authorName: string;
  rawText: string;
  chapters: Chapter[];
  settings: KDPSettings;
  frontMatter: FrontMatter;
  backMatter: BackMatter;
  updatedAt: number;
}

export type SectionKind =
  | "title-page"
  | "copyright-page"
  | "dedication"
  | "chapter"
  | "about-author"
  | "also-by"
  | "acknowledgments"
  | "blank-page";

export type ChapterStartSide = "any" | "left" | "right";

export interface MatterSection {
  kind: SectionKind;
  enabled: boolean;
  content: string;
}

export interface FrontMatter {
  titlePage: MatterSection;
  copyrightPage: MatterSection;
  dedication: MatterSection;
}

export interface BackMatter {
  aboutAuthor: MatterSection;
  alsoBy: MatterSection;
  acknowledgments: MatterSection;
}

export interface RenderableSection {
  id: string;
  kind: SectionKind;
  title: string;
  content: string;
  htmlContent?: string; // Rich text HTML content
  style?: ChapterStyle; // Section-specific styling
  showPageNumber: boolean;
}

export interface ValidationIssue {
  type: "error" | "warning";
  category: "margins" | "page-count" | "bleed" | "content" | "trim";
  message: string;
}
