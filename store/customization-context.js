import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "uiPrefs_v2";

const DEFAULT_PREFS = {
  compactMode: false,
  highContrast: false,
  largeText: false,
  reduceMotion: false,
  showCategoryTag: true,
  showPaymentTag: true,
};

export const CustomizationContext = createContext({
  ...DEFAULT_PREFS,
  textScale: 1,
  setCompactMode: async (_v) => {},
  setHighContrast: async (_v) => {},
  setLargeText: async (_v) => {},
  setReduceMotion: async (_v) => {},
  setShowCategoryTag: async (_v) => {},
  setShowPaymentTag: async (_v) => {},
  ready: false,
  version: 0,
});

export default function CustomizationContextProvider({ children }) {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [ready, setReady] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed && typeof parsed === "object") {
          setPrefs({
            compactMode: !!parsed.compactMode,
            highContrast: !!parsed.highContrast,
            largeText: !!parsed.largeText,
            reduceMotion: !!parsed.reduceMotion,
            showCategoryTag:
              parsed.showCategoryTag !== undefined
                ? !!parsed.showCategoryTag
                : true,
            showPaymentTag:
              parsed.showPaymentTag !== undefined
                ? !!parsed.showPaymentTag
                : true,
          });
        }
      } catch {
        // ignore
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const persist = useCallback(async (next) => {
    setPrefs(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    setVersion((v) => v + 1);
  }, []);

  const setCompactMode = useCallback(
    async (v) => {
      const next = { ...prefs, compactMode: !!v };
      await persist(next);
    },
    [prefs, persist],
  );

  const setHighContrast = useCallback(
    async (v) => {
      const next = { ...prefs, highContrast: !!v };
      await persist(next);
    },
    [prefs, persist],
  );

  const setLargeText = useCallback(
    async (v) => {
      const next = { ...prefs, largeText: !!v };
      await persist(next);
    },
    [prefs, persist],
  );

  const setReduceMotion = useCallback(
    async (v) => {
      const next = { ...prefs, reduceMotion: !!v };
      await persist(next);
    },
    [prefs, persist],
  );

  const setShowCategoryTag = useCallback(
    async (v) => {
      const next = { ...prefs, showCategoryTag: !!v };
      await persist(next);
    },
    [prefs, persist],
  );

  const setShowPaymentTag = useCallback(
    async (v) => {
      const next = { ...prefs, showPaymentTag: !!v };
      await persist(next);
    },
    [prefs, persist],
  );

  const value = useMemo(
    () => ({
      ...prefs,
      textScale: prefs.largeText ? 1.12 : 1,
      setCompactMode,
      setHighContrast,
      setLargeText,
      setReduceMotion,
      setShowCategoryTag,
      setShowPaymentTag,
      ready,
      version,
    }),
    [
      prefs,
      setCompactMode,
      setHighContrast,
      setLargeText,
      setReduceMotion,
      setShowCategoryTag,
      setShowPaymentTag,
      ready,
      version,
    ],
  );

  return (
    <CustomizationContext.Provider value={value}>
      {children}
    </CustomizationContext.Provider>
  );
}
