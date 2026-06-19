import { I18n } from 'i18n-js';
import * as ExpoLocalization from 'expo-localization';
import { en } from './i18n-translations-en';
import { vi } from './i18n-translations-vi';

export type SupportedLocale = 'en' | 'vi';
export const SUPPORTED_LOCALES: SupportedLocale[] = ['en', 'vi'];

const i18n = new I18n({ en, vi });

i18n.enableFallback = true;
i18n.defaultLocale = 'en';

function detectLocale(): SupportedLocale {
  const deviceLocale = ExpoLocalization.getLocales()[0]?.languageCode ?? 'en';
  return SUPPORTED_LOCALES.includes(deviceLocale as SupportedLocale)
    ? (deviceLocale as SupportedLocale)
    : 'en';
}

export function initLocale(override?: SupportedLocale) {
  i18n.locale = override ?? detectLocale();
}

export function setLocale(locale: SupportedLocale) {
  i18n.locale = locale;
}

export function getLocale(): SupportedLocale {
  return (i18n.locale as SupportedLocale) ?? 'en';
}

export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}
