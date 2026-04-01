'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Locale } from '@/i18n/i18n-config';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/i18n/i18n-config';

const LOCALE_COOKIE = 'nexpo_locale';

function getStoredLocale(): Locale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE;
  const match = document.cookie.match(new RegExp(`${LOCALE_COOKIE}=([^;]+)`));
  const val = match?.[1];
  if (val && (SUPPORTED_LOCALES as readonly string[]).includes(val)) return val as Locale;
  return DEFAULT_LOCALE;
}

function setStoredLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${365 * 24 * 60 * 60};samesite=lax`;
}

/**
 * Hook for cookie-based locale management.
 * Returns current locale and a setter that persists to cookie + reloads.
 */
export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocaleState(getStoredLocale());
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setStoredLocale(newLocale);
    setLocaleState(newLocale);
    window.location.reload();
  }, []);

  return { locale, setLocale };
}
