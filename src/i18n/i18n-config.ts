/**
 * Shared i18n configuration for nexpo-console.
 * Vietnamese default, English supported.
 */
export const SUPPORTED_LOCALES = ['vi', 'en'] as const;
export const DEFAULT_LOCALE = 'vi';

export type Locale = (typeof SUPPORTED_LOCALES)[number];

const i18nConfig = {
  locales: [...SUPPORTED_LOCALES],
  defaultLocale: DEFAULT_LOCALE,
};

export default i18nConfig;
