"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = "vi" | "en";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (vi: string, en: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "vi",
  setLang: () => {},
  toggleLang: () => {},
  t: (vi) => vi,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("vi");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("signlight_lang") as Language | null;
      if (saved === "vi" || saved === "en") {
        setLangState(saved);
        document.documentElement.lang = saved;
      }
    } catch {
      // localStorage may not be accessible in some browser private modes
    }
  }, []);

  const setLang = (nextLang: Language) => {
    setLangState(nextLang);
    try {
      localStorage.setItem("signlight_lang", nextLang);
      document.documentElement.lang = nextLang;
    } catch {
      // ignore
    }
  };

  const toggleLang = () => {
    setLang(lang === "vi" ? "en" : "vi");
  };

  const t = (vi: string, en: string) => (lang === "vi" ? vi : en);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
