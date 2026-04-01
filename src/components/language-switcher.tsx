"use client";

import { Globe } from "lucide-react";
import { useLocale } from "@/i18n/use-locale";
import type { Locale } from "@/i18n/i18n-config";

/** Compact language toggle: VI/EN, switches on click, persists in cookie. */
export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  const toggle = () => {
    const next: Locale = locale === "en" ? "vi" : "en";
    setLocale(next);
  };

  const label = locale === "vi" ? "VI" : "EN";
  const ariaLabel = locale === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt";

  return (
    <button
      onClick={toggle}
      aria-label={ariaLabel}
      title={ariaLabel}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold
        text-surface-500 dark:text-surface-400
        hover:text-surface-900 dark:hover:text-white
        hover:bg-surface-100 dark:hover:bg-surface-700/50
        transition-all select-none"
    >
      <Globe size={14} className="shrink-0" />
      <span className="tracking-wider">{label}</span>
    </button>
  );
}
