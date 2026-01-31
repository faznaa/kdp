"use client";

import { KDPSettings as KDPSettingsType, Margins } from "@/lib/types";
import { TRIM_SIZES, getMinMargins } from "@/lib/kdp-rules";

interface KDPSettingsProps {
  settings: KDPSettingsType;
  margins: Margins;
  pageCount: number;
  onSettingsChange: (settings: KDPSettingsType) => void;
}

export default function KDPSettings({
  settings,
  margins,
  pageCount,
  onSettingsChange,
}: KDPSettingsProps) {
  const minMargins = getMinMargins(Math.max(pageCount, 24), settings.bleed);

  const update = (partial: Partial<KDPSettingsType>) => {
    onSettingsChange({ ...settings, ...partial });
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
        KDP Settings
      </h3>

      {/* Trim Size */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">
          Trim Size
        </label>
        <select
          value={`${settings.trimSize.width}x${settings.trimSize.height}`}
          onChange={(e) => {
            const [w, h] = e.target.value.split("x").map(Number);
            const ts = TRIM_SIZES.find(
              (t) => t.width === w && t.height === h
            );
            if (ts) update({ trimSize: ts });
          }}
          className="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1.5 text-sm text-gray-100 focus:border-amber-500 focus:outline-none"
        >
          {TRIM_SIZES.map((ts) => (
            <option key={ts.label} value={`${ts.width}x${ts.height}`}>
              {ts.label}
            </option>
          ))}
        </select>
      </div>

      {/* Bleed */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="bleed"
          checked={settings.bleed}
          onChange={(e) => update({ bleed: e.target.checked })}
          className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-amber-500 focus:ring-amber-500"
        />
        <label htmlFor="bleed" className="text-sm text-gray-300">
          Enable Bleed (0.125&quot;)
        </label>
      </div>

      {/* Paper Color */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">
          Paper Color
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => update({ paperColor: "white" })}
            className={`flex-1 rounded border px-3 py-1.5 text-sm transition ${
              settings.paperColor === "white"
                ? "border-amber-500 bg-amber-500/10 text-amber-400"
                : "border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-500"
            }`}
          >
            White
          </button>
          <button
            onClick={() => update({ paperColor: "cream" })}
            className={`flex-1 rounded border px-3 py-1.5 text-sm transition ${
              settings.paperColor === "cream"
                ? "border-amber-500 bg-amber-500/10 text-amber-400"
                : "border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-500"
            }`}
          >
            Cream
          </button>
        </div>
      </div>

      {/* Typography */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">
          Font Family
        </label>
        <select
          value={settings.fontFamily}
          onChange={(e) => update({ fontFamily: e.target.value })}
          className="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1.5 text-sm text-gray-100 focus:border-amber-500 focus:outline-none"
        >
          <option value="serif">Serif (Times)</option>
          <option value="sans-serif">Sans-serif (Helvetica)</option>
          <option value="monospace">Monospace (Courier)</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Font Size (pt)
          </label>
          <input
            type="number"
            min={8}
            max={16}
            step={0.5}
            value={settings.fontSize}
            onChange={(e) => update({ fontSize: parseFloat(e.target.value) || 11 })}
            className="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1.5 text-sm text-gray-100 focus:border-amber-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Line Height
          </label>
          <input
            type="number"
            min={1}
            max={2.5}
            step={0.1}
            value={settings.lineHeight}
            onChange={(e) =>
              update({ lineHeight: parseFloat(e.target.value) || 1.5 })
            }
            className="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1.5 text-sm text-gray-100 focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Computed Margins Display */}
      <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
        <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
          Auto-Calculated Margins
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-gray-400">
            Top: <span className="text-gray-200">{margins.top}&quot;</span>
            <span className="text-gray-600"> (min {minMargins.top}&quot;)</span>
          </div>
          <div className="text-gray-400">
            Bottom:{" "}
            <span className="text-gray-200">{margins.bottom}&quot;</span>
            <span className="text-gray-600">
              {" "}
              (min {minMargins.bottom}&quot;)
            </span>
          </div>
          <div className="text-gray-400">
            Inside:{" "}
            <span className="text-gray-200">{margins.inside}&quot;</span>
            <span className="text-gray-600">
              {" "}
              (min {minMargins.inside}&quot;)
            </span>
          </div>
          <div className="text-gray-400">
            Outside:{" "}
            <span className="text-gray-200">{margins.outside}&quot;</span>
            <span className="text-gray-600">
              {" "}
              (min {minMargins.outside}&quot;)
            </span>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Est. pages: {pageCount} | Gutter: {margins.inside}&quot;
        </div>
      </div>
    </div>
  );
}
