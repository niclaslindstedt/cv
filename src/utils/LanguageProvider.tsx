import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Language } from "../data/cv.types";
import {
  LANG_STORAGE_KEY,
  LanguageContext,
  UI_STRINGS,
  readInitialLanguage,
  type LanguageContextValue,
} from "./i18n";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(readInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = lang;
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  }, [lang]);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
  }, []);

  const value = useMemo<LanguageContextValue>(() => {
    const ui = UI_STRINGS[lang];
    return {
      lang,
      setLang,
      t: (value) => value[lang] ?? value.en,
      ui,
    };
  }, [lang, setLang]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
