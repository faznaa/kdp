"use client";

import { ValidationIssue } from "@/lib/types";

interface ValidationPanelProps {
  issues: ValidationIssue[];
}

export default function ValidationPanel({ issues }: ValidationPanelProps) {
  const errors = issues.filter((i) => i.type === "error");
  const warnings = issues.filter((i) => i.type === "warning");

  if (issues.length === 0) {
    return (
      <div className="rounded-lg border border-green-800 bg-green-900/20 p-3">
        <div className="flex items-center gap-2 text-sm text-green-400">
          <svg
            className="h-4 w-4 flex-shrink-0"
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
          All KDP checks passed
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
        KDP Validation
      </h3>

      {errors.length > 0 && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-3">
          <div className="text-xs font-semibold text-red-400 mb-1.5 uppercase">
            {errors.length} Error{errors.length > 1 ? "s" : ""}
          </div>
          <ul className="flex flex-col gap-1">
            {errors.map((err, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-red-300">
                <svg
                  className="h-3.5 w-3.5 flex-shrink-0 mt-0.5"
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
                <span>{err.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="rounded-lg border border-yellow-800 bg-yellow-900/20 p-3">
          <div className="text-xs font-semibold text-yellow-400 mb-1.5 uppercase">
            {warnings.length} Warning{warnings.length > 1 ? "s" : ""}
          </div>
          <ul className="flex flex-col gap-1">
            {warnings.map((warn, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-yellow-300"
              >
                <svg
                  className="h-3.5 w-3.5 flex-shrink-0 mt-0.5"
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
                <span>{warn.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
