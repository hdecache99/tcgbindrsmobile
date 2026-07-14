import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from './translations';

const STORAGE_KEY = 'tcgbindrs_lang';

const LanguageContext = createContext({ language: 'es', setLanguage: () => {}, t: (key) => key });

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('es');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'es' || saved === 'en') setLanguageState(saved);
    });
  }, []);

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang);
    AsyncStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const t = useCallback((key) => translations[language]?.[key] || translations.es[key] || key, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
