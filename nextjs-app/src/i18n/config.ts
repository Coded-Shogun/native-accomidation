/**
 * i18n Configuration
 * Internationalization setup with next-intl
 */

export const locales = ['en', 'af', 'zu', 'xh'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  af: 'Afrikaans',
  zu: 'isiZulu',
  xh: 'isiXhosa',
};

export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  af: '🇿🇦',
  zu: '🇿🇦',
  xh: '🇿🇦',
};
