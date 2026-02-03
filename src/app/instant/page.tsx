"use client";

import { useState, useMemo, useCallback } from "react";
import { Chapter, KDPSettings, FrontMatter, BackMatter } from "@/lib/types";
import { splitIntoChapters } from "@/lib/chapter-splitter";
import {
  INSTANT_BEST_DEFAULTS,
  INSTANT_FRONT_MATTER,
  INSTANT_BACK_MATTER,
  extractTitleFromText,
} from "@/lib/instant-defaults";
import {
  getRecommendedMargins,
  estimatePageCount,
  validateKDP,
} from "@/lib/kdp-rules";
import {
  assembleRenderableSections,
  createDefaultFrontMatter,
} from "@/lib/book-matter";

import WizardStepper from "@/components/instant/WizardStepper";
import UploadStep from "@/components/instant/UploadStep";
import ConfirmInfoStep from "@/components/instant/ConfirmInfoStep";
import SettingsStep from "@/components/instant/SettingsStep";
import PreviewStep from "@/components/instant/PreviewStep";
import AdvancedEditorStep from "@/components/instant/AdvancedEditorStep";

const WIZARD_STEPS = [
  { label: "Upload", description: "Your manuscript" },
  { label: "Info", description: "Title & chapters" },
  { label: "Settings", description: "KDP options" },
  { label: "Preview", description: "Download PDF" },
];

