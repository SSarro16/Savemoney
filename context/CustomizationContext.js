import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "savetime_customization_v1";

const DEFAULTS = {
  compactMode: false,
  largeText: false,
  reduceMotion: false,
};

export const CustomizationContext = createContext({
  ...DEFAULTS,
  ready: false,
  textScale: 1,
  setCompactMode: async (_value) => {},
  setLargeText: async (_value) => {},
  setReduceMotion: async (_value) => {},
});

export function CustomizationContextProvider({ children }) {
  const [prefs, setPrefs] = useState(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;

        if (parsed && isMounted) {
          setPrefs({
            compactMode: Boolean(parsed.compactMode),
            largeText: Boolean(parsed.largeText),
            reduceMotion: Boolean(parsed.reduceMotion),
          });
        }
      } catch {
        if (isMounted) {
          setPrefs(DEFAULTS);
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

  const persist = useCallback(async (nextPrefs) => {
    setPrefs(nextPrefs);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextPrefs));
    } catch {
      // ignore persistence error
    }
  }, []);

  const setCompactMode = useCallback(
    async (value) => {
      await persist({ ...prefs, compactMode: Boolean(value) });
    },
    [persist, prefs],
  );

  const setLargeText = useCallback(
    async (value) => {
      await persist({ ...prefs, largeText: Boolean(value) });
    },
    [persist, prefs],
  );

  const setReduceMotion = useCallback(
    async (value) => {
      await persist({ ...prefs, reduceMotion: Boolean(value) });
    },
    [persist, prefs],
  );

  const value = useMemo(
    () => ({
      ...prefs,
      ready,
      textScale: prefs.largeText ? 1.12 : 1,
      setCompactMode,
      setLargeText,
      setReduceMotion,
    }),
    [prefs, ready, setCompactMode, setLargeText, setReduceMotion],
  );

  return <CustomizationContext.Provider value={value}>{children}</CustomizationContext.Provider>;
}
