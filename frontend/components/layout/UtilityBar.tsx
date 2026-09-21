"use client";

import { usePortal } from "@/context/PortalContext";
import { SHELL_LABELS } from "@/lib/constants";

export function UtilityBar() {
  const { language, setLanguage, textSize, setTextSize, isHighContrast, toggleHighContrast } =
    usePortal();

  return (
    <div className="w-full bg-surface-secondary border-b border-border-light text-[0.875rem] text-text-secondary">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-9 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a
            href="#main-content"
            className="font-bold text-accent hover:underline focus:bg-surface focus:p-1 focus:outline-3 focus:outline-accent"
          >
            {SHELL_LABELS.skipToContent[language]}
          </a>
          <span className="text-border">|</span>
          <span className="hidden sm:inline-block">
            {SHELL_LABELS.screenReader[language]}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border-r border-border-light pr-3">
            <span className="text-[0.8125rem] text-text-muted mr-1 hidden md:inline">
              {SHELL_LABELS.textSize[language]}:
            </span>
            <button
              type="button"
              onClick={() => setTextSize("sm")}
              aria-label="Decrease text size"
              className={`px-1.5 py-0.5 rounded-sm font-bold cursor-pointer text-[0.8125rem] ${
                textSize === "sm" ? "bg-accent text-accent-foreground" : "hover:bg-surface-tertiary"
              }`}
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setTextSize("normal")}
              aria-label="Normal text size"
              className={`px-1.5 py-0.5 rounded-sm font-bold cursor-pointer text-[0.875rem] ${
                textSize === "normal" ? "bg-accent text-accent-foreground" : "hover:bg-surface-tertiary"
              }`}
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setTextSize("lg")}
              aria-label="Increase text size"
              className={`px-1.5 py-0.5 rounded-sm font-bold cursor-pointer text-[0.9375rem] ${
                textSize === "lg" ? "bg-accent text-accent-foreground" : "hover:bg-surface-tertiary"
              }`}
            >
              A+
            </button>
          </div>

          <button
            type="button"
            onClick={toggleHighContrast}
            className={`px-2 py-0.5 text-[0.8125rem] font-bold rounded-sm border cursor-pointer border-border-input ${
              isHighContrast ? "bg-text-primary text-surface" : "bg-surface hover:bg-surface-tertiary"
            }`}
          >
            {SHELL_LABELS.highContrast[language]}
          </button>

          <button
            type="button"
            onClick={() => setLanguage(language === "en" ? "hi" : "en")}
            className="px-2 py-0.5 text-[0.8125rem] font-bold rounded-sm border border-border-input bg-surface hover:bg-surface-tertiary cursor-pointer"
          >
            {language === "en" ? "हिन्दी" : "English"}
          </button>
        </div>
      </div>
    </div>
  );
}
