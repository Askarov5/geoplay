"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { Locale, Translations } from "./types";
import { DEFAULT_LOCALE } from "./types";
import { translations } from "./translations";
import { countryNames } from "./countries";
import { capitalNames } from "./capitals";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: keyof Translations) => string;
  countryName: (code: string) => string;
  capitalName: (code: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const STORAGE_KEY = "geoplay-locale";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Read persisted locale on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (stored && translations[stored]) {
        setLocaleState(stored);
      }
    } catch {
      // localStorage unavailable (SSR, privacy mode)
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: keyof Translations): string => {
      return translations[locale]?.[key] ?? translations.en[key] ?? key;
    },
    [locale]
  );

  const countryName = useCallback(
    (code: string): string => {
      return countryNames[locale]?.[code] ?? countryNames.en?.[code] ?? code;
    },
    [locale]
  );

  const capitalName = useCallback(
    (code: string): string => {
      return capitalNames[locale]?.[code] ?? capitalNames.en?.[code] ?? code;
    },
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, countryName, capitalName }),
    [locale, setLocale, t, countryName, capitalName]
  );

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within a LocaleProvider");
  }
  return ctx;
}
