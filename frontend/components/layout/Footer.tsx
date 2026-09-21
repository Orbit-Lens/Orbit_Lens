"use client";

import Link from "next/link";
import { usePortal } from "@/context/PortalContext";
import { SHELL_LABELS } from "@/lib/constants";

export function Footer() {
  const { language } = usePortal();

  return (
    <footer className="w-full bg-navy-dark text-text-on-navy-muted border-t-2 border-accent-dark mt-auto">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pb-6 border-b border-border-input/40 text-[0.875rem]">
          {SHELL_LABELS.footer.policies.map((item, idx) => (
            <span key={item.id} className="flex items-center">
              <Link
                href={item.href}
                className="text-text-on-navy hover:text-white hover:underline transition-colors"
              >
                {item.label[language]}
              </Link>
              {idx < SHELL_LABELS.footer.policies.length - 1 && (
                <span className="ml-4 text-text-muted/60">·</span>
              )}
            </span>
          ))}
        </div>

        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[0.8125rem] text-text-on-navy-muted/90 text-center md:text-left">
          <div className="space-y-1">
            <p className="m-0 font-bold text-text-on-navy">{SHELL_LABELS.footer.contentOwner[language]}</p>
            <p className="m-0">{SHELL_LABELS.footer.developedFor[language]}</p>
            <p className="m-0 text-text-on-navy-muted/70">{SHELL_LABELS.footer.lastUpdated[language]}</p>
          </div>

          <div className="max-w-md text-center md:text-right text-text-on-navy-muted/80">
            <p className="m-0">{SHELL_LABELS.footer.compliance[language]}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
