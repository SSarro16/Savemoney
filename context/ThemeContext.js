import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { GlobalStyles, THEMES, applyTheme } from "../constants/styles";

const STORAGE_KEY = "savetime_theme_key_v1";
const DEFAULT_THEME = "OCEAN";

export const ThemeContext = createContext({
  themeKey: DEFAULT_THEME,
  colors: GlobalStyles.colors,
  ready: false,
  version: 0,
  setThemeKey: async (_key) => {},
});

export function ThemeContextProvider({ children }) {
  const [themeKey, setThemeKeyState] = useState(DEFAULT_THEME);
  const [ready, setReady] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const safeKey = THEMES[saved] ? saved : DEFAULT_THEME;
        applyTheme(safeKey);
        if (isMounted) {
          setThemeKeyState(safeKey);
          setVersion((value) => value + 1);
        }
      } catch {
        applyTheme(DEFAULT_THEME);
        if (isMounted) {
          setThemeKeyState(DEFAULT_THEME);
          setVersion((value) => value + 1);
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

  const setThemeKey = useCallback(async (nextKey) => {
    const safeKey = THEMES[nextKey] ? nextKey : DEFAULT_THEME;

    setThemeKeyState(safeKey);
    applyTheme(safeKey);
    setVersion((value) => value + 1);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, safeKey);
    } catch {
      // ignore persistence error
    }
  }, []);

  const value = useMemo(
    () => ({
      themeKey,
      colors: GlobalStyles.colors,
      ready,
      version,
      setThemeKey,
    }),
    [themeKey, ready, version, setThemeKey],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
