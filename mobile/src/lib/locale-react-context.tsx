'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SupportedLocale,
  initLocale,
  setLocale as setI18nLocale,
  getLocale,
  t as translate,
} from './i18n-localization-service';

const LOCALE_STORAGE_KEY = 'app_locale';

interface LocaleContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => Promise<void>;
  t: (key: string, options?: Record<string, unknown>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>('en');

  useEffect(() => {
    AsyncStorage.getItem(LOCALE_STORAGE_KEY).then((stored) => {
      const resolved = (stored as SupportedLocale | null) ?? null;
      initLocale(resolved ?? undefined);
      setLocaleState(getLocale());
    });
  }, []);

  const setLocale = useCallback(async (newLocale: SupportedLocale) => {
    setI18nLocale(newLocale);
    setLocaleState(newLocale);
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
  }, []);

  // Wrap t() so re-renders pick up the current locale
  const t = useCallback(
    (key: string, options?: Record<string, unknown>) => translate(key, options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
