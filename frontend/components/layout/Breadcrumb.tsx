"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePortal } from "@/context/PortalContext";
import { SHELL_LABELS } from "@/lib/constants";

export function Breadcrumb() {
  const pathname = usePathname();
  const { language } = usePortal();

  if (pathname === "/") {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);

  const getSegmentName = (seg: string) => {
    switch (seg) {
      case "dashboard":
        return SHELL_LABELS.nav.dashboard[language];
      case "datasets":
        return SHELL_LABELS.nav.datasets[language];
      case "new-analysis":
        return SHELL_LABELS.nav.newAnalysis[language];
      case "registration":
        return language === "en" ? "Registration" : "पंजीकरण";
      case "login":
        return SHELL_LABELS.nav.signIn[language];
      default:
        return seg;
    }
  };

  return (
    <nav aria-label="Breadcrumb" className="w-full bg-surface-secondary border-b border-border">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-10 flex items-center text-[0.875rem] text-text-muted">
        <Link href="/" className="text-accent hover:underline">
          {SHELL_LABELS.nav.home[language]}
        </Link>
        {segments.map((seg, i) => {
          const isLast = i === segments.length - 1;
          const href = "/" + segments.slice(0, i + 1).join("/");
          return (
            <span key={href} className="flex items-center">
              <span className="mx-2 text-border">›</span>
              {isLast ? (
                <span className="font-bold text-text-primary" aria-current="page">
                  {getSegmentName(seg)}
                </span>
              ) : (
                <Link href={href} className="text-accent hover:underline">
                  {getSegmentName(seg)}
                </Link>
              )}
            </span>
          );
        })}
      </div>
    </nav>
  );
}
