"use client";

import { useState } from "react";
import { RenderableSection, KDPSettings, Margins, ValidationIssue } from "@/lib/types";
import { generatePDF } from "@/lib/pdf-generator";

interface PDFDownloadProps {
  sections: RenderableSection[];
  settings: KDPSettings;
  margins: Margins;
  bookTitle: string;
  issues: ValidationIssue[];
}

export default function PDFDownload({
  sections,
  settings,
  margins,
  bookTitle,
  issues,
}: PDFDownloadProps) {
  const [generating, setGenerating] = useState(false);

  const hasErrors = issues.some((i) => i.type === "error");
  const hasContent = sections.some((s) => s.content.trim().length > 0);

  const handleDownload = async () => {
    if (!hasContent) return;
    setGenerating(true);
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
      a.download = `${bookTitle.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "_") || "book"}_interior.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Check console for details.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleDownload}
        disabled={generating || !hasContent}
        className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
          hasContent
            ? hasErrors
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-amber-500 hover:bg-amber-600 text-gray-900"
            : "bg-gray-700 text-gray-500 cursor-not-allowed"
        } disabled:opacity-60`}
      >
        {generating ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
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
            Generating PDF...
          </span>
        ) : hasErrors ? (
          "Download PDF (has errors)"
        ) : (
          "Download Print-Ready PDF"
        )}
      </button>
      {hasErrors && (
        <p className="text-xs text-red-400 text-center">
          Fix KDP errors above for a valid upload file.
        </p>
      )}
      {!hasContent && (
        <p className="text-xs text-gray-500 text-center">
          Add content to enable PDF download.
        </p>
      )}
    </div>
  );
}
