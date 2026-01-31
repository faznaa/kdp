"use client";

import { useMemo } from "react";
import { RenderableSection, KDPSettings, Margins, SectionKind } from "@/lib/types";

interface PrintPreviewProps {
  sections: RenderableSection[];
  settings: KDPSettings;
  margins: Margins;
  selectedChapterId: string | null;
  currentPage: number;
  onPageChange: (page: number) => void;
  totalPages: number;
}

// Scale factor to fit preview on screen (pixels per inch)
const PREVIEW_PPI = 96;

interface RenderedPage {
  lines: { text: string; isTitle: boolean; isContinuation: boolean }[];
  pageNumber: number;
  sectionId: string;
  sectionKind: SectionKind;
  showPageNumber: boolean;
}

function renderPages(
  sections: RenderableSection[],
  settings: KDPSettings,
  margins: Margins
): RenderedPage[] {
  const { trimSize, fontSize, lineHeight: lhMultiplier } = settings;

  // Calculate usable area
  const textWidthIn = trimSize.width - margins.inside - margins.outside;
  const textHeightIn = trimSize.height - margins.top - margins.bottom;

  const textWidthPt = textWidthIn * 72;
  const textHeightPt = textHeightIn * 72;

  const lineHeightPt = fontSize * lhMultiplier;
  const linesPerPage = Math.floor(textHeightPt / lineHeightPt);

  // Approximate chars per line
  const avgCharWidth = fontSize * 0.48;
  const charsPerLine = Math.floor(textWidthPt / avgCharWidth);

  if (charsPerLine <= 0 || linesPerPage <= 0) return [];

  const pages: RenderedPage[] = [];
  let pageNum = 0;

  for (const section of sections) {
    const { kind } = section;

    // Special rendering for title page
    if (kind === "title-page") {
      pageNum++;
      const lines: RenderedPage["lines"] = [];
      // Pad vertically to roughly center the title
      const padLines = Math.floor(linesPerPage / 3);
      for (let i = 0; i < padLines; i++) {
        lines.push({ text: "", isTitle: false, isContinuation: false });
      }
      lines.push({ text: section.title, isTitle: true, isContinuation: false });
      lines.push({ text: "", isTitle: false, isContinuation: false });
      // Author in content field
      if (section.content) {
        lines.push({ text: section.content, isTitle: false, isContinuation: false });
      }
      pages.push({
        lines,
        pageNumber: pageNum,
        sectionId: section.id,
        sectionKind: kind,
        showPageNumber: false,
      });
      continue;
    }

    // Special rendering for copyright page
    if (kind === "copyright-page") {
      pageNum++;
      const lines: RenderedPage["lines"] = [];
      // Push text to bottom half of page
      const padLines = Math.floor(linesPerPage / 2);
      for (let i = 0; i < padLines; i++) {
        lines.push({ text: "", isTitle: false, isContinuation: false });
      }
      const paragraphs = section.content.split("\n");
      for (const para of paragraphs) {
        if (para.trim() === "") {
          lines.push({ text: "", isTitle: false, isContinuation: false });
        } else {
          // Word wrap
          const words = para.split(/\s+/);
          let currentLine = "";
          for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (testLine.length > charsPerLine && currentLine) {
              lines.push({ text: currentLine, isTitle: false, isContinuation: false });
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) {
            lines.push({ text: currentLine, isTitle: false, isContinuation: false });
          }
        }
      }
      pages.push({
        lines,
        pageNumber: pageNum,
        sectionId: section.id,
        sectionKind: kind,
        showPageNumber: false,
      });
      continue;
    }

    // Special rendering for dedication
    if (kind === "dedication") {
      pageNum++;
      const lines: RenderedPage["lines"] = [];
      // Center vertically
      const contentLines = section.content.split("\n");
      const padLines = Math.floor((linesPerPage - contentLines.length) / 2);
      for (let i = 0; i < Math.max(padLines, 0); i++) {
        lines.push({ text: "", isTitle: false, isContinuation: false });
      }
      for (const cl of contentLines) {
        lines.push({ text: cl, isTitle: false, isContinuation: false });
      }
      pages.push({
        lines,
        pageNumber: pageNum,
        sectionId: section.id,
        sectionKind: kind,
        showPageNumber: false,
      });
      continue;
    }

    // Chapters and back matter kinds: existing rendering logic
    pageNum++;
    let currentPageLines: RenderedPage["lines"] = [];

    // Section title
    currentPageLines.push({ text: "", isTitle: false, isContinuation: false });
    currentPageLines.push({ text: section.title, isTitle: true, isContinuation: false });
    currentPageLines.push({ text: "", isTitle: false, isContinuation: false });

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
          });
          pageNum++;
          currentPageLines = [];
        }
        currentPageLines.push({ text: "", isTitle: false, isContinuation: false });
        continue;
      }

      // Word wrap
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
            });
            pageNum++;
            currentPageLines = [];
          }
          currentPageLines.push({ text: currentLine, isTitle: false, isContinuation: false });
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
          });
          pageNum++;
          currentPageLines = [];
        }
        currentPageLines.push({ text: currentLine, isTitle: false, isContinuation: false });
      }
    }

    if (currentPageLines.length > 0) {
      pages.push({
        lines: currentPageLines,
        pageNumber: pageNum,
        sectionId: section.id,
        sectionKind: kind,
        showPageNumber: section.showPageNumber,
      });
    }
  }

  return pages;
}

