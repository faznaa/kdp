"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Chapter, HeadingAlignment, ChapterStyle } from "@/lib/types";

interface AdvancedEditorStepProps {
  chapters: Chapter[];
  onSave: (chapters: Chapter[]) => void;
  onBack: () => void;
}

const LIST_STYLES = [
  { label: "●", value: "disc", icon: "●" },
  { label: "○", value: "circle", icon: "○" },
  { label: "■", value: "square", icon: "■" },
  { label: "—", value: "dash", icon: "—" },
  { label: "→", value: "arrow", icon: "→" },
  { label: "1.", value: "decimal", icon: "1." },
  { label: "a.", value: "lower-alpha", icon: "a." },
  { label: "i.", value: "lower-roman", icon: "i." },
];

const FONT_FACES = [
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Sans", value: "'Helvetica Neue', Arial, sans-serif" },
  { label: "Mono", value: "'Courier New', Courier, monospace" },
];

const FONT_SIZES = [
  { label: "Small", value: "14px" },
  { label: "Normal", value: "16px" },
  { label: "Medium", value: "18px" },
  { label: "Large", value: "20px" },
  { label: "X-Large", value: "24px" },
];

// Toolbar button component
function ToolbarButton({
  active,
  onClick,
  children,
  title,
  small,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`${small ? "p-1.5" : "p-2"} rounded transition-colors ${
        active
          ? "bg-amber-600 text-white"
          : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

// Dropdown select component
function ToolbarSelect({
  value,
  onChange,
  options,
  title,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  title: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      title={title}
      className="bg-gray-700 text-gray-300 rounded px-2 py-1.5 text-xs border-none outline-none cursor-pointer hover:bg-gray-600"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// Floating toolbar for selected text
function FloatingToolbar({
  position,
  onFormat,
  onFontFace,
  onFontSize,
  formatState,
}: {
  position: { top: number; left: number } | null;
  onFormat: (cmd: string, value?: string) => void;
  onFontFace: (face: string) => void;
  onFontSize: (size: string) => void;
  formatState: { bold: boolean; italic: boolean; underline: boolean };
}) {
  if (!position) return null;

  return (
    <div
      className="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-2 flex items-center gap-1 animate-in fade-in duration-150"
      style={{ top: position.top - 50, left: position.left }}
    >
      <ToolbarButton
        small
        active={formatState.bold}
        onClick={() => onFormat("bold")}
        title="Bold"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />
        </svg>
      </ToolbarButton>
      <ToolbarButton
        small
        active={formatState.italic}
        onClick={() => onFormat("italic")}
        title="Italic"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" />
        </svg>
      </ToolbarButton>
      <ToolbarButton
        small
        active={formatState.underline}
        onClick={() => onFormat("underline")}
        title="Underline"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z" />
        </svg>
      </ToolbarButton>

      <div className="w-px h-5 bg-gray-600 mx-1" />

      <select
        onChange={(e) => onFontFace(e.target.value)}
        className="bg-gray-700 text-gray-300 rounded px-1.5 py-1 text-xs border-none outline-none cursor-pointer"
        title="Font"
      >
        <option value="">Font</option>
        {FONT_FACES.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>

      <select
        onChange={(e) => onFontSize(e.target.value)}
        className="bg-gray-700 text-gray-300 rounded px-1.5 py-1 text-xs border-none outline-none cursor-pointer"
        title="Size"
      >
        <option value="">Size</option>
        {FONT_SIZES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Alignment button component
function AlignButton({
  active,
  onClick,
  alignment,
}: {
  active: boolean;
  onClick: () => void;
  alignment: HeadingAlignment;
}) {
  const icons = {
    left: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h10.5m-10.5 5.25h16.5" />
      </svg>
    ),
    center: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M6.75 12h10.5M3.75 17.25h16.5" />
      </svg>
    ),
    right: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M9.75 12h10.5M3.75 17.25h16.5" />
      </svg>
    ),
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={`Align ${alignment}`}
      className={`p-2 rounded transition-colors ${
        active
          ? "bg-amber-600 text-white"
          : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
      }`}
    >
      {icons[alignment]}
    </button>
  );
}

export default function AdvancedEditorStep({
  chapters,
  onSave,
  onBack,
}: AdvancedEditorStepProps) {
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [chapterTitles, setChapterTitles] = useState<string[]>(() =>
    chapters.map((ch) => ch.title)
  );
  const [chapterStyles, setChapterStyles] = useState<ChapterStyle[]>(() =>
    chapters.map((ch) => ch.style || { headingAlignment: "left" })
  );
  const [formatState, setFormatState] = useState({
    bold: false,
    italic: false,
    underline: false,
  });
  const [floatingToolbar, setFloatingToolbar] = useState<{ top: number; left: number } | null>(null);
  const [applyToAllHeadings, setApplyToAllHeadings] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const contentCache = useRef<Map<number, string>>(new Map());

  // Initialize content cache with HTML content
  useEffect(() => {
    chapters.forEach((ch, index) => {
      if (!contentCache.current.has(index)) {
        const html = ch.htmlContent || ch.content
          .split("\n\n")
          .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
          .join("");
        contentCache.current.set(index, html);
      }
    });
  }, [chapters]);

  // Load content into editor when chapter changes
  useEffect(() => {
    if (editorRef.current) {
      const content = contentCache.current.get(selectedChapterIndex) || "";
      editorRef.current.innerHTML = content;
    }
  }, [selectedChapterIndex]);

  // Save current editor content to cache
  const saveCurrentContent = useCallback(() => {
    if (editorRef.current) {
      contentCache.current.set(selectedChapterIndex, editorRef.current.innerHTML);
    }
  }, [selectedChapterIndex]);

  // Update format state and floating toolbar position
  const updateFormatState = useCallback(() => {
    setFormatState({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
    });

    // Show floating toolbar if text is selected
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.toString().trim()) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setFloatingToolbar({
        top: rect.top + window.scrollY,
        left: rect.left + rect.width / 2 - 120,
      });
    } else {
      setFloatingToolbar(null);
    }
  }, []);

  // Format command handler
  const execFormat = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    updateFormatState();
    editorRef.current?.focus();
  }, [updateFormatState]);

  // Font face handler
  const handleFontFace = useCallback((fontFamily: string) => {
    if (fontFamily) {
      document.execCommand("fontName", false, fontFamily);
      editorRef.current?.focus();
    }
  }, []);

  // Font size handler (using CSS)
  const handleFontSize = useCallback((fontSize: string) => {
    if (fontSize) {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const span = document.createElement("span");
        span.style.fontSize = fontSize;
        range.surroundContents(span);
        editorRef.current?.focus();
      }
    }
  }, []);

  // Handle chapter switch
  const handleChapterSelect = useCallback((index: number) => {
    saveCurrentContent();
    setSelectedChapterIndex(index);
    setFloatingToolbar(null);
  }, [saveCurrentContent]);

  // Handle title change
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setChapterTitles((prev) => {
      const updated = [...prev];
      updated[selectedChapterIndex] = newTitle;
      return updated;
    });
  }, [selectedChapterIndex]);

  // Handle heading alignment change
  const handleAlignmentChange = useCallback((alignment: HeadingAlignment) => {
    if (applyToAllHeadings) {
      // Apply to all chapters
      setChapterStyles((prev) =>
        prev.map((style) => ({ ...style, headingAlignment: alignment }))
      );
    } else {
      // Apply to current chapter only
      setChapterStyles((prev) => {
        const updated = [...prev];
        updated[selectedChapterIndex] = {
          ...updated[selectedChapterIndex],
          headingAlignment: alignment,
        };
        return updated;
      });
    }
  }, [selectedChapterIndex, applyToAllHeadings]);

  // List formatting
  const handleListStyle = useCallback((listType: string) => {
    if (listType === "decimal" || listType === "lower-alpha" || listType === "lower-roman") {
      document.execCommand("insertOrderedList", false);
      // Apply list style type via CSS
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && selection.anchorNode) {
          let node: Node | null = selection.anchorNode;
          while (node && node.nodeName !== "OL") {
            node = node.parentNode;
          }
          if (node && node instanceof HTMLElement) {
            node.style.listStyleType = listType;
          }
        }
      }, 10);
    } else if (listType === "dash" || listType === "arrow") {
      // For custom bullets, use unordered list with custom marker
      document.execCommand("insertUnorderedList", false);
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && selection.anchorNode) {
          let node: Node | null = selection.anchorNode;
          while (node && node.nodeName !== "UL") {
            node = node.parentNode;
          }
          if (node && node instanceof HTMLElement) {
            node.style.listStyleType = "none";
            const marker = listType === "dash" ? "— " : "→ ";
            const items = node.querySelectorAll("li");
            items.forEach((li) => {
              if (!li.textContent?.startsWith(marker)) {
                li.innerHTML = marker + li.innerHTML;
              }
            });
          }
        }
      }, 10);
    } else {
      document.execCommand("insertUnorderedList", false);
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && selection.anchorNode) {
          let node: Node | null = selection.anchorNode;
          while (node && node.nodeName !== "UL") {
            node = node.parentNode;
          }
          if (node && node instanceof HTMLElement) {
            node.style.listStyleType = listType;
          }
        }
      }, 10);
    }
    editorRef.current?.focus();
  }, []);

  // Indentation
  const handleIndent = useCallback((direction: "indent" | "outdent") => {
    document.execCommand(direction, false);
    editorRef.current?.focus();
  }, []);

  // Convert HTML to plain text
  const htmlToPlainText = useCallback((html: string): string => {
    const temp = document.createElement("div");
    temp.innerHTML = html;

    const paragraphs = temp.querySelectorAll("p");
    paragraphs.forEach((p) => {
      const textNode = document.createTextNode("\n\n");
      p.parentNode?.insertBefore(textNode, p.nextSibling);
    });

    const brs = temp.querySelectorAll("br");
    brs.forEach((br) => {
      const textNode = document.createTextNode("\n");
      br.parentNode?.replaceChild(textNode, br);
    });

    let text = temp.textContent || "";
    text = text.replace(/\n{3,}/g, "\n\n").trim();
    return text;
  }, []);

  // Save all changes
  const handleSave = useCallback(() => {
    saveCurrentContent();

    const updatedChapters: Chapter[] = chapters.map((ch, index) => {
      const htmlContent = contentCache.current.get(index) || "";
      return {
        id: ch.id,
        title: chapterTitles[index] || ch.title,
        content: htmlToPlainText(htmlContent),
        htmlContent: htmlContent,
        style: chapterStyles[index],
      };
    });

    onSave(updatedChapters);
  }, [chapters, chapterTitles, chapterStyles, htmlToPlainText, onSave, saveCurrentContent]);

  const currentStyle = chapterStyles[selectedChapterIndex] || { headingAlignment: "left" };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* Floating toolbar */}
      <FloatingToolbar
        position={floatingToolbar}
        onFormat={execFormat}
        onFontFace={handleFontFace}
        onFontSize={handleFontSize}
        formatState={formatState}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-100">Advanced Editor</h2>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="hidden sm:inline">Select text for formatting options</span>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Chapter sidebar */}
        <div className="w-56 bg-gray-800/50 rounded-lg p-3 overflow-y-auto flex-shrink-0">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Chapters</h3>
          <div className="space-y-2">
            {chapters.map((ch, index) => (
              <button
                key={ch.id}
                onClick={() => handleChapterSelect(index)}
                className={`w-full text-left p-2 rounded-lg transition ${
                  selectedChapterIndex === index
                    ? "bg-amber-600/20 border border-amber-600"
                    : "bg-gray-700/50 hover:bg-gray-700 border border-transparent"
                }`}
              >
                <div className="text-sm font-medium text-gray-200 truncate">
                  {chapterTitles[index] || ch.title}
                </div>
                <div className="text-xs text-gray-500 truncate mt-0.5">
                  {ch.content.slice(0, 40)}...
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Editor area */}
        <div className="flex-1 flex flex-col min-h-0 border border-gray-700 rounded-lg overflow-hidden">
          {/* Main Toolbar */}
          <div className="flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700 flex-wrap">
            {/* Text formatting */}
            <div className="flex items-center gap-1">
              <ToolbarButton
                active={formatState.bold}
                onClick={() => execFormat("bold")}
                title="Bold (Ctrl+B)"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />
                </svg>
              </ToolbarButton>
              <ToolbarButton
                active={formatState.italic}
                onClick={() => execFormat("italic")}
                title="Italic (Ctrl+I)"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" />
                </svg>
              </ToolbarButton>
              <ToolbarButton
                active={formatState.underline}
                onClick={() => execFormat("underline")}
                title="Underline (Ctrl+U)"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z" />
                </svg>
              </ToolbarButton>
            </div>

            <div className="w-px h-6 bg-gray-600" />

            {/* Font controls */}
            <ToolbarSelect
              value=""
              onChange={handleFontFace}
              options={[{ label: "Font", value: "" }, ...FONT_FACES]}
              title="Font Family"
            />
            <ToolbarSelect
              value=""
              onChange={handleFontSize}
              options={[{ label: "Size", value: "" }, ...FONT_SIZES]}
              title="Font Size"
            />

            <div className="w-px h-6 bg-gray-600" />

            {/* List controls */}
            <div className="flex items-center gap-1">
              <select
                onChange={(e) => e.target.value && handleListStyle(e.target.value)}
                className="bg-gray-700 text-gray-300 rounded px-2 py-1.5 text-xs border-none outline-none cursor-pointer"
                title="List Style"
                defaultValue=""
              >
                <option value="">List</option>
                {LIST_STYLES.map((ls) => (
                  <option key={ls.value} value={ls.value}>
                    {ls.label} {ls.value === "decimal" ? "Numbered" : ls.value === "disc" ? "Bullet" : ""}
                  </option>
                ))}
              </select>
              <ToolbarButton
                onClick={() => handleIndent("indent")}
                title="Increase Indent"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 12 3 16.5m18-9H9m9 4.5H9m9 4.5H9" />
                </svg>
              </ToolbarButton>
              <ToolbarButton
                onClick={() => handleIndent("outdent")}
                title="Decrease Indent"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5L3 12l4.5 4.5m13.5-9H9m9 4.5H9m9 4.5H9" />
                </svg>
              </ToolbarButton>
            </div>

            <div className="w-px h-6 bg-gray-600" />

            {/* Heading alignment */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">Title:</span>
              <AlignButton
                alignment="left"
                active={currentStyle.headingAlignment === "left"}
                onClick={() => handleAlignmentChange("left")}
              />
              <AlignButton
                alignment="center"
                active={currentStyle.headingAlignment === "center"}
                onClick={() => handleAlignmentChange("center")}
              />
              <AlignButton
                alignment="right"
                active={currentStyle.headingAlignment === "right"}
                onClick={() => handleAlignmentChange("right")}
              />
              <label className="flex items-center gap-1 ml-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyToAllHeadings}
                  onChange={(e) => setApplyToAllHeadings(e.target.checked)}
                  className="w-3 h-3 accent-amber-500"
                />
                <span className="text-xs text-gray-400">All</span>
              </label>
            </div>

            <div className="w-px h-6 bg-gray-600" />

            <ToolbarButton
              onClick={() => execFormat("removeFormat")}
              title="Clear Formatting"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" />
              </svg>
            </ToolbarButton>
          </div>

          {/* Chapter title input - styled like PDF */}
          <div
            className="px-8 pt-6 pb-2 border-b border-gray-700"
            style={{ backgroundColor: "#f5f0e6" }}
          >
            <input
              type="text"
              value={chapterTitles[selectedChapterIndex] || ""}
              onChange={handleTitleChange}
              placeholder="Chapter Title"
              className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder-gray-400"
              style={{
                textAlign: currentStyle.headingAlignment,
                color: "#1a1a1a",
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            />
          </div>

          {/* Editable content area - styled like PDF */}
          <div
            className="flex-1 overflow-y-auto"
            style={{ backgroundColor: "#f5f0e6" }}
          >
            <div
              ref={editorRef}
              contentEditable
              onSelect={updateFormatState}
              onKeyUp={updateFormatState}
              onMouseUp={updateFormatState}
              onBlur={() => setFloatingToolbar(null)}
              className="px-8 py-6 min-h-full outline-none
                [&_p]:mb-4
                [&_strong]:font-bold
                [&_em]:italic
                [&_u]:underline
                [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4
                [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4
                [&_li]:mb-1"
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "16px",
                lineHeight: "1.8",
                color: "#1a1a1a",
              }}
              suppressContentEditableWarning
            />
          </div>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 border-t border-gray-700 p-4 flex justify-between items-center z-50">
        <button
          onClick={onBack}
          className="px-5 py-2 text-gray-400 hover:text-gray-200 font-medium transition"
        >
          Cancel
        </button>
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="px-8 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition flex items-center gap-2"
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
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
