import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import it from "../localization/translations/it.json";
import en from "../localization/translations/en.json";

const STORAGE_KEY = "appLanguage_v1";
const DEFAULT_LANGUAGE = "it";

const TRANSLATIONS = {
  it,
  en,
};

const LOCALE_MAP = {
  it: "it-IT",
  en: "en-US",
};

let activeLanguage = DEFAULT_LANGUAGE;

function getByPath(obj, path) {
  if (!obj || !path) return undefined;
  return String(path)
    .split(".")
    .reduce((acc, key) => {
      if (acc && Object.prototype.hasOwnProperty.call(acc, key)) {
        return acc[key];
      }
      return undefined;
    }, obj);
}

function interpolate(template, params) {
  const safeParams = params && typeof params === "object" ? params : {};
  return String(template).replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key) => {
    if (safeParams[key] === undefined || safeParams[key] === null) {
      return "";
    }
    return String(safeParams[key]);
  });
}

function resolveTranslation(language, key, params) {
  const activeBundle = TRANSLATIONS[language] || TRANSLATIONS[DEFAULT_LANGUAGE];
  const fallbackBundle = TRANSLATIONS[DEFAULT_LANGUAGE];

  const match = getByPath(activeBundle, key);
  if (typeof match === "string") {
    return interpolate(match, params);
  }

  const fallback = getByPath(fallbackBundle, key);
  if (typeof fallback === "string") {
    return interpolate(fallback, params);
  }

  return key;
}

export const LanguageContext = createContext({
  language: DEFAULT_LANGUAGE,
  localeTag: LOCALE_MAP[DEFAULT_LANGUAGE],
  setLanguage: async (_language) => {},
  t: (key, _params) => key,
  ready: false,
  version: 0,
});

export default function LanguageContextProvider({ children }) {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);
  const [ready, setReady] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const safeLanguage = TRANSLATIONS[saved] ? saved : DEFAULT_LANGUAGE;
        activeLanguage = safeLanguage;
        setLanguageState(safeLanguage);
      } catch {
        activeLanguage = DEFAULT_LANGUAGE;
        setLanguageState(DEFAULT_LANGUAGE);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setLanguage = useCallback(async (nextLanguage) => {
    const safeLanguage = TRANSLATIONS[nextLanguage] ? nextLanguage : DEFAULT_LANGUAGE;
    activeLanguage = safeLanguage;
    setLanguageState(safeLanguage);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, safeLanguage);
    } catch {
      // ignore persistence error
    }

    setVersion((current) => current + 1);
  }, []);

  const t = useCallback(
    (key, params) => resolveTranslation(language, key, params),
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      localeTag: LOCALE_MAP[language] || LOCALE_MAP[DEFAULT_LANGUAGE],
      setLanguage,
      t,
      ready,
      version,
    }),
    [language, setLanguage, t, ready, version],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}

export function translateWithLanguage(language, key, params) {
  return resolveTranslation(language, key, params);
}

export function isSupportedLanguage(language) {
  return Boolean(TRANSLATIONS[language]);
}

export function getCurrentLanguage() {
  return activeLanguage;
}

export function getCurrentLocaleTag() {
  return LOCALE_MAP[activeLanguage] || LOCALE_MAP[DEFAULT_LANGUAGE];
}
