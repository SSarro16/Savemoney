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
  recurringRemindersEnabled: false,
  recurringReminderHour: 9,
  budgetAlertsEnabled: false,
  budgetAlertAt80: true,
  budgetAlertAt100: true,
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
  setRecurringRemindersEnabled: async (_v) => {},
  setRecurringReminderHour: async (_v) => {},
  setBudgetAlertsEnabled: async (_v) => {},
  setBudgetAlertAt80: async (_v) => {},
  setBudgetAlertAt100: async (_v) => {},
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
            recurringRemindersEnabled: !!parsed.recurringRemindersEnabled,
            recurringReminderHour: Number.isFinite(Number(parsed.recurringReminderHour))
              ? Math.min(23, Math.max(0, Number(parsed.recurringReminderHour)))
              : 9,
            budgetAlertsEnabled: !!parsed.budgetAlertsEnabled,
            budgetAlertAt80:
              parsed.budgetAlertAt80 !== undefined ? !!parsed.budgetAlertAt80 : true,
            budgetAlertAt100:
              parsed.budgetAlertAt100 !== undefined ? !!parsed.budgetAlertAt100 : true,
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

  const setRecurringRemindersEnabled = useCallback(
    async (v) => {
      const next = { ...prefs, recurringRemindersEnabled: !!v };
      await persist(next);
    },
    [prefs, persist],
  );

  const setRecurringReminderHour = useCallback(
    async (v) => {
      const numeric = Math.min(23, Math.max(0, Math.round(Number(v) || 0)));
      const next = { ...prefs, recurringReminderHour: numeric };
      await persist(next);
    },
    [prefs, persist],
  );

  const setBudgetAlertsEnabled = useCallback(
    async (v) => {
      const next = { ...prefs, budgetAlertsEnabled: !!v };
      await persist(next);
    },
    [prefs, persist],
  );

  const setBudgetAlertAt80 = useCallback(
    async (v) => {
      const next = { ...prefs, budgetAlertAt80: !!v };
      await persist(next);
    },
    [prefs, persist],
  );

  const setBudgetAlertAt100 = useCallback(
    async (v) => {
      const next = { ...prefs, budgetAlertAt100: !!v };
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
      setRecurringRemindersEnabled,
      setRecurringReminderHour,
      setBudgetAlertsEnabled,
      setBudgetAlertAt80,
      setBudgetAlertAt100,
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
      setRecurringRemindersEnabled,
      setRecurringReminderHour,
      setBudgetAlertsEnabled,
      setBudgetAlertAt80,
      setBudgetAlertAt100,
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
