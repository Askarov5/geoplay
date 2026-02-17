"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { getAllCountryNames, resolveCountryCode } from "@/data/countries";
import { getNeighbors } from "@/lib/graph";
import { useTranslation } from "@/lib/i18n/context";

interface CountryInputProps {
  onSubmit: (countryName: string) => void;
  currentPosition: string; // ISO code
  disabled?: boolean;
  feedbackState?: "correct" | "wrong" | null;
}

export function CountryInput({
  onSubmit,
  currentPosition,
  disabled = false,
  feedbackState,
}: CountryInputProps) {
  const { t, locale } = useTranslation();
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const allNames = useRef<string[]>(getAllCountryNames(locale));

  // Update names when locale changes
  useEffect(() => {
    allNames.current = getAllCountryNames(locale);
  }, [locale]);

  // Focus input on mount and when re-enabled
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  // Clear input after feedback
  useEffect(() => {
    if (feedbackState === "correct") {
      setValue("");
      setSuggestions([]);
    }
  }, [feedbackState]);

  const filterSuggestions = useCallback(
    (input: string) => {
      if (input.length < 1) {
        setSuggestions([]);
        return;
      }
      const lower = input.toLowerCase();
      const filtered = allNames.current
        .filter((name) => name.toLowerCase().includes(lower))
        .sort((a, b) => {
          // Prioritize names that start with the input
          const aStarts = a.toLowerCase().startsWith(lower);
          const bStarts = b.toLowerCase().startsWith(lower);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;

          // Then prioritize neighbors of current position
          const aCode = resolveCountryCode(a, locale);
          const bCode = resolveCountryCode(b, locale);
          const neighbors = getNeighbors(currentPosition);
          const aIsNeighbor = aCode ? neighbors.includes(aCode) : false;
          const bIsNeighbor = bCode ? neighbors.includes(bCode) : false;
          if (aIsNeighbor && !bIsNeighbor) return -1;
          if (!aIsNeighbor && bIsNeighbor) return 1;

          return a.localeCompare(b);
        })
        .slice(0, 6);
      setSuggestions(filtered);
      setSelectedIndex(-1);
    },
    [currentPosition, locale]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue(val);
    filterSuggestions(val);
    setShowSuggestions(true);
  };

  const handleSubmit = (name?: string) => {
    const toSubmit = name || value;
    if (toSubmit.trim()) {
      onSubmit(toSubmit.trim());
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSubmit(suggestions[selectedIndex]);
      } else if (suggestions.length > 0 && showSuggestions) {
        handleSubmit(suggestions[0]);
      } else {
        handleSubmit();
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const feedbackClass =
    feedbackState === "correct"
      ? "animate-pulse-green border-[#22c55e]"
      : feedbackState === "wrong"
        ? "animate-shake border-[#ef4444]"
        : "border-[#334155] focus-within:border-[#3b82f6]";

  return (
    <div className="relative w-full max-w-md">
      <div
        className={`flex items-center gap-2 bg-[#111827] border-2 rounded-xl px-3 py-2 sm:px-4 sm:py-3 transition-colors ${feedbackClass}`}
      >
        <svg
          className="w-5 h-5 text-[#94a3b8] shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          disabled={disabled}
          placeholder={t("execution.typePlaceholder")}
          className="flex-1 bg-transparent text-[#f1f5f9] text-lg outline-none placeholder:text-[#475569] disabled:opacity-50"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          onClick={() => handleSubmit()}
          disabled={disabled || !value.trim()}
          className="bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-30 disabled:hover:bg-[#3b82f6] text-white px-3 py-1 rounded-lg text-sm font-semibold transition-colors"
        >
          {t("common.go")}
        </button>
      </div>

      {/* Autocomplete dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#111827] border border-[#334155] rounded-xl overflow-hidden shadow-xl">
          {suggestions.map((name, i) => {
            const code = resolveCountryCode(name, locale);
            const isNeighbor = code
              ? getNeighbors(currentPosition).includes(code)
              : false;

            return (
              <button
                key={name}
                className={`autocomplete-item w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${
                  i === selectedIndex
                    ? "bg-[#1e293b] text-white"
                    : "text-[#cbd5e1] hover:bg-[#1e293b]"
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSubmit(name);
                }}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <span>{name}</span>
                {isNeighbor && (
                  <span className="text-xs bg-[#22c55e]/20 text-[#22c55e] px-2 py-0.5 rounded-full">
                    {t("execution.neighbor")}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
