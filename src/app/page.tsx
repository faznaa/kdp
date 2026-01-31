"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { BookProject, FrontMatter, BackMatter, Margins } from "@/lib/types";
import {
  getRecommendedMargins,
  estimatePageCount,
  validateKDP,
} from "@/lib/kdp-rules";
import { splitIntoChapters, chaptersToText } from "@/lib/chapter-splitter";
import {
  loadProject,
  saveProject,
  createDefaultProject,
  clearProject,
} from "@/lib/storage";
import { assembleRenderableSections } from "@/lib/book-matter";

import Editor from "@/components/Editor";
import KDPSettings from "@/components/KDPSettings";
import ChapterList from "@/components/ChapterList";
import PrintPreview from "@/components/PrintPreview";
import ValidationPanel from "@/components/ValidationPanel";
import PDFDownload from "@/components/PDFDownload";
import BookMatterPanel from "@/components/BookMatterPanel";

export default function Home() {
  const [project, setProject] = useState<BookProject | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadProject();
    setProject(saved ?? createDefaultProject());
    setLoaded(true);
  }, []);

  // Auto-save on changes
  useEffect(() => {
    if (!project || !loaded) return;
    const timer = setTimeout(() => {
      saveProject({ ...project, updatedAt: Date.now() });
    }, 500);
    return () => clearTimeout(timer);
  }, [project, loaded]);

  // Compute margins and page count
  const fullText = useMemo(() => {
    if (!project?.chapters.length) return project?.rawText ?? "";
    return chaptersToText(project.chapters);
  }, [project?.chapters, project?.rawText]);

  const margins: Margins = useMemo(() => {
    if (!project) {
      return { top: 0.5, bottom: 0.5, inside: 0.5, outside: 0.5 };
    }
    const est = estimatePageCount(
      fullText,
      project.settings,
      getRecommendedMargins(100, project.settings.bleed)
    );
    return getRecommendedMargins(
      Math.max(est, 24),
      project.settings.bleed
    );
  }, [fullText, project]);

  // Assemble renderable sections from front matter + chapters + back matter
  const sections = useMemo(() => {
    if (!project) return [];
    return assembleRenderableSections(
      project.frontMatter,
      project.chapters,
      project.backMatter,
      project.title,
      project.authorName
    );
  }, [project]);

  // Count enabled front/back matter sections
  const frontMatterCount = useMemo(() => {
    if (!project) return 0;
    const fm = project.frontMatter;
    return [fm.titlePage, fm.copyrightPage, fm.dedication].filter((s) => s.enabled).length;
  }, [project]);

  const backMatterCount = useMemo(() => {
    if (!project) return 0;
    const bm = project.backMatter;
    return [bm.aboutAuthor, bm.alsoBy, bm.acknowledgments].filter((s) => s.enabled).length;
  }, [project]);

  const pageCount = useMemo(() => {
    if (!project) return 0;
    const bodyPageCount = estimatePageCount(fullText, project.settings, margins);
    return bodyPageCount + frontMatterCount + backMatterCount;
  }, [fullText, project, margins, frontMatterCount, backMatterCount]);

  const issues = useMemo(() => {
    if (!project) return [];
    return validateKDP(project.settings, pageCount, margins);
  }, [project, pageCount, margins]);

  const handleTextChange = useCallback(
    (text: string) => {
      if (!project) return;
      const chapters = splitIntoChapters(text);
      setProject({ ...project, rawText: text, chapters });
      setSelectedChapterId(null);
      setCurrentPage(0);
    },
    [project]
  );

  const handleTitleChange = useCallback(
    (title: string) => {
      if (!project) return;
      setProject({ ...project, title });
    },
    [project]
  );

  const handleAuthorNameChange = useCallback(
    (authorName: string) => {
      if (!project) return;
      setProject({ ...project, authorName });
    },
    [project]
  );

  const handleSettingsChange = useCallback(
    (settings: BookProject["settings"]) => {
      if (!project) return;
      setProject({ ...project, settings });
      setCurrentPage(0);
    },
    [project]
  );

  const handleFrontMatterChange = useCallback(
    (frontMatter: FrontMatter) => {
      if (!project) return;
      setProject({ ...project, frontMatter });
      setCurrentPage(0);
    },
    [project]
  );

  const handleBackMatterChange = useCallback(
    (backMatter: BackMatter) => {
      if (!project) return;
      setProject({ ...project, backMatter });
      setCurrentPage(0);
    },
    [project]
  );

  const handleSelectChapter = useCallback(
    (id: string) => {
      setSelectedChapterId(id === selectedChapterId ? null : id);
      setCurrentPage(0);
    },
    [selectedChapterId]
  );

  const handleNewProject = useCallback(() => {
    if (
      project?.rawText &&
      !confirm("Start a new project? Current work is saved in your browser.")
    ) {
      return;
    }
    clearProject();
    const fresh = createDefaultProject();
    setProject(fresh);
    setSelectedChapterId(null);
    setCurrentPage(0);
  }, [project?.rawText]);

  if (!loaded || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-100">
              KDP Book Formatter
            </h1>
            <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {project.settings.trimSize.label}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              Auto-saved locally
            </span>
            <button
              onClick={handleNewProject}
              className="text-xs text-gray-400 hover:text-gray-200 transition px-2 py-1 rounded border border-gray-700 hover:border-gray-600"
            >
              New Project
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-6">
          {/* Left Sidebar — Settings & Chapters */}
          <aside className="flex flex-col gap-6 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto lg:pr-2">
            <KDPSettings
              settings={project.settings}
              margins={margins}
              pageCount={pageCount}
              onSettingsChange={handleSettingsChange}
            />
            <BookMatterPanel
              frontMatter={project.frontMatter}
              backMatter={project.backMatter}
              onFrontMatterChange={handleFrontMatterChange}
              onBackMatterChange={handleBackMatterChange}
            />
            <ChapterList
              chapters={project.chapters}
              selectedChapterId={selectedChapterId}
              onSelectChapter={handleSelectChapter}
              frontMatterCount={frontMatterCount}
              backMatterCount={backMatterCount}
            />
            <ValidationPanel issues={issues} />
            <PDFDownload
              sections={sections}
              settings={project.settings}
              margins={margins}
              bookTitle={project.title}
              issues={issues}
            />
          </aside>

          {/* Center — Print Preview */}
          <section className="flex flex-col items-center lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
            <PrintPreview
              sections={sections}
              settings={project.settings}
              margins={margins}
              selectedChapterId={selectedChapterId}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              totalPages={pageCount}
            />
          </section>

          {/* Right Sidebar — Editor */}
          <aside className="lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto lg:pl-2">
            <Editor
              rawText={project.rawText}
              onTextChange={handleTextChange}
              bookTitle={project.title}
              onTitleChange={handleTitleChange}
              authorName={project.authorName}
              onAuthorNameChange={handleAuthorNameChange}
            />
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-3 text-center text-xs text-gray-600">
        KDP Book Formatter &mdash; Client-only, no data leaves your browser.
        Not affiliated with Amazon.
      </footer>
    </div>
  );
}
