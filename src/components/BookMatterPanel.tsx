"use client";

import { useState } from "react";
import { FrontMatter, BackMatter } from "@/lib/types";

interface BookMatterPanelProps {
  frontMatter: FrontMatter;
  backMatter: BackMatter;
  onFrontMatterChange: (fm: FrontMatter) => void;
  onBackMatterChange: (bm: BackMatter) => void;
}

export default function BookMatterPanel({
  frontMatter,
  backMatter,
  onFrontMatterChange,
  onBackMatterChange,
}: BookMatterPanelProps) {
  const [frontOpen, setFrontOpen] = useState(false);
  const [backOpen, setBackOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      {/* Front Matter */}
      <div className="rounded-lg border border-gray-700 overflow-hidden">
        <button
          onClick={() => setFrontOpen(!frontOpen)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-200 bg-gray-800/50 hover:bg-gray-800 transition"
        >
          <span className="uppercase tracking-wider text-xs">Front Matter</span>
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform ${frontOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {frontOpen && (
          <div className="px-3 py-3 flex flex-col gap-3 border-t border-gray-700">
            {/* Title Page — toggle only */}
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={frontMatter.titlePage.enabled}
                onChange={(e) =>
                  onFrontMatterChange({
                    ...frontMatter,
                    titlePage: { ...frontMatter.titlePage, enabled: e.target.checked },
                  })
                }
                className="rounded border-gray-600 bg-gray-800 text-amber-500 focus:ring-amber-500"
              />
              Title Page
              <span className="text-xs text-gray-500">(auto-generated)</span>
            </label>

            {/* Copyright Page */}
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={frontMatter.copyrightPage.enabled}
                  onChange={(e) =>
                    onFrontMatterChange({
                      ...frontMatter,
                      copyrightPage: { ...frontMatter.copyrightPage, enabled: e.target.checked },
                    })
                  }
                  className="rounded border-gray-600 bg-gray-800 text-amber-500 focus:ring-amber-500"
                />
                Copyright Page
              </label>
              {frontMatter.copyrightPage.enabled && (
                <textarea
                  value={frontMatter.copyrightPage.content}
                  onChange={(e) =>
                    onFrontMatterChange({
                      ...frontMatter,
                      copyrightPage: { ...frontMatter.copyrightPage, content: e.target.value },
                    })
                  }
                  rows={4}
                  className="mt-1.5 w-full rounded border border-gray-600 bg-gray-800 px-2 py-1.5 text-xs text-gray-200 placeholder-gray-500 font-mono focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-y"
                />
              )}
            </div>

            {/* Dedication */}
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={frontMatter.dedication.enabled}
                  onChange={(e) =>
                    onFrontMatterChange({
                      ...frontMatter,
                      dedication: { ...frontMatter.dedication, enabled: e.target.checked },
                    })
                  }
                  className="rounded border-gray-600 bg-gray-800 text-amber-500 focus:ring-amber-500"
                />
                Dedication
              </label>
              {frontMatter.dedication.enabled && (
                <textarea
                  value={frontMatter.dedication.content}
                  onChange={(e) =>
                    onFrontMatterChange({
                      ...frontMatter,
                      dedication: { ...frontMatter.dedication, content: e.target.value },
                    })
                  }
                  rows={2}
                  className="mt-1.5 w-full rounded border border-gray-600 bg-gray-800 px-2 py-1.5 text-xs text-gray-200 placeholder-gray-500 font-mono focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-y"
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Back Matter */}
      <div className="rounded-lg border border-gray-700 overflow-hidden">
        <button
          onClick={() => setBackOpen(!backOpen)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-200 bg-gray-800/50 hover:bg-gray-800 transition"
        >
          <span className="uppercase tracking-wider text-xs">Back Matter</span>
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform ${backOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {backOpen && (
          <div className="px-3 py-3 flex flex-col gap-3 border-t border-gray-700">
            {/* About the Author */}
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={backMatter.aboutAuthor.enabled}
                  onChange={(e) =>
                    onBackMatterChange({
                      ...backMatter,
                      aboutAuthor: { ...backMatter.aboutAuthor, enabled: e.target.checked },
                    })
                  }
                  className="rounded border-gray-600 bg-gray-800 text-amber-500 focus:ring-amber-500"
                />
                About the Author
              </label>
              {backMatter.aboutAuthor.enabled && (
                <textarea
                  value={backMatter.aboutAuthor.content}
                  onChange={(e) =>
                    onBackMatterChange({
                      ...backMatter,
                      aboutAuthor: { ...backMatter.aboutAuthor, content: e.target.value },
                    })
                  }
                  rows={3}
                  className="mt-1.5 w-full rounded border border-gray-600 bg-gray-800 px-2 py-1.5 text-xs text-gray-200 placeholder-gray-500 font-mono focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-y"
                />
              )}
            </div>

            {/* Also By */}
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={backMatter.alsoBy.enabled}
                  onChange={(e) =>
                    onBackMatterChange({
                      ...backMatter,
                      alsoBy: { ...backMatter.alsoBy, enabled: e.target.checked },
                    })
                  }
                  className="rounded border-gray-600 bg-gray-800 text-amber-500 focus:ring-amber-500"
                />
                Also By
              </label>
              {backMatter.alsoBy.enabled && (
                <textarea
                  value={backMatter.alsoBy.content}
                  onChange={(e) =>
                    onBackMatterChange({
                      ...backMatter,
                      alsoBy: { ...backMatter.alsoBy, content: e.target.value },
                    })
                  }
                  rows={3}
                  className="mt-1.5 w-full rounded border border-gray-600 bg-gray-800 px-2 py-1.5 text-xs text-gray-200 placeholder-gray-500 font-mono focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-y"
                />
              )}
            </div>

            {/* Acknowledgments */}
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={backMatter.acknowledgments.enabled}
                  onChange={(e) =>
                    onBackMatterChange({
                      ...backMatter,
                      acknowledgments: { ...backMatter.acknowledgments, enabled: e.target.checked },
                    })
                  }
                  className="rounded border-gray-600 bg-gray-800 text-amber-500 focus:ring-amber-500"
                />
                Acknowledgments
              </label>
              {backMatter.acknowledgments.enabled && (
                <textarea
                  value={backMatter.acknowledgments.content}
                  onChange={(e) =>
                    onBackMatterChange({
                      ...backMatter,
                      acknowledgments: { ...backMatter.acknowledgments, content: e.target.value },
                    })
                  }
                  rows={3}
                  className="mt-1.5 w-full rounded border border-gray-600 bg-gray-800 px-2 py-1.5 text-xs text-gray-200 placeholder-gray-500 font-mono focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-y"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
