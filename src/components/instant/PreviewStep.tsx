"use client";

import { useMemo, useState, useCallback } from "react";
import {
  RenderableSection,
  KDPSettings,
  Margins,
  SectionKind,
  HeadingAlignment,
  FrontMatter,
  BackMatter,
  MatterSection,
  ChapterStartSide,
} from "@/lib/types";
import { generatePDF } from "@/lib/pdf-generator";

interface PreviewStepProps {
  sections: RenderableSection[];
  settings: KDPSettings;
  margins: Margins;
  bookTitle: string;
  authorName: string;
  pageCount: number;
  frontMatter: FrontMatter;
  backMatter: BackMatter;
  onSettingsChange: (settings: Partial<KDPSettings>) => void;
  onFrontMatterChange: (updates: Partial<FrontMatter>) => void;
  onBackMatterChange: (updates: Partial<BackMatter>) => void;
  onBack: () => void;
  onAdvancedEdit?: () => void;
}

interface RenderedPage {
  lines: { text: string; isTitle: boolean; lineIndex: number }[];
  pageNumber: number;
  sectionId: string;
  sectionKind: SectionKind;
  showPageNumber: boolean;
  htmlContent?: string;
  headingAlignment?: HeadingAlignment;
  title?: string;
  isBlankPage?: boolean;
}

const PREVIEW_PPI = 96;

// Available page types to add
const ADDABLE_PAGES = [
  { key: "dedication", label: "Dedication", location: "front", description: "A short dedication message" },
  { key: "aboutAuthor", label: "About the Author", location: "back", description: "Author biography" },
  { key: "alsoBy", label: "Also By", location: "back", description: "List of other books" },
  { key: "acknowledgments", label: "Acknowledgments", location: "back", description: "Thank you notes" },
];

