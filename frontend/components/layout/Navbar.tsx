"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePortal } from "@/context/PortalContext";
import { useAuth } from "@/context/AuthContext";
import { SHELL_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const { language } = usePortal();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = isAuthenticated
    ? [
        { href: "/dashboard", label: SHELL_LABELS.nav.dashboard[language] },
        { href: "/datasets", label: SHELL_LABELS.nav.datasets[language] },
        { href: "/new-analysis", label: SHELL_LABELS.nav.newAnalysis[language] },
        { href: "/results", label: SHELL_LABELS.nav.results[language] },
      ]
    : [
        { href: "/", label: language === "en" ? "Institutional Access" : "संस्थागत प्रवेश" },
      ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="w-full bg-navy border-b border-navy-dark" aria-label="Main">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        <div className="h-12 flex items-center justify-between">
          <div className="hidden md:flex items-stretch h-full">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center px-4 text-[1rem] font-bold text-text-on-navy transition-colors relative no-underline",
                    active
                      ? "bg-navy-dark border-b-4 border-saffron text-white"
                      : "hover:bg-accent-dark text-text-on-navy-muted hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="px-3 py-1.5 text-text-on-navy bg-navy-dark border border-border-light rounded-sm font-bold text-[0.875rem] cursor-pointer"
              aria-expanded={mobileMenuOpen}
            >
              ☰ {language === "en" ? "Menu" : "मेनू"}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block text-[0.875rem] text-text-on-navy-muted">
                  {user.name || user.email}
                  <span className="ml-1.5 px-1.5 py-0.5 text-[0.75rem] font-bold uppercase bg-navy-dark border border-border-light/40 text-saffron rounded-sm">
                    {user.role}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="px-3 py-1 text-[0.875rem] font-bold text-text-on-navy bg-navy-dark hover:bg-accent-dark rounded-sm border border-border-light/50 cursor-pointer transition-colors"
                >
                  {SHELL_LABELS.nav.signOut[language]}
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1 text-[0.875rem] font-bold text-text-on-navy bg-accent hover:bg-accent-dark rounded-sm border border-accent-dark no-underline"
              >
                {SHELL_LABELS.nav.signIn[language]}
              </Link>
            )}
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-2 border-t border-navy-dark flex flex-col gap-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "px-4 py-2 text-[1rem] font-bold block no-underline",
                    active
                      ? "bg-navy-dark text-saffron"
                      : "text-text-on-navy hover:bg-accent-dark"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
