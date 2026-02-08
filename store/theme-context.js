import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { THEMES, GlobalStyles, applyTheme } from "../constants/styles";

const STORAGE_KEY = "themeKey_v2";

export const ThemeContext = createContext({
  themeKey: "OCEAN",
  colors: GlobalStyles.colors,
  setThemeKey: async (_key) => {},
  ready: false,
  version: 0, // aumenta per forzare remount NavigationContainer
});

export default function ThemeContextProvider({ children }) {
  const [themeKey, setThemeKeyState] = useState("OCEAN");
  const [ready, setReady] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const key = THEMES[saved] ? saved : "OCEAN";
        setThemeKeyState(key);
        applyTheme(key);
        setVersion((v) => v + 1);
      } catch {
        setThemeKeyState("OCEAN");
        applyTheme("OCEAN");
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setThemeKey = useCallback(async (key) => {
    const safeKey = THEMES[key] ? key : "OCEAN";
    setThemeKeyState(safeKey);
    applyTheme(safeKey);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, safeKey);
    } catch {
      // ignore
    }

    setVersion((v) => v + 1);
  }, []);

  const value = useMemo(
    () => ({
      themeKey,
      colors: GlobalStyles.colors,
      setThemeKey,
      ready,
      version,
    }),
    [themeKey, setThemeKey, ready, version],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