function renderPages(
  sections: RenderableSection[],
  settings: KDPSettings,
  margins: Margins,
  chapterStartSide: ChapterStartSide = "any",
  blankPagePositions: Set<string> = new Set()
): RenderedPage[] {
  const { trimSize, fontSize, lineHeight: lhMultiplier } = settings;
  const textWidthIn = trimSize.width - margins.inside - margins.outside;
  const textHeightIn = trimSize.height - margins.top - margins.bottom;
  const textWidthPt = textWidthIn * 72;
  const textHeightPt = textHeightIn * 72;
  const lineHeightPt = fontSize * lhMultiplier;
  const linesPerPage = Math.floor(textHeightPt / lineHeightPt);
  const avgCharWidth = fontSize * 0.48;
  const charsPerLine = Math.floor(textWidthPt / avgCharWidth);

  if (charsPerLine <= 0 || linesPerPage <= 0) return [];

  const pages: RenderedPage[] = [];
  let pageNum = 0;

  for (const section of sections) {
    const { kind } = section;

    if (kind === "title-page") {
      pageNum++;
      const lines: RenderedPage["lines"] = [];
      const padLines = Math.floor(linesPerPage / 3);
      for (let i = 0; i < padLines; i++) {
        lines.push({ text: "", isTitle: false, lineIndex: i });
      }
      lines.push({ text: section.title, isTitle: true, lineIndex: padLines });
      lines.push({ text: "", isTitle: false, lineIndex: padLines + 1 });
      if (section.content) {
        lines.push({ text: section.content, isTitle: false, lineIndex: padLines + 2 });
      }
      pages.push({ lines, pageNumber: pageNum, sectionId: section.id, sectionKind: kind, showPageNumber: false });
      continue;
    }

    if (kind === "copyright-page") {
      pageNum++;
      const lines: RenderedPage["lines"] = [];
      const padLines = Math.floor(linesPerPage / 2);
      for (let i = 0; i < padLines; i++) {
        lines.push({ text: "", isTitle: false, lineIndex: i });
      }
      const paragraphs = section.content.split("\n");
      let lineIdx = padLines;
      for (const para of paragraphs) {
        if (para.trim() === "") {
          lines.push({ text: "", isTitle: false, lineIndex: lineIdx++ });
        } else {
          const words = para.split(/\s+/);
          let currentLine = "";
          for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (testLine.length > charsPerLine && currentLine) {
              lines.push({ text: currentLine, isTitle: false, lineIndex: lineIdx++ });
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) {
            lines.push({ text: currentLine, isTitle: false, lineIndex: lineIdx++ });
          }
        }
      }
      pages.push({ lines, pageNumber: pageNum, sectionId: section.id, sectionKind: kind, showPageNumber: false });
      continue;
    }

    if (kind === "dedication") {
      pageNum++;
      const lines: RenderedPage["lines"] = [];
      const contentLines = section.content.split("\n");
      const padLines = Math.floor((linesPerPage - contentLines.length) / 2);
      for (let i = 0; i < Math.max(padLines, 0); i++) {
        lines.push({ text: "", isTitle: false, lineIndex: i });
      }
      contentLines.forEach((cl, i) => {
        lines.push({ text: cl, isTitle: false, lineIndex: padLines + i });
      });
      pages.push({ lines, pageNumber: pageNum, sectionId: section.id, sectionKind: kind, showPageNumber: false });
      continue;
    }

    // Chapters and back matter

    // Check if we need to add a blank page before this section
    const needsBlankPageBefore = blankPagePositions.has(`before-${section.id}`);

    // Check chapter start side requirement (only for chapters)
    let needsBlankForStartSide = false;
    if (kind === "chapter" && chapterStartSide !== "any") {
      const nextPageNum = pageNum + 1;
      const isNextPageRecto = nextPageNum % 2 === 1; // Odd pages are right (recto)
      const isNextPageVerso = !isNextPageRecto; // Even pages are left (verso)

      if (chapterStartSide === "right" && !isNextPageRecto) {
        needsBlankForStartSide = true;
      } else if (chapterStartSide === "left" && !isNextPageVerso) {
        needsBlankForStartSide = true;
      }
    }

    // Insert blank page if needed
    if (needsBlankPageBefore || needsBlankForStartSide) {
      pageNum++;
      pages.push({
        lines: [],
        pageNumber: pageNum,
        sectionId: `blank-before-${section.id}`,
        sectionKind: "blank-page",
        showPageNumber: false,
        isBlankPage: true,
      });
    }

    pageNum++;
    let currentPageLines: RenderedPage["lines"] = [];
    let globalLineIdx = 0;

    currentPageLines.push({ text: "", isTitle: false, lineIndex: globalLineIdx++ });
    currentPageLines.push({ text: section.title, isTitle: true, lineIndex: globalLineIdx++ });
    currentPageLines.push({ text: "", isTitle: false, lineIndex: globalLineIdx++ });

    const paragraphs = section.content.split("\n");

    for (const para of paragraphs) {
      if (para.trim() === "") {
        if (currentPageLines.length >= linesPerPage) {
          pages.push({
            lines: currentPageLines,
            pageNumber: pageNum,
            sectionId: section.id,
            sectionKind: kind,
            showPageNumber: section.showPageNumber,
            htmlContent: section.htmlContent,
            headingAlignment: section.style?.headingAlignment,
            title: section.title,
          });
          pageNum++;
          currentPageLines = [];
        }
        currentPageLines.push({ text: "", isTitle: false, lineIndex: globalLineIdx++ });
        continue;
      }

      const words = para.split(/\s+/);
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (testLine.length > charsPerLine && currentLine) {
          if (currentPageLines.length >= linesPerPage) {
            pages.push({
              lines: currentPageLines,
              pageNumber: pageNum,
              sectionId: section.id,
              sectionKind: kind,
              showPageNumber: section.showPageNumber,
              htmlContent: section.htmlContent,
              headingAlignment: section.style?.headingAlignment,
              title: section.title,
            });
            pageNum++;
            currentPageLines = [];
          }
          currentPageLines.push({ text: currentLine, isTitle: false, lineIndex: globalLineIdx++ });
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        if (currentPageLines.length >= linesPerPage) {
          pages.push({
            lines: currentPageLines,
            pageNumber: pageNum,
            sectionId: section.id,
            sectionKind: kind,
            showPageNumber: section.showPageNumber,
            htmlContent: section.htmlContent,
            headingAlignment: section.style?.headingAlignment,
            title: section.title,
          });
          pageNum++;
          currentPageLines = [];
        }
        currentPageLines.push({ text: currentLine, isTitle: false, lineIndex: globalLineIdx++ });
      }
    }

    if (currentPageLines.length > 0) {
      pages.push({
        lines: currentPageLines,
        pageNumber: pageNum,
        sectionId: section.id,
        sectionKind: kind,
        showPageNumber: section.showPageNumber,
        htmlContent: section.htmlContent,
        headingAlignment: section.style?.headingAlignment,
        title: section.title,
      });
    }
  }

  return pages;
}

