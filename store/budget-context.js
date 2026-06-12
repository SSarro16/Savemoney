import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";

import { AuthContext } from "./auth-context";
import { ExpenseCategoriesContext } from "./expense-categories-context";
import {
  createStoredBudget,
  loadActiveBudgetId,
  loadBudgetById,
  loadBudgets,
  saveActiveBudgetId,
  saveStoredBudget,
} from "../util/budget/budget-service";
import { logger } from "../util/logger";
import { withFirebaseAuthRetry } from "../util/firebase-api-client";

const DEFAULT_CATEGORY_NAMES = ["Risparmio", "Spese", "Svago"];

function normalizeCategoryName(value) {
  const clean = String(value || "").trim();
  return clean ? clean : "";
}

function buildCategories(baseNames, source = {}) {
  const names = Array.isArray(baseNames) && baseNames.length
    ? baseNames
    : DEFAULT_CATEGORY_NAMES;

  const seen = new Set();
  const ordered = [];
  for (const raw of names) {
    const name = normalizeCategoryName(raw);
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    ordered.push(name);
  }

  for (const raw of Object.keys(source || {})) {
    const name = normalizeCategoryName(raw);
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    ordered.push(name);
  }

  const next = {};
  for (const name of ordered) {
    next[name] = Number(source?.[name] || 0);
  }
  return next;
}

export const BudgetContext = createContext({
  budgetId: null,
  budgets: [],
  activeBudgetMeta: null,

  total: 0,
  categories: buildCategories(DEFAULT_CATEGORY_NAMES),
  cashBalance: 0,

  setTotal: (val) => {},
  updateCategory: (cat, val) => {},
  setCashBalance: (val) => {},
  addCashDelta: (delta) => {},

  resetBudget: () => {},
  formatEuro: (val) => "0.00€",

  refreshBudgetsList: async () => {},
  selectBudget: async (id) => {},
  createNewBudget: async (name) => {},

  saveBudget: async (_patch) => {},
  loadBudget: async () => {},
});

