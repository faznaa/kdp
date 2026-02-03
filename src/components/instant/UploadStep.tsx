"use client";

import { useCallback, useRef, useState } from "react";
import mammoth from "mammoth";

interface UploadStepProps {
  onFileProcessed: (text: string, fileName: string) => void;
  onNext: () => void;
}

export default function UploadStep({ onFileProcessed, onNext }: UploadStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [textPreview, setTextPreview] = useState<string | null>(null);

  const processFile = useCallback(
    async (file: File) => {
      setUploadError(null);
      setUploadedFile(null);
      setTextPreview(null);

      const name = file.name.toLowerCase();
      const isDocx = name.endsWith(".docx");
      const isPdf = name.endsWith(".pdf");

      if (!isDocx && !isPdf) {
        setUploadError("Please upload a .docx or .pdf file.");
        return;
      }

      setUploading(true);

      try {
        let text = "";

        if (isDocx) {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          if (result.value) {
            text = result.value;
          } else {
            setUploadError("Could not extract text from this DOCX file.");
            setUploading(false);
            return;
          }
        } else {
          const { extractTextFromPDF } = await import("@/lib/pdf-extractor");
          const arrayBuffer = await file.arrayBuffer();
          text = await extractTextFromPDF(arrayBuffer);
          if (!text.trim()) {
            setUploadError(
              "Could not extract text from this PDF. It may be image-based (scanned)."
            );
            setUploading(false);
            return;
          }
        }

        setUploadedFile(file.name);
        setTextPreview(text.slice(0, 500) + (text.length > 500 ? "..." : ""));
        onFileProcessed(text, file.name);
      } catch (err) {
        console.error("File processing error:", err);
        setUploadError("Failed to read file. It may be corrupted or unsupported.");
      } finally {
        setUploading(false);
      }
    },
    [onFileProcessed]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = "";
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-gray-100 mb-2">
          Upload Your Manuscript
        </h2>
        <p className="text-gray-400 text-sm">
          Drop your document and we&apos;ll set up optimal KDP formatting automatically.
        </p>
      </div>

      {/* File Upload Zone */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,.pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`w-full max-w-lg flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-8 py-16 cursor-pointer transition ${
          dragOver
            ? "border-amber-500 bg-amber-500/10"
            : "border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800"
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <svg
              className="h-10 w-10 animate-spin text-amber-500"
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
            <span className="text-gray-400">Processing your document...</span>
          </div>
        ) : (
          <>
            <svg
              className="h-12 w-12 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <div className="text-center">
              <span className="text-gray-300 font-medium">
                Drop your file here
              </span>
              <span className="text-gray-500 block text-sm mt-1">
                or click to browse
              </span>
            </div>
            <div className="flex gap-3 text-xs text-gray-500">
              <span className="px-2 py-1 bg-gray-700 rounded">.docx</span>
              <span className="px-2 py-1 bg-gray-700 rounded">.pdf</span>
            </div>
          </>
        )}
      </div>

      {/* Upload feedback */}
      {uploadError && (
        <div className="w-full max-w-lg flex items-center gap-2 rounded-lg border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-400">
          <svg
            className="h-5 w-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          {uploadError}
        </div>
      )}

      {uploadedFile && textPreview && (
        <div className="w-full max-w-lg">
          <div className="flex items-center gap-2 rounded-t-lg border border-green-800 bg-green-900/20 px-4 py-2 text-sm text-green-400">
            <svg
              className="h-5 w-5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Loaded: {uploadedFile}
          </div>
          <div className="border border-t-0 border-gray-700 bg-gray-800/50 px-4 py-3 rounded-b-lg">
            <p className="text-xs text-gray-500 mb-2">Preview:</p>
            <p className="text-sm text-gray-400 font-mono whitespace-pre-wrap line-clamp-4">
              {textPreview}
            </p>
          </div>
          <button
            onClick={onNext}
            className="mt-4 w-full px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
