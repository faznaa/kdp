"use client";

import { useCallback, useRef, useState } from "react";
import mammoth from "mammoth";

interface EditorProps {
  rawText: string;
  onTextChange: (text: string) => void;
  bookTitle: string;
  onTitleChange: (title: string) => void;
  authorName: string;
  onAuthorNameChange: (name: string) => void;
}

export default function Editor({
  rawText,
  onTextChange,
  bookTitle,
  onTitleChange,
  authorName,
  onAuthorNameChange,
}: EditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text/plain");
      onTextChange(pasted);
    },
    [onTextChange]
  );

  const processFile = useCallback(
    async (file: File) => {
      setUploadError(null);
      setUploadedFile(null);

      const name = file.name.toLowerCase();
      const isTxt = name.endsWith(".txt");
      const isDocx = name.endsWith(".docx");
      const isPdf = name.endsWith(".pdf");

      if (!isTxt && !isDocx && !isPdf) {
        setUploadError("Unsupported file type. Please upload a .txt, .docx, or .pdf file.");
        return;
      }

      setUploading(true);

      try {
        if (isTxt) {
          const text = await file.text();
          onTextChange(text);
          setUploadedFile(file.name);
        } else if (isDocx) {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          if (result.value) {
            onTextChange(result.value);
            setUploadedFile(file.name);
          } else {
            setUploadError("Could not extract text from this DOCX file.");
          }
        } else {
          const { extractTextFromPDF } = await import("@/lib/pdf-extractor");
          const arrayBuffer = await file.arrayBuffer();
          const text = await extractTextFromPDF(arrayBuffer);
          if (text.trim()) {
            onTextChange(text);
            setUploadedFile(file.name);
          } else {
            setUploadError("Could not extract text from this PDF. It may be image-based (scanned).");
          }
        }
      } catch (err) {
        console.error("File processing error:", err);
        setUploadError("Failed to read file. It may be corrupted or unsupported.");
      } finally {
        setUploading(false);
      }
    },
    [onTextChange]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      // Reset input so the same file can be re-uploaded
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
    <div className="flex flex-col gap-3">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Book Title
        </label>
        <input
          type="text"
          value={bookTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          placeholder="Enter your book title..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Author Name
        </label>
        <input
          type="text"
          value={authorName}
          onChange={(e) => onAuthorNameChange(e.target.value)}
          className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          placeholder="Enter the author name..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Book Content
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Upload a file or paste your manuscript. Chapters are auto-detected
          from headings like &quot;Chapter 1&quot;, &quot;Part I&quot;,
          &quot;Prologue&quot;, etc.
        </p>

        {/* File Upload Zone */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.txt,.pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`mb-3 flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-4 cursor-pointer transition ${
            dragOver
              ? "border-amber-500 bg-amber-500/10"
              : "border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800"
          }`}
        >
          {uploading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
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
              Processing file...
            </div>
          ) : (
            <>
              <svg
                className="h-6 w-6 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <span className="text-xs text-gray-400">
                Drop a <span className="text-gray-300 font-medium">.docx</span>,{" "}
                <span className="text-gray-300 font-medium">.pdf</span>,{" "}
                or <span className="text-gray-300 font-medium">.txt</span> file
                here, or click to browse
              </span>
            </>
          )}
        </div>

        {/* Upload feedback */}
        {uploadedFile && (
          <div className="mb-2 flex items-center gap-2 rounded border border-green-800 bg-green-900/20 px-3 py-1.5 text-xs text-green-400">
            <svg
              className="h-3.5 w-3.5 flex-shrink-0"
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
        )}
        {uploadError && (
          <div className="mb-2 flex items-center gap-2 rounded border border-red-800 bg-red-900/20 px-3 py-1.5 text-xs text-red-400">
            <svg
              className="h-3.5 w-3.5 flex-shrink-0"
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

        {/* Text Area */}
        <textarea
          value={rawText}
          onChange={(e) => onTextChange(e.target.value)}
          onPaste={handlePaste}
          rows={18}
          className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 font-mono leading-relaxed focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-y"
          placeholder="Paste your book text here..."
        />
        <p className="text-xs text-gray-500 mt-1">
          {rawText.length.toLocaleString()} characters
        </p>
      </div>
    </div>
  );
}
