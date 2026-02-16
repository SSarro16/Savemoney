import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "../localization/translations/en.json";
import it from "../localization/translations/it.json";

const STORAGE_KEY = "savetime_language_v1";
const DEFAULT_LANGUAGE = "it";

const TRANSLATIONS = {
  en,
  it,
};

function getByPath(obj, path) {
  return String(path)
    .split(".")
    .reduce((acc, key) => {
      if (acc && Object.prototype.hasOwnProperty.call(acc, key)) {
        return acc[key];
      }
      return undefined;
    }, obj);
}

function interpolate(input, params) {
  const safeParams = params && typeof params === "object" ? params : {};
  return String(input).replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key) => {
    if (safeParams[key] === undefined || safeParams[key] === null) {
      return "";
    }
    return String(safeParams[key]);
  });
}

function resolveText(language, key, params) {
  const active = TRANSLATIONS[language] || TRANSLATIONS[DEFAULT_LANGUAGE];
  const fallback = TRANSLATIONS[DEFAULT_LANGUAGE];

  const activeMatch = getByPath(active, key);
  if (typeof activeMatch === "string") {
    return interpolate(activeMatch, params);
  }

  const fallbackMatch = getByPath(fallback, key);
  if (typeof fallbackMatch === "string") {
    return interpolate(fallbackMatch, params);
  }

  return key;
}

export const LanguageContext = createContext({
  language: DEFAULT_LANGUAGE,
  ready: false,
  setLanguage: async (_language) => {},
  t: (key, _params) => key,
});

export function LanguageContextProvider({ children }) {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (isMounted) {
          setLanguageState(TRANSLATIONS[saved] ? saved : DEFAULT_LANGUAGE);
        }
      } catch {
        if (isMounted) {
          setLanguageState(DEFAULT_LANGUAGE);
        }
      } finally {
        if (isMounted) {
          setReady(true);
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const setLanguage = useCallback(async (nextLanguage) => {
    const safeLanguage = TRANSLATIONS[nextLanguage] ? nextLanguage : DEFAULT_LANGUAGE;
    setLanguageState(safeLanguage);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, safeLanguage);
    } catch {
      // ignore persistence error
    }
  }, []);

  const t = useCallback((key, params) => resolveText(language, key, params), [language]);

  const value = useMemo(
    () => ({
      language,
      ready,
      setLanguage,
      t,
    }),
    [language, ready, setLanguage, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  return useContext(LanguageContext);
}