export default function InstantPage() {
  // Wizard state
  const [step, setStep] = useState(1);
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);

  // Book data
  const [extractedText, setExtractedText] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [settings, setSettings] = useState<KDPSettings>(INSTANT_BEST_DEFAULTS);
  const [frontMatter, setFrontMatter] = useState<FrontMatter>(INSTANT_FRONT_MATTER);
  const [backMatter, setBackMatter] = useState<BackMatter>(INSTANT_BACK_MATTER);

  // Handle file upload
  const handleFileProcessed = useCallback((text: string, fileName: string) => {
    setExtractedText(text);

    // Auto-detect title from text or filename
    const detectedTitle = extractTitleFromText(text);
    if (detectedTitle) {
      setBookTitle(detectedTitle);
    } else {
      // Use filename without extension as fallback
      const nameWithoutExt = fileName.replace(/\.(docx|pdf)$/i, "");
      setBookTitle(nameWithoutExt);
    }

    // Split into chapters
    const detectedChapters = splitIntoChapters(text);
    setChapters(detectedChapters);
  }, []);

  // Handle chapter title change - preserve removed text as content
  const handleChapterTitleChange = useCallback((id: string, newTitle: string) => {
    setChapters((prev) =>
      prev.map((ch) => {
        if (ch.id !== id) return ch;

        const oldTitle = ch.title;

        // If the new title is shorter and the old title started with it,
        // the removed part should be prepended to the content
        if (oldTitle.length > newTitle.length && oldTitle.startsWith(newTitle)) {
          const removedText = oldTitle.slice(newTitle.length).trim();
          if (removedText) {
            return {
              ...ch,
              title: newTitle,
              content: removedText + "\n\n" + ch.content,
              // Also update htmlContent if present
              htmlContent: ch.htmlContent
                ? `<p>${removedText}</p>` + ch.htmlContent
                : undefined,
            };
          }
        }

        return { ...ch, title: newTitle };
      })
    );
  }, []);

  // Handle chapter merge with previous (when it's not actually a chapter)
  const handleChapterMergeWithPrevious = useCallback((id: string) => {
    setChapters((prev) => {
      const index = prev.findIndex((ch) => ch.id === id);
      if (index <= 0) return prev; // Can't merge first chapter

      const currentChapter = prev[index];
      const previousChapter = prev[index - 1];

      // Merge: add current chapter's title and content to previous chapter
      const mergedContent = previousChapter.content +
        "\n\n" + currentChapter.title +
        "\n\n" + currentChapter.content;

      // Create new array with merged chapter and remove current
      const newChapters = [...prev];
      newChapters[index - 1] = {
        ...previousChapter,
        content: mergedContent,
        // Also merge htmlContent if present
        htmlContent: previousChapter.htmlContent
          ? previousChapter.htmlContent +
            `<p><strong>${currentChapter.title}</strong></p>` +
            (currentChapter.htmlContent || `<p>${currentChapter.content.replace(/\n\n/g, '</p><p>')}</p>`)
          : undefined,
      };
      newChapters.splice(index, 1); // Remove the merged chapter

      return newChapters;
    });
  }, []);

  // Handle settings change (partial update)
  const handleSettingsChange = useCallback((updates: Partial<KDPSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  // Update front matter when title/author changes
  const updatedFrontMatter = useMemo(() => {
    const fm = createDefaultFrontMatter(bookTitle, authorName);
    return {
      ...frontMatter,
      titlePage: { ...frontMatter.titlePage, content: "" },
      copyrightPage: { ...frontMatter.copyrightPage, content: fm.copyrightPage.content },
    };
  }, [bookTitle, authorName, frontMatter]);

  // Computed values
  const fullText = useMemo(
    () => chapters.map((ch) => `${ch.title}\n\n${ch.content}`).join("\n\n\n"),
    [chapters]
  );

  const margins = useMemo(() => {
    const tempPageCount = estimatePageCount(fullText, settings, {
      top: 0.5,
      bottom: 0.5,
      inside: 0.5,
      outside: 0.5,
    });
    return getRecommendedMargins(Math.max(tempPageCount, 24), settings.bleed);
  }, [fullText, settings]);

  const pageCount = useMemo(
    () => estimatePageCount(fullText, settings, margins),
    [fullText, settings, margins]
  );

  const issues = useMemo(
    () => validateKDP(settings, pageCount, margins),
    [settings, pageCount, margins]
  );

  const sections = useMemo(
    () =>
      assembleRenderableSections(
        updatedFrontMatter,
        chapters,
        backMatter,
        bookTitle,
        authorName
      ),
    [updatedFrontMatter, chapters, backMatter, bookTitle, authorName]
  );

  // Navigation handlers
  const goToStep = (newStep: number) => {
    if (newStep >= 1 && newStep <= 4) {
      setStep(newStep);
    }
  };

  const handleNext = () => goToStep(step + 1);
  const handleBack = () => goToStep(step - 1);

  // Advanced editor handlers
  const handleOpenAdvancedEditor = useCallback(() => {
    setShowAdvancedEditor(true);
  }, []);

  const handleSaveAdvancedEdit = useCallback((updatedChapters: Chapter[]) => {
    setChapters(updatedChapters);
    setShowAdvancedEditor(false);
  }, []);

  const handleCloseAdvancedEditor = useCallback(() => {
    setShowAdvancedEditor(false);
  }, []);

  // Front/Back matter handlers
  const handleFrontMatterChange = useCallback((updates: Partial<FrontMatter>) => {
    setFrontMatter((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleBackMatterChange = useCallback((updates: Partial<BackMatter>) => {
    setBackMatter((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span className="text-sm">Back to Editor</span>
          </a>
          <h1 className="text-lg font-bold text-amber-500">Instant KDP</h1>
          <div className="w-24" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Wizard Stepper */}
      <div className="max-w-3xl mx-auto px-4 pt-8 pb-4">
        <WizardStepper currentStep={step} steps={WIZARD_STEPS} onStepClick={goToStep} />
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 pb-32">
        {step === 1 && (
          <UploadStep onFileProcessed={handleFileProcessed} onNext={handleNext} />
        )}

        {step === 2 && (
          <ConfirmInfoStep
            bookTitle={bookTitle}
            authorName={authorName}
            chapters={chapters}
            onTitleChange={setBookTitle}
            onAuthorChange={setAuthorName}
            onChapterTitleChange={handleChapterTitleChange}
            onChapterMergeWithPrevious={handleChapterMergeWithPrevious}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {step === 3 && (
          <SettingsStep
            settings={settings}
            margins={margins}
            pageCount={pageCount}
            issues={issues}
            onSettingsChange={(newSettings) => setSettings(newSettings)}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {step === 4 && !showAdvancedEditor && (
          <PreviewStep
            sections={sections}
            settings={settings}
            margins={margins}
            bookTitle={bookTitle}
            authorName={authorName}
            pageCount={pageCount}
            frontMatter={frontMatter}
            backMatter={backMatter}
            onSettingsChange={handleSettingsChange}
            onFrontMatterChange={handleFrontMatterChange}
            onBackMatterChange={handleBackMatterChange}
            onBack={handleBack}
            onAdvancedEdit={handleOpenAdvancedEditor}
          />
        )}

        {step === 4 && showAdvancedEditor && (
          <AdvancedEditorStep
            chapters={chapters}
            onSave={handleSaveAdvancedEdit}
            onBack={handleCloseAdvancedEditor}
          />
        )}
      </main>
    </div>
  );
}
