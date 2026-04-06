'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { MinimalAnimeTitle } from '@/types/anime';

export type TitleLanguage = 'english' | 'romaji';

type TitleLanguageContextValue = {
  titleLanguage: TitleLanguage;
  setTitleLanguage: (v: TitleLanguage) => void;
};

const TitleLanguageContext = createContext<TitleLanguageContextValue | null>(null);

export function TitleLanguageProvider({ children }: { children: ReactNode }) {
  const [titleLanguage, setTitleLanguage] = useState<TitleLanguage>('english');
  const value = useMemo(
    () => ({ titleLanguage, setTitleLanguage }),
    [titleLanguage]
  );
  return (
    <TitleLanguageContext.Provider value={value}>
      {children}
    </TitleLanguageContext.Provider>
  );
}

export function useTitleLanguage() {
  const ctx = useContext(TitleLanguageContext);
  if (!ctx) {
    throw new Error('useTitleLanguage must be used within TitleLanguageProvider');
  }
  return ctx;
}

export function displayTitleForLanguage(
  title: Pick<MinimalAnimeTitle, 'english' | 'romaji'> & { native?: string | null },
  lang: TitleLanguage
): string {
  if (lang === 'romaji') {
    const r = title.romaji?.trim();
    if (r) return r;
    const e = title.english?.trim();
    if (e) return e;
    const n = title.native?.trim();
    if (n) return n;
    return 'Untitled';
  }
  const en = title.english?.trim();
  if (en) return en;
  const ro = title.romaji?.trim();
  if (ro) return ro;
  return 'Untitled';
}
