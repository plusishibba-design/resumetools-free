import React, { createContext, useContext, useState, useEffect } from 'react';
import translations from './i18n';

const LANG_KEY = 'careertools-lang';
const LEGACY_LANG_KEY = 'resumetools-lang';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    // Migrate legacy resumetools-lang into careertools-lang
    let saved = localStorage.getItem(LANG_KEY);
    if (!saved) {
      const legacy = localStorage.getItem(LEGACY_LANG_KEY);
      if (legacy) {
        saved = legacy;
        localStorage.setItem(LANG_KEY, legacy);
      }
    }
    if (saved) return saved;
    const browserLang = (navigator.language || '').toLowerCase();
    if (browserLang.startsWith('ja')) return 'ja';
    if (browserLang.startsWith('vi')) return 'vi';
    if (browserLang.startsWith('id') || browserLang.startsWith('ms')) return 'id';
    if (browserLang.startsWith('zh')) return 'zh';
    return 'en';
  });

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key, ...args) => {
    const str = translations[lang]?.[key] || translations.en?.[key] || translations.ja?.[key] || key;
    if (args.length === 0) return str;
    return str.replace(/\{(\d+)\}/g, (_, i) => args[Number(i)] ?? '');
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