function BudgetContextProvider({ children }) {
  const authCtx = useContext(AuthContext);
  const categoriesCtx = useContext(ExpenseCategoriesContext);
  const userId = authCtx.userId;
  const token = authCtx.token;
  const refreshSession = authCtx.refreshSession;
  const refreshSessionRef = useRef(refreshSession);

  const [budgets, setBudgets] = useState([]);
  const [budgetId, setBudgetId] = useState(null);

  const [total, setTotalState] = useState(0);
  const [categories, setCategories] = useState(
    buildCategories(categoriesCtx?.categories),
  );
  const [cashBalance, setCashBalanceState] = useState(0);

  const ensureAuth = useCallback(() => {
    if (!userId || !token) {
      throw new Error("Auth non disponibile (token/userId mancanti).");
    }
  }, [userId, token]);

  useEffect(() => {
    refreshSessionRef.current = refreshSession;
  }, [refreshSession]);

  const withAuthRetry = useCallback(
    async (request) => {
      return await withFirebaseAuthRetry(request, {
        token,
        refreshSession: refreshSessionRef.current,
      });
    },
    [token],
  );

  const refreshBudgetsList = useCallback(async () => {
    ensureAuth();
    const list = await loadBudgets(userId, withAuthRetry);
    setBudgets(list);
    return list;
  }, [ensureAuth, userId, withAuthRetry]);

  const selectBudget = useCallback(
    async (id) => {
      if (!id) return;
      await saveActiveBudgetId(id, userId);
      setBudgetId(id);
    },
    [setBudgetId, userId],
  );

  const createNewBudget = useCallback(
    async (name) => {
      const b = await createStoredBudget(userId, withAuthRetry, name);
      const list = await refreshBudgetsList();
      setBudgets(list);
      setBudgetId(b.id);
      return b;
    },
    [refreshBudgetsList, userId, withAuthRetry],
  );

  const setTotal = useCallback((val) => {
    setTotalState(Number(val) || 0);
  }, []);

  const updateCategory = useCallback((cat, val) => {
    setCategories((prev) => ({
      ...prev,
      [cat]: Number(val) || 0,
    }));
  }, []);

  const setCashBalance = useCallback((val) => {
    setCashBalanceState(Number(val) || 0);
  }, []);

  const addCashDelta = useCallback((delta) => {
    const n = Number(delta) || 0;
    setCashBalanceState((prev) => (Number(prev) || 0) + n);
  }, []);

  const resetBudget = useCallback(() => {
    setTotalState(0);
    setCategories(buildCategories(categoriesCtx?.categories));
    setCashBalanceState(0);
  }, [categoriesCtx?.categories]);

  const formatEuro = useCallback((val) => {
    return (Number(val) || 0).toFixed(2) + "€";
  }, []);

  const saveBudget = useCallback(
    async (patch = null) => {
      ensureAuth();
      const patchTitle = String(patch?.title || "").trim();
      let targetBudgetId = budgetId;
      if (!targetBudgetId) {
        const hasUserPatch = !!patch && Object.keys(patch || {}).length > 0;
        if (!hasUserPatch) return;
        const created = await createNewBudget(patchTitle || "Nuovo budget");
        targetBudgetId = created?.id || null;
      }
      if (!targetBudgetId) throw new Error("Nessun budget selezionato.");

      const nextTotal =
        patch && Object.prototype.hasOwnProperty.call(patch, "total")
          ? Number(patch.total) || 0
          : Number(total) || 0;

      const nextCategories = {
        ...buildCategories(
          categoriesCtx?.categories,
          patch?.categories || categories || {},
        ),
      };
      Object.keys(nextCategories).forEach((k) => {
        nextCategories[k] = Number(nextCategories[k] || 0);
      });

      const nextCashBalance =
        patch && Object.prototype.hasOwnProperty.call(patch, "cashBalance")
          ? Number(patch.cashBalance) || 0
          : Number(cashBalance) || 0;

      let meta = budgets.find((b) => b.id === targetBudgetId) || null;
      if (!meta) {
        meta = await loadBudgetById(userId, withAuthRetry, targetBudgetId);
      }

      const next = await saveStoredBudget(userId, withAuthRetry, {
        id: targetBudgetId,
        title: patchTitle || String(meta?.title || meta?.name || "Nuovo budget"),
        total: nextTotal,
        categories: nextCategories,
        cashBalance: nextCashBalance,
        createdAt: meta?.createdAt,
      });
      setTotalState(nextTotal);
      setCategories(nextCategories);
      setCashBalanceState(nextCashBalance);
      setBudgets(next);
      setBudgetId(targetBudgetId);
    },
    [
      ensureAuth,
      userId,
      budgetId,
      total,
      categories,
      categoriesCtx?.categories,
      cashBalance,
      budgets,
      createNewBudget,
      withAuthRetry,
    ],
  );

  const loadBudget = useCallback(async () => {
    ensureAuth();
    if (!budgetId) return;

    const data =
      (await loadBudgetById(userId, withAuthRetry, budgetId)) ||
      budgets.find((b) => b.id === budgetId);
    if (!data) return;

    setTotalState(Number(data?.total || 0));
    setCategories(buildCategories(categoriesCtx?.categories, data?.categories || {}));
    setCashBalanceState(Number(data?.cashBalance || 0));
  }, [ensureAuth, userId, budgetId, budgets, categoriesCtx?.categories, withAuthRetry]);

  useEffect(() => {
    setCategories((prev) => buildCategories(categoriesCtx?.categories, prev));
  }, [categoriesCtx?.categories]);

  // bootstrap budgets list + active id
  useEffect(() => {
    let isMounted = true;

    (async () => {
      if (!userId || !token) return;

      const list = await loadBudgets(userId, withAuthRetry);
      if (!isMounted) return;
      setBudgets(list);
      const storedActiveId = await loadActiveBudgetId(userId);
      const hasStored = list.some(
        (budget) => String(budget?.id || "") === String(storedActiveId || ""),
      );
      const active = hasStored ? storedActiveId : list?.[0]?.id || null;

      if (!isMounted) return;

      setBudgetId(active || null);
    })();

    return () => {
      isMounted = false;
    };
  }, [userId, token, withAuthRetry]);

  // load budget when budgetId ready
  useEffect(() => {
    if (!userId || !token) return;
    if (!budgetId) return;

    let isMounted = true;
    (async () => {
      try {
        await loadBudget();
      } catch (err) {
        if (isMounted) logger.warn("Errore fetch budget", err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [userId, token, budgetId, loadBudget]);

  const activeBudgetMeta = useMemo(() => {
    return budgets.find((b) => b.id === budgetId) || null;
  }, [budgets, budgetId]);

  const value = useMemo(
    () => ({
      budgetId,
      budgets,
      activeBudgetMeta,

      total,
      categories,
      cashBalance,

      setTotal,
      updateCategory,
      setCashBalance,
      addCashDelta,

      resetBudget,
      formatEuro,

      refreshBudgetsList,
      selectBudget,
      createNewBudget,

      saveBudget,
      loadBudget,
    }),
    [
      budgetId,
      budgets,
      activeBudgetMeta,
      total,
      categories,
      cashBalance,
      setTotal,
      updateCategory,
      setCashBalance,
      addCashDelta,
      resetBudget,
      formatEuro,
      refreshBudgetsList,
      selectBudget,
      createNewBudget,
      saveBudget,
      loadBudget,
    ],
  );

  return (
    <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
  );
}

export default BudgetContextProvider;