export default function PrintPreview({
  sections,
  settings,
  margins,
  selectedChapterId,
  currentPage,
  onPageChange,
  totalPages,
}: PrintPreviewProps) {
  const pages = useMemo(
    () => renderPages(sections, settings, margins),
    [sections, settings, margins]
  );

  // Find pages for selected chapter, or show all
  const filteredPages = selectedChapterId
    ? pages.filter((p) => p.sectionId === selectedChapterId)
    : pages;

  const displayPage =
    filteredPages[currentPage] ?? filteredPages[0] ?? null;

  const pageW = settings.trimSize.width * PREVIEW_PPI;
  const pageH = settings.trimSize.height * PREVIEW_PPI;

  const bgColor =
    settings.paperColor === "cream" ? "#f5f0e6" : "#ffffff";

  const fontFamily =
    settings.fontFamily === "serif"
      ? "Georgia, 'Times New Roman', serif"
      : settings.fontFamily === "sans-serif"
      ? "'Helvetica Neue', Arial, sans-serif"
      : "'Courier New', Courier, monospace";

  // Scale font for preview
  const previewFontSize = settings.fontSize * (PREVIEW_PPI / 72);
  const previewLineHeight = previewFontSize * settings.lineHeight;

  const isRecto = displayPage ? displayPage.pageNumber % 2 === 1 : true;
  const marginLeft = isRecto
    ? margins.inside * PREVIEW_PPI
    : margins.outside * PREVIEW_PPI;
  const marginRight = isRecto
    ? margins.outside * PREVIEW_PPI
    : margins.inside * PREVIEW_PPI;

  // Kind-specific content rendering
  const renderPageContent = (page: RenderedPage) => {
    const { sectionKind } = page;

    if (sectionKind === "title-page") {
      return (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: marginLeft,
            right: marginRight,
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
              fontSize: previewFontSize * 2,
              fontWeight: "bold",
              textAlign: "center",
              lineHeight: 1.3,
              marginBottom: previewLineHeight,
            }}
          >
            {page.lines.find((l) => l.isTitle)?.text || ""}
          </div>
          <div
            style={{
              fontSize: previewFontSize * 1.1,
              textAlign: "center",
            }}
          >
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
            left: marginLeft,
            right: marginRight,
            bottom: margins.bottom * PREVIEW_PPI,
            fontFamily,
            fontSize: previewFontSize * 0.7,
            lineHeight: `${previewLineHeight * 0.8}px`,
            color: "#444",
          }}
        >
          {page.lines
            .filter((l) => l.text !== "" || page.lines.indexOf(l) > page.lines.length / 2)
            .map((line, i) =>
              line.text === "" ? (
                <div key={i} style={{ height: previewLineHeight * 0.3 }} />
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
            left: marginLeft,
            right: marginRight,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily,
            fontSize: previewFontSize,
            fontStyle: "italic",
            color: "#1a1a1a",
            textAlign: "center",
          }}
        >
          <div>
            {page.lines
              .filter((l) => l.text !== "")
              .map((line, i) => (
                <div key={i} style={{ lineHeight: `${previewLineHeight * 1.5}px` }}>
                  {line.text}
                </div>
              ))}
          </div>
        </div>
      );
    }

    // Default: chapter / back matter kinds
    return (
      <div
        style={{
          position: "absolute",
          top: margins.top * PREVIEW_PPI,
          left: marginLeft,
          right: marginRight,
          bottom: margins.bottom * PREVIEW_PPI,
          fontFamily,
          fontSize: previewFontSize,
          lineHeight: `${previewLineHeight}px`,
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
                  fontSize: previewFontSize * 1.4,
                  fontWeight: "bold",
                  lineHeight: `${previewLineHeight * 1.5}px`,
                }}
              >
                {line.text}
              </div>
            );
          }
          if (line.text === "") {
            return (
              <div
                key={i}
                style={{ height: previewLineHeight * 0.5 }}
              />
            );
          }
          return (
            <div key={i} style={{ lineHeight: `${previewLineHeight}px` }}>
              {line.text}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider self-start">
        Print Preview
      </h3>

      {/* Page container with shadow */}
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
          renderPageContent(displayPage)
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No content to preview
          </div>
        )}

        {/* Page number — gated on showPageNumber */}
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
            width: (isRecto ? margins.inside : margins.inside) * PREVIEW_PPI,
            background:
              "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(168,85,247,0.15) 2px, rgba(168,85,247,0.15) 4px)",
          }}
          title="Gutter / spine area"
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          disabled={currentPage <= 0}
          className="rounded px-3 py-1 text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Previous
        </button>
        <span className="text-xs text-gray-400">
          Page {currentPage + 1} of{" "}
          {filteredPages.length || totalPages || 1}
          {selectedChapterId && (
            <span className="text-gray-600"> (filtered)</span>
          )}
        </span>
        <button
          onClick={() =>
            onPageChange(
              Math.min(filteredPages.length - 1, currentPage + 1)
            )
          }
          disabled={currentPage >= filteredPages.length - 1}
          className="rounded px-3 py-1 text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Next
        </button>
      </div>
    </div>
  );
}
