'use client';

import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next/initReactI18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import i18nConfig, { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/i18n/i18n-config';

const LOCALE_COOKIE = 'nexpo_locale';

/** Read locale from cookie */
function getLocaleFromCookie(): string {
  if (typeof document === 'undefined') return DEFAULT_LOCALE;
  const match = document.cookie.match(new RegExp(`${LOCALE_COOKIE}=([^;]+)`));
  const val = match?.[1];
  if (val && (SUPPORTED_LOCALES as readonly string[]).includes(val)) return val;
  return DEFAULT_LOCALE;
}

/** Singleton i18n instance */
const i18n = createInstance();
let initialized = false;

async function ensureInit(locale: string) {
  if (initialized) {
    if (i18n.language !== locale) await i18n.changeLanguage(locale);
    return;
  }
  i18n.use(initReactI18next);
  i18n.use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`@/i18n/messages/${language}/${namespace}.json`)
    )
  );
  await i18n.init({
    lng: locale,
    fallbackLng: i18nConfig.defaultLocale,
    supportedLngs: i18nConfig.locales,
    defaultNS: 'translation',
    preload: i18nConfig.locales,
    interpolation: { escapeValue: false },
  });
  initialized = true;
}

/**
 * Client-side i18n provider for nexpo-console.
 * Reads locale from cookie, initializes i18next, provides to children.
 */
export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const locale = getLocaleFromCookie();
    ensureInit(locale).then(() => setReady(true));
  }, []);

  if (!ready) return null;

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
