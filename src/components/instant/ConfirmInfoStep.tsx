"use client";

import { Chapter } from "@/lib/types";

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

export default function ConfirmInfoStep({
  bookTitle,
  authorName,
  chapters,
  onTitleChange,
  onAuthorChange,
  onChapterTitleChange,
  onChapterMergeWithPrevious,
  onNext,
  onBack,
}: ConfirmInfoStepProps) {
  const totalWords = chapters.reduce((sum, ch) => {
    const words = ch.content.split(/\s+/).filter((w) => w.length > 0).length;
    return sum + words;
  }, 0);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-100 mb-2">
          Confirm Your Book Info
        </h2>
        <p className="text-gray-400 text-sm">
          We detected your chapters automatically. Verify the details below.
        </p>
      </div>

      <div className="space-y-6">
        {/* Book Info */}
        <div className="bg-gray-800/50 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Book Title
            </label>
            <input
              type="text"
              value={bookTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              placeholder="Enter your book title..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Author Name
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => onAuthorChange(e.target.value)}
              className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              placeholder="Enter the author name..."
            />
          </div>
        </div>

        {/* Chapters */}
        <div className="bg-gray-800/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-300">
              Detected Chapters
            </h3>
            <span className="text-xs text-gray-500">
              {chapters.length} chapters &middot; {totalWords.toLocaleString()} words
            </span>
          </div>

          <p className="text-xs text-gray-500 mb-3">
            Wrong chapter? Click merge to combine with previous, or delete to remove entirely.
          </p>

          {chapters.length === 0 ? (
            <p className="text-gray-500 text-sm">No chapters detected.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {chapters.map((chapter, index) => {
                const wordCount = chapter.content
                  .split(/\s+/)
                  .filter((w) => w.length > 0).length;

                return (
                  <div
                    key={chapter.id}
                    className="flex items-center gap-3 py-2 border-b border-gray-700 last:border-0 group"
                  >
                    <span className="text-xs text-gray-600 w-6">{index + 1}</span>
                    <input
                      type="text"
                      value={chapter.title}
                      onChange={(e) =>
                        onChapterTitleChange(chapter.id, e.target.value)
                      }
                      className="flex-1 rounded border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-gray-200 focus:border-amber-500 focus:outline-none"
                    />
                    <span className="text-xs text-gray-500 w-20 text-right">
                      {wordCount.toLocaleString()} words
                    </span>
                    {index > 0 && (
                      <button
                        onClick={() => onChapterMergeWithPrevious(chapter.id)}
                        className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Not a chapter - merge with previous"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <button
            onClick={onBack}
            className="px-6 py-2.5 text-gray-400 hover:text-gray-200 font-medium transition"
          >
            Back
          </button>
          <button
            onClick={onNext}
            className="px-8 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition"
          >
            Looks Good
          </button>
        </div>
      </div>
    </div>
  );
}
