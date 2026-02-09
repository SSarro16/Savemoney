import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AuthContext } from "./auth-context";

const STORAGE_PREFIX = "expenseCategories_v1_";
export const DEFAULT_EXPENSE_CATEGORIES = ["Spese", "Risparmio", "Svago"];

export const ExpenseCategoriesContext = createContext({
  categories: DEFAULT_EXPENSE_CATEGORIES,
  ready: false,
  addCategory: async (_name) => "",
  updateCategory: async (_oldName, _nextName) => false,
  removeCategory: async (_name) => false,
});

function storageKey(userId) {
  return `${STORAGE_PREFIX}${String(userId || "anon")}`;
}

function normalizeCategoryName(value) {
  const cleaned = String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^A-Za-z0-9' \-/]/g, "")
    .slice(0, 24);

  if (!cleaned) return "";
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((x) => `${x.charAt(0).toUpperCase()}${x.slice(1)}`)
    .join(" ");
}

function dedupeKeepOrder(list) {
  const seen = new Set();
  const result = [];
  for (const item of list || []) {
    const safe = normalizeCategoryName(item);
    if (!safe) continue;
    const key = safe.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(safe);
  }
  return result;
}

export default function ExpenseCategoriesContextProvider({ children }) {
  const authCtx = useContext(AuthContext);
  const userId = authCtx.userId;
  const [categories, setCategories] = useState(DEFAULT_EXPENSE_CATEGORIES);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      setReady(false);
      if (!userId) {
        if (!isMounted) return;
        setCategories(DEFAULT_EXPENSE_CATEGORIES);
        setReady(true);
        return;
      }

      try {
        const raw = await AsyncStorage.getItem(storageKey(userId));
        const parsed = raw ? JSON.parse(raw) : null;
        const safe = dedupeKeepOrder(Array.isArray(parsed) ? parsed : []);
        if (isMounted) {
          setCategories(safe.length ? safe : DEFAULT_EXPENSE_CATEGORIES);
        }
      } catch {
        if (isMounted) setCategories(DEFAULT_EXPENSE_CATEGORIES);
      } finally {
        if (isMounted) setReady(true);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const persist = useCallback(
    async (next) => {
      if (!userId) return;
      await AsyncStorage.setItem(storageKey(userId), JSON.stringify(next));
    },
    [userId],
  );

  const addCategory = useCallback(
    async (name) => {
      const clean = normalizeCategoryName(name);
      if (!clean) return "";

      const already = categories.find(
        (x) => String(x).toLowerCase() === clean.toLowerCase(),
      );
      if (already) return already;

      const next = dedupeKeepOrder([...categories, clean]).slice(0, 24);
      setCategories(next);
      await persist(next);
      return clean;
    },
    [categories, persist],
  );

  const updateCategory = useCallback(
    async (oldName, nextName) => {
      const oldClean = normalizeCategoryName(oldName);
      const nextClean = normalizeCategoryName(nextName);
      if (!oldClean || !nextClean) return false;

      const oldIndex = categories.findIndex(
        (x) => String(x).toLowerCase() === oldClean.toLowerCase(),
      );
      if (oldIndex < 0) return false;

      const duplicateIndex = categories.findIndex(
        (x) => String(x).toLowerCase() === nextClean.toLowerCase(),
      );
      if (duplicateIndex >= 0 && duplicateIndex !== oldIndex) return false;

      const next = [...categories];
      next[oldIndex] = nextClean;
      const safe = dedupeKeepOrder(next).slice(0, 24);
      setCategories(safe);
      await persist(safe);
      return true;
    },
    [categories, persist],
  );

  const removeCategory = useCallback(
    async (name) => {
      const clean = normalizeCategoryName(name);
      if (!clean) return false;
      if ((categories || []).length <= 1) return false;
      const next = dedupeKeepOrder(
        categories.filter((x) => String(x).toLowerCase() !== clean.toLowerCase()),
      );

      if (next.length === categories.length) return false;
      setCategories(next);
      await persist(next);
      return true;
    },
    [categories, persist],
  );

  const value = useMemo(
    () => ({
      categories,
      ready,
      addCategory,
      updateCategory,
      removeCategory,
    }),
    [categories, ready, addCategory, updateCategory, removeCategory],
  );

  return (
    <ExpenseCategoriesContext.Provider value={value}>
      {children}
    </ExpenseCategoriesContext.Provider>
  );
}
