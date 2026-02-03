"use client";

import { KDPSettings, Margins, ValidationIssue } from "@/lib/types";
import { TRIM_SIZES } from "@/lib/kdp-rules";

interface SettingsStepProps {
  settings: KDPSettings;
  margins: Margins;
  pageCount: number;
  issues: ValidationIssue[];
  onSettingsChange: (settings: KDPSettings) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function SettingsStep({
  settings,
  margins,
  pageCount,
  issues,
  onSettingsChange,
  onNext,
  onBack,
}: SettingsStepProps) {
  const errors = issues.filter((i) => i.type === "error");
  const warnings = issues.filter((i) => i.type === "warning");

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-100 mb-2">
          KDP Settings
        </h2>
        <p className="text-gray-400 text-sm">
          We&apos;ve applied optimal settings for your book. Adjust if needed.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Trim Size */}
        <div className="bg-gray-800/50 rounded-xl p-5">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Trim Size
          </label>
          <select
            value={`${settings.trimSize.width}x${settings.trimSize.height}`}
            onChange={(e) => {
              const [w, h] = e.target.value.split("x").map(Number);
              const selected = TRIM_SIZES.find(
                (t) => t.width === w && t.height === h
              );
              if (selected) {
                onSettingsChange({ ...settings, trimSize: selected });
              }
            }}
            className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2.5 text-gray-100 focus:border-amber-500 focus:outline-none"
          >
            {TRIM_SIZES.map((size) => (
              <option key={size.label} value={`${size.width}x${size.height}`}>
                {size.label}
                {size.width === 6 && size.height === 9 ? " (Popular)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Paper Color */}
        <div className="bg-gray-800/50 rounded-xl p-5">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Paper Color
          </label>
          <div className="flex gap-3">
            <button
              onClick={() =>
                onSettingsChange({ ...settings, paperColor: "cream" })
              }
              className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition ${
                settings.paperColor === "cream"
                  ? "border-amber-500 bg-amber-500/10 text-amber-400"
                  : "border-gray-600 text-gray-400 hover:border-gray-500"
              }`}
            >
              <span
                className="inline-block w-4 h-4 rounded mr-2"
                style={{ backgroundColor: "#f5f0e6" }}
              />
              Cream
            </button>
            <button
              onClick={() =>
                onSettingsChange({ ...settings, paperColor: "white" })
              }
              className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition ${
                settings.paperColor === "white"
                  ? "border-amber-500 bg-amber-500/10 text-amber-400"
                  : "border-gray-600 text-gray-400 hover:border-gray-500"
              }`}
            >
              <span
                className="inline-block w-4 h-4 rounded mr-2 border border-gray-600"
                style={{ backgroundColor: "#ffffff" }}
              />
              White
            </button>
          </div>
        </div>

        {/* Font Family */}
        <div className="bg-gray-800/50 rounded-xl p-5">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Font Style
          </label>
          <div className="flex gap-2">
            {["serif", "sans-serif", "monospace"].map((font) => (
              <button
                key={font}
                onClick={() => onSettingsChange({ ...settings, fontFamily: font })}
                className={`flex-1 py-2 rounded-lg border-2 text-xs font-medium transition ${
                  settings.fontFamily === font
                    ? "border-amber-500 bg-amber-500/10 text-amber-400"
                    : "border-gray-600 text-gray-400 hover:border-gray-500"
                }`}
                style={{
                  fontFamily:
                    font === "serif"
                      ? "Georgia, serif"
                      : font === "sans-serif"
                      ? "Arial, sans-serif"
                      : "monospace",
                }}
              >
                {font === "serif" ? "Serif" : font === "sans-serif" ? "Sans" : "Mono"}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div className="bg-gray-800/50 rounded-xl p-5">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Font Size: {settings.fontSize}pt
          </label>
          <input
            type="range"
            min="9"
            max="14"
            step="0.5"
            value={settings.fontSize}
            onChange={(e) =>
              onSettingsChange({
                ...settings,
                fontSize: parseFloat(e.target.value),
              })
            }
            className="w-full accent-amber-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>9pt</span>
            <span>14pt</span>
          </div>
        </div>

        {/* Line Height */}
        <div className="bg-gray-800/50 rounded-xl p-5">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Line Spacing: {settings.lineHeight.toFixed(1)}
          </label>
          <input
            type="range"
            min="1.2"
            max="2"
            step="0.1"
            value={settings.lineHeight}
            onChange={(e) =>
              onSettingsChange({
                ...settings,
                lineHeight: parseFloat(e.target.value),
              })
            }
            className="w-full accent-amber-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Tight</span>
            <span>Spacious</span>
          </div>
        </div>

        {/* Computed Info */}
        <div className="bg-gray-800/50 rounded-xl p-5">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Calculated
          </label>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Pages</span>
              <span className="text-gray-200 font-medium">{pageCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Margins</span>
              <span className="text-gray-400 text-xs">
                T:{margins.top}&quot; B:{margins.bottom}&quot; I:{margins.inside}&quot; O:
                {margins.outside}&quot;
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Issues */}
      {(errors.length > 0 || warnings.length > 0) && (
        <div className="mt-6 space-y-2">
          {errors.map((issue, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg border border-red-800 bg-red-900/20 px-4 py-2 text-sm text-red-400"
            >
              <svg
                className="h-4 w-4 mt-0.5 flex-shrink-0"
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
              {issue.message}
            </div>
          ))}
          {warnings.map((issue, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg border border-yellow-800 bg-yellow-900/20 px-4 py-2 text-sm text-yellow-400"
            >
              <svg
                className="h-4 w-4 mt-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
              {issue.message}
            </div>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-8">
        <button
          onClick={onBack}
          className="px-6 py-2.5 text-gray-400 hover:text-gray-200 font-medium transition"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={errors.length > 0}
          className="px-8 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Preview
        </button>
      </div>
    </div>
  );
}