// Add Pages Modal Component
function AddPagesModal({
  isOpen,
  onClose,
  frontMatter,
  backMatter,
  authorName,
  chapters,
  chapterStartSide,
  blankPagePositions,
  onFrontMatterChange,
  onBackMatterChange,
  onChapterStartSideChange,
  onBlankPageToggle,
}: {
  isOpen: boolean;
  onClose: () => void;
  frontMatter: FrontMatter;
  backMatter: BackMatter;
  authorName: string;
  chapters: { id: string; title: string }[];
  chapterStartSide: ChapterStartSide;
  blankPagePositions: Set<string>;
  onFrontMatterChange: (updates: Partial<FrontMatter>) => void;
  onBackMatterChange: (updates: Partial<BackMatter>) => void;
  onChapterStartSideChange: (side: ChapterStartSide) => void;
  onBlankPageToggle: (position: string) => void;
}) {
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [activeTab, setActiveTab] = useState<"pages" | "layout">("pages");

  if (!isOpen) return null;

  const getPageEnabled = (key: string): boolean => {
    if (key === "dedication") return frontMatter.dedication.enabled;
    if (key === "aboutAuthor") return backMatter.aboutAuthor.enabled;
    if (key === "alsoBy") return backMatter.alsoBy.enabled;
    if (key === "acknowledgments") return backMatter.acknowledgments.enabled;
    return false;
  };

  const getPageContent = (key: string): string => {
    if (key === "dedication") return frontMatter.dedication.content;
    if (key === "aboutAuthor") return backMatter.aboutAuthor.content;
    if (key === "alsoBy") return backMatter.alsoBy.content;
    if (key === "acknowledgments") return backMatter.acknowledgments.content;
    return "";
  };

  const togglePage = (key: string, enabled: boolean) => {
    if (key === "dedication") {
      onFrontMatterChange({
        dedication: { ...frontMatter.dedication, enabled },
      });
    } else if (key === "aboutAuthor") {
      onBackMatterChange({
        aboutAuthor: { ...backMatter.aboutAuthor, enabled },
      });
    } else if (key === "alsoBy") {
      onBackMatterChange({
        alsoBy: { ...backMatter.alsoBy, enabled },
      });
    } else if (key === "acknowledgments") {
      onBackMatterChange({
        acknowledgments: { ...backMatter.acknowledgments, enabled },
      });
    }
  };

  const startEditing = (key: string) => {
    setEditContent(getPageContent(key));
    setEditingPage(key);
  };

  const saveContent = () => {
    if (!editingPage) return;

    if (editingPage === "dedication") {
      onFrontMatterChange({
        dedication: { ...frontMatter.dedication, content: editContent },
      });
    } else if (editingPage === "aboutAuthor") {
      onBackMatterChange({
        aboutAuthor: { ...backMatter.aboutAuthor, content: editContent },
      });
    } else if (editingPage === "alsoBy") {
      onBackMatterChange({
        alsoBy: { ...backMatter.alsoBy, content: editContent },
      });
    } else if (editingPage === "acknowledgments") {
      onBackMatterChange({
        acknowledgments: { ...backMatter.acknowledgments, content: editContent },
      });
    }
    setEditingPage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-100">Pages & Layout</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab("pages")}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === "pages"
                ? "text-amber-500 border-b-2 border-amber-500"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Add Pages
          </button>
          <button
            onClick={() => setActiveTab("layout")}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === "layout"
                ? "text-amber-500 border-b-2 border-amber-500"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Layout & Blank Pages
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[55vh]">
          {activeTab === "pages" && (
            <>
              {editingPage ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-200">
                      Edit {ADDABLE_PAGES.find((p) => p.key === editingPage)?.label}
                    </h4>
                    <button
                      onClick={() => setEditingPage(null)}
                      className="text-sm text-gray-400 hover:text-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-48 rounded-lg border border-gray-600 bg-gray-900 px-4 py-3 text-gray-100 placeholder-gray-500 focus:border-amber-500 focus:outline-none resize-none"
                    placeholder="Enter content..."
                  />
                  <button
                    onClick={saveContent}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg"
                  >
                    Save Content
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-400 mb-4">
                    Toggle pages on/off and edit their content.
                  </p>

                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Front Matter
                  </div>
                  {ADDABLE_PAGES.filter((p) => p.location === "front").map((page) => (
                    <div
                      key={page.key}
                      className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-200">{page.label}</div>
                        <div className="text-xs text-gray-500">{page.description}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getPageEnabled(page.key) && (
                          <button
                            onClick={() => startEditing(page.key)}
                            className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-gray-300 rounded"
                          >
                            Edit
                          </button>
                        )}
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getPageEnabled(page.key)}
                            onChange={(e) => togglePage(page.key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                        </label>
                      </div>
                    </div>
                  ))}

                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4">
                    Back Matter
                  </div>
                  {ADDABLE_PAGES.filter((p) => p.location === "back").map((page) => (
                    <div
                      key={page.key}
                      className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-200">{page.label}</div>
                        <div className="text-xs text-gray-500">{page.description}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getPageEnabled(page.key) && (
                          <button
                            onClick={() => startEditing(page.key)}
                            className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-gray-300 rounded"
                          >
                            Edit
                          </button>
                        )}
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getPageEnabled(page.key)}
                            onChange={(e) => togglePage(page.key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "layout" && (
            <div className="space-y-4">
              {/* Chapter Start Side */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="font-medium text-gray-200 mb-2">Chapter Start Side</h4>
                <p className="text-xs text-gray-500 mb-3">
                  Automatically add blank pages so chapters start on a specific side.
                </p>
                <div className="flex gap-2">
                  {[
                    { value: "any" as ChapterStartSide, label: "Any Side" },
                    { value: "right" as ChapterStartSide, label: "Right (Recto)" },
                    { value: "left" as ChapterStartSide, label: "Left (Verso)" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onChapterStartSideChange(option.value)}
                      className={`flex-1 py-2 px-3 rounded text-sm font-medium transition ${
                        chapterStartSide === option.value
                          ? "bg-amber-600 text-white"
                          : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Blank Pages */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="font-medium text-gray-200 mb-2">Add Blank Pages</h4>
                <p className="text-xs text-gray-500 mb-3">
                  Add a blank page before specific chapters.
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {chapters.map((chapter, index) => (
                    <div
                      key={chapter.id}
                      className="flex items-center justify-between p-2 bg-gray-800/50 rounded"
                    >
                      <span className="text-sm text-gray-300 truncate flex-1 mr-2">
                        <span className="text-gray-500">{index + 1}.</span> {chapter.title}
                      </span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xs text-gray-500">Blank before</span>
                        <input
                          type="checkbox"
                          checked={blankPagePositions.has(`before-${chapter.id}`)}
                          onChange={() => onBlankPageToggle(`before-${chapter.id}`)}
                          className="w-4 h-4 accent-amber-500"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium rounded-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PreviewStep({
  sections,
  settings,
  margins,
  bookTitle,
  authorName,
  pageCount,
  frontMatter,
  backMatter,
  onSettingsChange,
  onFrontMatterChange,
  onBackMatterChange,
  onBack,
  onAdvancedEdit,
}: PreviewStepProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showAddPagesModal, setShowAddPagesModal] = useState(false);
  const [bookViewMode, setBookViewMode] = useState(false);
  const [chapterStartSide, setChapterStartSide] = useState<ChapterStartSide>("any");
  const [blankPagePositions, setBlankPagePositions] = useState<Set<string>>(new Set());

  // Extract chapter info for the modal
  const chapterList = useMemo(() =>
    sections
      .filter((s) => s.kind === "chapter")
      .map((s) => ({ id: s.id, title: s.title })),
    [sections]
  );

  // Toggle blank page position
  const handleBlankPageToggle = useCallback((position: string) => {
    setBlankPagePositions((prev) => {
      const next = new Set(prev);
      if (next.has(position)) {
        next.delete(position);
      } else {
        next.add(position);
      }
      return next;
    });
  }, []);

  const pages = useMemo(
    () => renderPages(sections, settings, margins, chapterStartSide, blankPagePositions),
    [sections, settings, margins, chapterStartSide, blankPagePositions]
  );

  const displayPage = pages[currentPage] ?? pages[0] ?? null;

  const pageW = settings.trimSize.width * PREVIEW_PPI;
  const pageH = settings.trimSize.height * PREVIEW_PPI;
  const bgColor = settings.paperColor === "cream" ? "#f5f0e6" : "#ffffff";
  const fontFamily =
    settings.fontFamily === "serif"
      ? "Georgia, 'Times New Roman', serif"
      : settings.fontFamily === "sans-serif"
      ? "'Helvetica Neue', Arial, sans-serif"
      : "'Courier New', Courier, monospace";
  const previewFontSize = settings.fontSize * (PREVIEW_PPI / 72);
  const previewLineHeight = previewFontSize * settings.lineHeight;
  const isRecto = displayPage ? displayPage.pageNumber % 2 === 1 : true;
  const marginLeft = isRecto ? margins.inside * PREVIEW_PPI : margins.outside * PREVIEW_PPI;
  const marginRight = isRecto ? margins.outside * PREVIEW_PPI : margins.inside * PREVIEW_PPI;

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const blob = await generatePDF({
        sections,
        settings,
        margins,
        bookTitle,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${bookTitle || "book"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }, [sections, settings, margins, bookTitle]);

  const renderPageContent = (page: RenderedPage, pageWidth: number, pageHeight: number, mLeft: number, mRight: number) => {
    const { sectionKind } = page;
    const scale = pageWidth / pageW;
    const scaledFontSize = previewFontSize * scale;
    const scaledLineHeight = previewLineHeight * scale;

    // Handle blank pages
    if (sectionKind === "blank-page" || page.isBlankPage) {
      return (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span className="text-gray-400 text-xs italic opacity-50">
            Intentionally blank
          </span>
        </div>
      );
    }

    if (sectionKind === "title-page") {
      return (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: mLeft,
            right: mRight,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily,
            color: "#1a1a1a",
          }}
        >
          <div
            style={{
              fontSize: scaledFontSize * 2,
              fontWeight: "bold",
              textAlign: "center",
              lineHeight: 1.3,
              marginBottom: scaledLineHeight,
            }}
          >
            {page.lines.find((l) => l.isTitle)?.text || ""}
          </div>
          <div style={{ fontSize: scaledFontSize * 1.1, textAlign: "center" }}>
            {page.lines.find((l) => !l.isTitle && l.text !== "")?.text || ""}
          </div>
        </div>
      );
    }

    if (sectionKind === "copyright-page") {
      return (
        <div
          style={{
            position: "absolute",
            left: mLeft,
            right: mRight,
            bottom: margins.bottom * PREVIEW_PPI * scale,
            fontFamily,
            fontSize: scaledFontSize * 0.7,
            lineHeight: `${scaledLineHeight * 0.8}px`,
            color: "#444",
          }}
        >
          {page.lines
            .filter((l) => l.text !== "" || page.lines.indexOf(l) > page.lines.length / 2)
            .map((line, i) =>
              line.text === "" ? (
                <div key={i} style={{ height: scaledLineHeight * 0.3 }} />
              ) : (
                <div key={i}>{line.text}</div>
              )
            )}
        </div>
      );
    }

    if (sectionKind === "dedication") {
      return (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: mLeft,
            right: mRight,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily,
            fontSize: scaledFontSize,
            fontStyle: "italic",
            color: "#1a1a1a",
            textAlign: "center",
          }}
        >
          <div>
            {page.lines
              .filter((l) => l.text !== "")
              .map((line, i) => (
                <div key={i} style={{ lineHeight: `${scaledLineHeight * 1.5}px` }}>
                  {line.text}
                </div>
              ))}
          </div>
        </div>
      );
    }

    const headingAlign = page.headingAlignment || "left";

    // If we have HTML content, render it with formatting
    if (page.htmlContent && page.pageNumber === pages.find(p => p.sectionId === page.sectionId)?.pageNumber) {
      return (
        <div
          style={{
            position: "absolute",
            top: margins.top * PREVIEW_PPI * scale,
            left: mLeft,
            right: mRight,
            bottom: margins.bottom * PREVIEW_PPI * scale,
            fontFamily,
            fontSize: scaledFontSize,
            lineHeight: `${scaledLineHeight}px`,
            color: "#1a1a1a",
            overflow: "hidden",
          }}
        >
          <div style={{ height: scaledLineHeight * 0.5 }} />
          <div
            style={{
              fontSize: scaledFontSize * 1.4,
              fontWeight: "bold",
              lineHeight: `${scaledLineHeight * 1.5}px`,
              textAlign: headingAlign,
            }}
          >
            {page.title}
          </div>
          <div style={{ height: scaledLineHeight * 0.5 }} />
          <div
            dangerouslySetInnerHTML={{ __html: page.htmlContent }}
            style={{ lineHeight: `${scaledLineHeight}px` }}
            className="[&_p]:mb-2 [&_strong]:font-bold [&_em]:italic [&_u]:underline"
          />
        </div>
      );
    }

    // Fallback to plain text rendering
    return (
      <div
        style={{
          position: "absolute",
          top: margins.top * PREVIEW_PPI * scale,
          left: mLeft,
          right: mRight,
          bottom: margins.bottom * PREVIEW_PPI * scale,
          fontFamily,
          fontSize: scaledFontSize,
          lineHeight: `${scaledLineHeight}px`,
          color: "#1a1a1a",
          overflow: "hidden",
        }}
      >
        {page.lines.map((line, i) => {
          if (line.isTitle) {
            return (
              <div
                key={i}
                style={{
                  fontSize: scaledFontSize * 1.4,
                  fontWeight: "bold",
                  lineHeight: `${scaledLineHeight * 1.5}px`,
                  textAlign: headingAlign,
                }}
              >
                {line.text}
              </div>
            );
          }
          if (line.text === "") {
            return <div key={i} style={{ height: scaledLineHeight * 0.5 }} />;
          }
          return (
            <div key={i} style={{ lineHeight: `${scaledLineHeight}px` }}>
              {line.text}
            </div>
          );
        })}
      </div>
    );
  };

  // Book view: get left and right pages
  const getBookSpreadPages = () => {
    if (currentPage === 0) {
      // First page is always on the right (recto)
      return { left: null, right: pages[0] || null };
    }
    // After first page: odd index on left, even index on right
    const leftPageIndex = currentPage;
    const rightPageIndex = currentPage + 1;
    return {
      left: pages[leftPageIndex] || null,
      right: pages[rightPageIndex] || null,
    };
  };

  const bookSpread = bookViewMode ? getBookSpreadPages() : null;

  const handlePrevPage = () => {
    if (bookViewMode) {
      if (currentPage === 0) return;
      setCurrentPage(Math.max(0, currentPage - 2));
    } else {
      setCurrentPage(Math.max(0, currentPage - 1));
    }
  };

  const handleNextPage = () => {
    if (bookViewMode) {
      if (currentPage === 0) {
        setCurrentPage(1);
      } else {
        setCurrentPage(Math.min(pages.length - 1, currentPage + 2));
      }
    } else {
      setCurrentPage(Math.min(pages.length - 1, currentPage + 1));
    }
  };

  // Scale for book view
  const bookPageW = pageW * 0.65;
  const bookPageH = pageH * 0.65;
  const bookScale = 0.65;
  const bookMarginLeft = (isRecto: boolean) =>
    (isRecto ? margins.inside : margins.outside) * PREVIEW_PPI * bookScale;
  const bookMarginRight = (isRecto: boolean) =>
    (isRecto ? margins.outside : margins.inside) * PREVIEW_PPI * bookScale;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Add Pages Modal */}
      <AddPagesModal
        isOpen={showAddPagesModal}
        onClose={() => setShowAddPagesModal(false)}
        frontMatter={frontMatter}
        backMatter={backMatter}
        authorName={authorName}
        chapters={chapterList}
        chapterStartSide={chapterStartSide}
        blankPagePositions={blankPagePositions}
        onFrontMatterChange={onFrontMatterChange}
        onBackMatterChange={onBackMatterChange}
        onChapterStartSideChange={setChapterStartSide}
        onBlankPageToggle={handleBlankPageToggle}
      />

      {/* Preview Area */}
      <div className="flex-1 flex flex-col items-center">
        <div className="flex items-center justify-between w-full max-w-2xl mb-4">
          <h2 className="text-lg font-bold text-gray-100">Preview</h2>
          <div className="flex items-center gap-2">
            {/* Book view toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs text-gray-400">Book View</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={bookViewMode}
                  onChange={(e) => {
                    setBookViewMode(e.target.checked);
                    setCurrentPage(0);
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </div>
            </label>
            <button
              onClick={() => setShowEditPanel(!showEditPanel)}
              className="lg:hidden px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300"
            >
              {showEditPanel ? "Hide" : "Edit"} Settings
            </button>
          </div>
        </div>

        {/* Page container */}
        {bookViewMode ? (
          // Book spread view
          <div className="flex gap-1 items-center justify-center">
            {/* Left page (verso) */}
            <div
              className="relative shadow-xl border border-gray-600"
              style={{
                width: bookPageW,
                height: bookPageH,
                backgroundColor: bookSpread?.left ? bgColor : "#1a1a1a",
                overflow: "hidden",
              }}
            >
              {bookSpread?.left ? (
                <>
                  {renderPageContent(
                    bookSpread.left,
                    bookPageW,
                    bookPageH,
                    bookMarginLeft(false),
                    bookMarginRight(false)
                  )}
                  {bookSpread.left.showPageNumber && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: (margins.bottom * PREVIEW_PPI * bookScale) / 3,
                        left: 0,
                        right: 0,
                        textAlign: "center",
                        fontSize: previewFontSize * 0.75 * bookScale,
                        color: "#666",
                        fontFamily,
                      }}
                    >
                      {bookSpread.left.pageNumber}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-600 text-sm">
                  {currentPage === 0 ? "Cover" : ""}
                </div>
              )}
            </div>

            {/* Spine */}
            <div
              className="h-full bg-gray-700"
              style={{ width: 4, height: bookPageH }}
            />

            {/* Right page (recto) */}
            <div
              className="relative shadow-xl border border-gray-600"
              style={{
                width: bookPageW,
                height: bookPageH,
                backgroundColor: bookSpread?.right ? bgColor : "#1a1a1a",
                overflow: "hidden",
              }}
            >
              {bookSpread?.right ? (
                <>
                  {renderPageContent(
                    bookSpread.right,
                    bookPageW,
                    bookPageH,
                    bookMarginLeft(true),
                    bookMarginRight(true)
                  )}
                  {bookSpread.right.showPageNumber && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: (margins.bottom * PREVIEW_PPI * bookScale) / 3,
                        left: 0,
                        right: 0,
                        textAlign: "center",
                        fontSize: previewFontSize * 0.75 * bookScale,
                        color: "#666",
                        fontFamily,
                      }}
                    >
                      {bookSpread.right.pageNumber}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-600 text-sm">
                  End
                </div>
              )}
            </div>
          </div>
        ) : (
          // Single page view
          <div
            className="relative shadow-2xl border border-gray-600"
            style={{
              width: pageW,
              height: pageH,
              backgroundColor: bgColor,
              overflow: "hidden",
            }}
          >
            {displayPage ? (
              renderPageContent(displayPage, pageW, pageH, marginLeft, marginRight)
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                No content to preview
              </div>
            )}

            {displayPage && displayPage.showPageNumber && (
              <div
                style={{
                  position: "absolute",
                  bottom: (margins.bottom * PREVIEW_PPI) / 3,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  fontSize: previewFontSize * 0.75,
                  color: "#666",
                  fontFamily,
                }}
              >
                {displayPage.pageNumber}
              </div>
            )}

            {/* Gutter indicator */}
            <div
              className="absolute top-0 bottom-0 opacity-20"
              style={{
                [isRecto ? "left" : "right"]: 0,
                width: margins.inside * PREVIEW_PPI,
                background:
                  "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(168,85,247,0.15) 2px, rgba(168,85,247,0.15) 4px)",
              }}
              title="Gutter / spine area"
            />
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 0}
            className="rounded px-3 py-1.5 text-sm font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Previous
          </button>
          <span className="text-sm text-gray-400">
            {bookViewMode ? (
              currentPage === 0
                ? "Page 1"
                : `Pages ${currentPage + 1}-${Math.min(currentPage + 2, pages.length)}`
            ) : (
              `Page ${currentPage + 1} of ${pages.length || pageCount || 1}`
            )}
          </span>
          <button
            onClick={handleNextPage}
            disabled={bookViewMode ? currentPage >= pages.length - 2 : currentPage >= pages.length - 1}
            className="rounded px-3 py-1.5 text-sm font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Next
          </button>
        </div>
      </div>

      {/* Edit Panel */}
      <div
        className={`w-full lg:w-80 bg-gray-800/50 rounded-xl p-5 ${
          showEditPanel ? "block" : "hidden lg:block"
        }`}
      >
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Quick Adjustments</h3>

        <div className="space-y-5">
          {/* Font Size */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">
              Font Size: {settings.fontSize}pt
            </label>
            <input
              type="range"
              min="9"
              max="14"
              step="0.5"
              value={settings.fontSize}
              onChange={(e) => onSettingsChange({ fontSize: parseFloat(e.target.value) })}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Line Spacing */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">
              Line Spacing: {settings.lineHeight.toFixed(1)}
            </label>
            <input
              type="range"
              min="1.2"
              max="2"
              step="0.1"
              value={settings.lineHeight}
              onChange={(e) => onSettingsChange({ lineHeight: parseFloat(e.target.value) })}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Font Style */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Font Style</label>
            <div className="flex gap-2">
              {["serif", "sans-serif", "monospace"].map((font) => (
                <button
                  key={font}
                  onClick={() => onSettingsChange({ fontFamily: font })}
                  className={`flex-1 py-1.5 rounded text-xs font-medium transition ${
                    settings.fontFamily === font
                      ? "bg-amber-600 text-white"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  }`}
                  style={{
                    fontFamily:
                      font === "serif"
                        ? "Georgia, serif"
                        : font === "sans-serif"
                        ? "Arial, sans-serif"
                        : "monospace",
                  }}
                >
                  {font === "serif" ? "Serif" : font === "sans-serif" ? "Sans" : "Mono"}
                </button>
              ))}
            </div>
          </div>

          {/* Paper Color */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Paper Color</label>
            <div className="flex gap-2">
              <button
                onClick={() => onSettingsChange({ paperColor: "cream" })}
                className={`flex-1 py-1.5 rounded text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                  settings.paperColor === "cream"
                    ? "bg-amber-600 text-white"
                    : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                }`}
              >
                <span className="w-3 h-3 rounded" style={{ backgroundColor: "#f5f0e6" }} />
                Cream
              </button>
              <button
                onClick={() => onSettingsChange({ paperColor: "white" })}
                className={`flex-1 py-1.5 rounded text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                  settings.paperColor === "white"
                    ? "bg-amber-600 text-white"
                    : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                }`}
              >
                <span className="w-3 h-3 rounded border border-gray-500" style={{ backgroundColor: "#fff" }} />
                White
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="pt-2 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              Current section: <span className="text-gray-300">{displayPage?.sectionKind || "—"}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Total pages: <span className="text-gray-300">{pages.length}</span>
            </p>
          </div>

          {/* Advanced Edit Button */}
          {onAdvancedEdit && (
            <div className="pt-4 border-t border-gray-700">
              <button
                onClick={onAdvancedEdit}
                className="w-full px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium rounded-lg transition flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                  />
                </svg>
                Advanced Edit
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Edit text, add formatting, and more
              </p>
            </div>
          )}

          {/* Add More Pages Button */}
          <div className="pt-2">
            <button
              onClick={() => setShowAddPagesModal(true)}
              className="w-full px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium rounded-lg transition flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Add More Pages
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Dedication, About Author, etc.
            </p>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 border-t border-gray-700 p-4 flex justify-between items-center z-40">
        <button
          onClick={onBack}
          className="px-5 py-2 text-gray-400 hover:text-gray-200 font-medium transition"
        >
          Back to Settings
        </button>
        <button
          onClick={handleDownload}
          disabled={downloading || pages.length === 0}
          className="px-8 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {downloading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              Download PDF
            </>
          )}
        </button>
      </div>
    </div>
  );
}
