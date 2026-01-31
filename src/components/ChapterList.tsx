"use client";

import { Chapter } from "@/lib/types";

interface ChapterListProps {
  chapters: Chapter[];
  selectedChapterId: string | null;
  onSelectChapter: (id: string) => void;
  frontMatterCount?: number;
  backMatterCount?: number;
}

export default function ChapterList({
  chapters,
  selectedChapterId,
  onSelectChapter,
  frontMatterCount = 0,
  backMatterCount = 0,
}: ChapterListProps) {
  if (chapters.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-700 p-4 text-center text-sm text-gray-500">
        No chapters detected. Paste text with chapter headings to auto-split.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider mb-2">
        Chapters ({chapters.length})
      </h3>
      {frontMatterCount > 0 && (
        <div className="text-xs text-gray-500 px-3 py-1 border border-dashed border-gray-700 rounded mb-1 text-center">
          {frontMatterCount} front matter page{frontMatterCount !== 1 ? "s" : ""}
        </div>
      )}
      <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-700">
        {chapters.map((ch, idx) => {
          const wordCount = ch.content
            .split(/\s+/)
            .filter((w) => w.length > 0).length;
          const isSelected = ch.id === selectedChapterId;

          return (
            <button
              key={ch.id}
              onClick={() => onSelectChapter(ch.id)}
              className={`w-full text-left px-3 py-2 text-sm border-b border-gray-700 last:border-b-0 transition ${
                isSelected
                  ? "bg-amber-500/10 text-amber-400"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <span className="font-medium">
                {idx + 1}. {ch.title}
              </span>
              <span className="ml-2 text-xs text-gray-500">
                {wordCount.toLocaleString()} words
              </span>
            </button>
          );
        })}
      </div>
      {backMatterCount > 0 && (
        <div className="text-xs text-gray-500 px-3 py-1 border border-dashed border-gray-700 rounded mt-1 text-center">
          {backMatterCount} back matter section{backMatterCount !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
