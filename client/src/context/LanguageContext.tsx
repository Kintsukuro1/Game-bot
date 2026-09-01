import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { translations, type Language, type TranslationDictionary } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof TranslationDictionary) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'es',
  setLanguage: () => {},
  t: (key) => translations.es[key] || String(key),
});

export function detectDiscordLanguage(): Language {
  try {
    const navLang = (navigator?.language || 'es').toLowerCase();

    if (navLang.startsWith('en')) return 'en';
    if (navLang.startsWith('pt')) return 'pt';
    if (navLang.startsWith('fr')) return 'fr';
    if (navLang.startsWith('de')) return 'de';
    if (navLang.startsWith('es')) return 'es';
  } catch (e) {
    console.warn('Language detection fallback:', e);
  }

  return 'es';
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('app_user_language') as Language;
      if (saved && ['es', 'en', 'pt', 'fr', 'de'].includes(saved)) {
        return saved;
      }
    } catch (e) {
      console.warn('localStorage read error:', e);
    }
    return detectDiscordLanguage();
  });

  useEffect(() => {
    try {
      localStorage.setItem('app_user_language', language);
    } catch (e) {
      console.warn('localStorage write error:', e);
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: keyof TranslationDictionary): string => {
    try {
      const dict = translations[language] || translations.es;
      return dict[key] || translations.es[key] || String(key);
    } catch (e) {
      return translations.es[key] || String(key);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'es',
      setLanguage: () => {},
      t: (key) => translations.es[key] || String(key),
    };
  }
  return context;
};
