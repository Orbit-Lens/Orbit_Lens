"use client";

import React, { createContext, useContext, useSyncExternalStore } from "react";
import { Language } from "@/lib/constants";

type TextSize = "sm" | "normal" | "lg";

type PortalContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  isHighContrast: boolean;
  toggleHighContrast: () => void;
};

const PortalContext = createContext<PortalContextType | undefined>(undefined);

let currentLanguage: Language = "en";
let currentTextSize: TextSize = "normal";
let currentContrast = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot() {
  return `${currentLanguage}:${currentTextSize}:${currentContrast}`;
}

function getServerSnapshot() {
  return "en:normal:false";
}

function applyDomUpdates() {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("lang", currentLanguage);
  if (currentTextSize === "sm") {
    document.documentElement.setAttribute("data-text-size", "sm");
  } else if (currentTextSize === "lg") {
    document.documentElement.setAttribute("data-text-size", "lg");
  } else {
    document.documentElement.removeAttribute("data-text-size");
  }

  if (currentContrast) {
    document.documentElement.setAttribute("data-theme", "contrast");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

if (typeof window !== "undefined") {
  try {
    const savedLang = localStorage.getItem("orbitlens_lang") as Language;
    if (savedLang === "en" || savedLang === "hi") {
      currentLanguage = savedLang;
    }
    const savedSize = localStorage.getItem("orbitlens_text_size") as TextSize;
    if (savedSize === "sm" || savedSize === "normal" || savedSize === "lg") {
      currentTextSize = savedSize;
    }
    const savedContrast = localStorage.getItem("orbitlens_contrast") === "true";
    if (savedContrast) {
      currentContrast = true;
    }
    applyDomUpdates();
  } catch {
    // LocalStorage blocked
  }
}

export function PortalProvider({ children }: { children: React.ReactNode }) {
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLanguage = (lang: Language) => {
    currentLanguage = lang;
    try {
      localStorage.setItem("orbitlens_lang", lang);
    } catch {}
    applyDomUpdates();
    notify();
  };

  const setTextSize = (size: TextSize) => {
    currentTextSize = size;
    try {
      localStorage.setItem("orbitlens_text_size", size);
    } catch {}
    applyDomUpdates();
    notify();
  };

  const toggleHighContrast = () => {
    currentContrast = !currentContrast;
    try {
      localStorage.setItem("orbitlens_contrast", String(currentContrast));
    } catch {}
    applyDomUpdates();
    notify();
  };

  return (
    <PortalContext.Provider
      value={{
        language: currentLanguage,
        setLanguage,
        textSize: currentTextSize,
        setTextSize,
        isHighContrast: currentContrast,
        toggleHighContrast,
      }}
    >
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error("usePortal must be used within a PortalProvider");
  }
  return context;
}
