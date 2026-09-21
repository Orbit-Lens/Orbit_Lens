"use client";

import Link from "next/link";
import { usePortal } from "@/context/PortalContext";
import { SHELL_LABELS } from "@/lib/constants";

export function PortalHeader() {
  const { language } = usePortal();

  return (
    <header className="w-full bg-surface border-b border-border">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 min-h-[96px] py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-4 no-underline group">
          <div className="w-16 h-16 bg-surface border border-border rounded-sm flex items-center justify-center shrink-0 p-1">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
              aria-label="OrbitLens Mark"
            >
              <circle cx="24" cy="24" r="20" stroke="var(--color-navy)" strokeWidth="2" />
              <ellipse
                cx="24"
                cy="24"
                rx="20"
                ry="8"
                transform="rotate(-25 24 24)"
                stroke="var(--color-saffron)"
                strokeWidth="2"
              />
              <circle cx="24" cy="24" r="9" fill="var(--color-accent)" />
              <circle cx="24" cy="24" r="5" fill="var(--color-surface)" />
              <circle cx="24" cy="24" r="2" fill="var(--color-india-green)" />
            </svg>
          </div>
          <div>
            <div className="text-[1.625rem] font-bold text-navy leading-tight group-hover:text-accent">
              {SHELL_LABELS.siteTitle[language]}
            </div>
            <div className="text-[1.125rem] font-normal text-text-secondary leading-snug">
              {SHELL_LABELS.siteSubtitle[language]}
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="border border-border bg-surface-secondary px-3 py-1.5 rounded-sm text-right">
            <div className="text-[0.75rem] uppercase font-bold text-accent tracking-wide">
              Smart India Hackathon 2026
            </div>
            <div className="text-[0.8125rem] text-text-muted">
              {SHELL_LABELS.prototypeNotice[language]}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
