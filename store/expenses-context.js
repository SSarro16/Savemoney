import {
  createContext,
  useReducer,
  useContext,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useState,
} from "react";

import { AuthContext } from "./auth-context";
import { BudgetContext } from "./budget-context";
import { PaymentContext } from "./payment-context";

import {
  fetchExpenses,
  storeExpense,
  updateExpense,
  deleteExpense,
  patchExpense,
  upsertExpenseById,
} from "../util/http";

import {
  normalizeExpense,
  normalizeIcon,
  isEmoji,
  isValidIonicon,
  getCategoryFromIcon,
} from "../util/expenses/expense-normalize";

import { PAYMENT_METHOD } from "../util/expenses/expense-presets";

export const ExpensesContext = createContext({
  expenses: [],
  addExpense: async (_expenseData) => {},
  updateExpense: async (_id, _expenseData) => {},
  deleteExpense: async (_id) => {},
  fetchAndSetExpenses: async () => {},
  deleteExpenseWithUndo: async (_id, _delayMs) => {},
  undoLastDelete: () => {},
  undoDelete: () => {},
  canUndo: false,
});

function isAuthHttpError(error) {
  const status = Number(error?.response?.status || 0);
  return status === 401 || status === 403;
}

function sortByDateDesc(list) {
  return [...(list || [])].sort((a, b) => {
    const ta = a?.date instanceof Date ? a.date.getTime() : new Date(a?.date).getTime();
    const tb = b?.date instanceof Date ? b.date.getTime() : new Date(b?.date).getTime();
    return (tb || 0) - (ta || 0);
  });
}

function expensesReducer(state, action) {
  switch (action.type) {
    case "ADD":
      return sortByDateDesc([action.payload, ...state]);
    case "SET":
      return sortByDateDesc(action.payload);
    case "UPDATE": {
      const index = state.findIndex((e) => e.id === action.payload.id);
      if (index < 0) return state;
      const updated = [...state];
      updated[index] = { ...updated[index], ...action.payload.data };
      return sortByDateDesc(updated);
    }
    case "DELETE":
      return state.filter((e) => e.id !== action.payload);
    default:
      return state;
  }
}

function safeCategoryFromInput(expenseData, fixedIcon) {
  if (typeof expenseData?.category === "string") {
    const c = expenseData.category.trim();
    if (c) return c;
  }
  return getCategoryFromIcon(fixedIcon);
}

function safeAmount(input) {
  const n = Number(input);
  return Number.isFinite(n) ? n : 0;
}

function safePayMethod(input) {
  if (input === PAYMENT_METHOD.CARD) return PAYMENT_METHOD.CARD;
  return PAYMENT_METHOD.CASH;
}

function safeMethodId(expenseData, methodType, defaultCashWalletId = "") {
  if (methodType === PAYMENT_METHOD.CARD) {
    return String(expenseData?.methodId || expenseData?.cardId || "").trim();
  }

  return String(
    expenseData?.methodId || expenseData?.cashId || defaultCashWalletId || "",
  ).trim();
}

function makeSnapshot(expenseLike) {
  const normalized = normalizeExpense(expenseLike);
  return {
    ...normalized,
    date:
      normalized?.date instanceof Date
        ? new Date(normalized.date.getTime())
        : new Date(normalized?.date || Date.now()),
  };
}

export default function ExpensesContextProvider({ children }) {
  const [expensesState, dispatch] = useReducer(expensesReducer, []);
  const authCtx = useContext(AuthContext);
  const budgetCtx = useContext(BudgetContext);
  const paymentCtx = useContext(PaymentContext);

  const userId = authCtx.userId;
  const token = authCtx.token;
  const refreshSession = authCtx.refreshSession;
  const refreshSessionRef = useRef(refreshSession);

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
      try {
        return await request(token);
      } catch (error) {
        if (!isAuthHttpError(error)) throw error;

        const refreshed = await refreshSessionRef.current?.(true).catch(() => null);
        const nextToken = refreshed?.token;
        if (!nextToken) throw error;

        return await request(nextToken);
      }
    },
    [token],
  );

  const lastDeletedRef = useRef(null);
  const pendingDeletesRef = useRef(new Map());
  const expensesRef = useRef([]);
  const [canUndo, setCanUndo] = useState(false);

  useEffect(() => {
    expensesRef.current = expensesState;
  }, [expensesState]);

  useEffect(() => {
    return () => {
      pendingDeletesRef.current.forEach((op) => {
        if (op?.timerId) clearTimeout(op.timerId);
      });
      pendingDeletesRef.current.clear();
      lastDeletedRef.current = null;
      setCanUndo(false);
    };
  }, [userId]);

  const backfillExpensesIfNeeded = useCallback(
    async (rawExpenses) => {
      const patches = (rawExpenses || [])
        .map((e) => {
          if (!e?.id) return null;

          const partial = {};
          const rawIcon = e?.icon;
          const iconNeedsPatch =
            !rawIcon ||
            isEmoji(rawIcon) ||
            (typeof rawIcon === "string" && !isValidIonicon(rawIcon));

          const fixedIcon = iconNeedsPatch ? normalizeIcon(rawIcon) : rawIcon;
          if (iconNeedsPatch) partial.icon = fixedIcon;

          if (!e?.category) {
            partial.category = getCategoryFromIcon(fixedIcon || normalizeIcon(rawIcon));
          }

          const methodType = safePayMethod(e?.methodType || e?.payMethod);
          const methodId = safeMethodId(
            e,
            methodType,
            paymentCtx?.defaultCashWalletId || "",
          );

          if (!e?.methodType && !e?.payMethod) {
            partial.methodType = methodType;
            partial.payMethod = methodType;
          }

          if (methodId !== String(e?.methodId || e?.cardId || e?.cashId || "")) {
            partial.methodId = methodId;
            partial.cardId = methodType === PAYMENT_METHOD.CARD ? methodId : "";
            partial.cashId = methodType === PAYMENT_METHOD.CASH ? methodId : "";
          }

          if (!e?.budgetId && budgetCtx?.budgetId) {
            partial.budgetId = budgetCtx.budgetId;
          }

          if (Object.keys(partial).length === 0) return null;
          return { id: e.id, partial };
        })
        .filter(Boolean);

      if (!patches.length) return;

      await Promise.allSettled(
        patches.map((p) => withAuthRetry((t) => patchExpense(userId, t, p.id, p.partial))),
      );
    },
    [userId, budgetCtx?.budgetId, paymentCtx?.defaultCashWalletId, withAuthRetry],
  );

  const fetchAndSetExpenses = useCallback(async () => {
    ensureAuth();

    const expenses = await withAuthRetry((t) => fetchExpenses(userId, t));
    await backfillExpensesIfNeeded(expenses);

    dispatch({ type: "SET", payload: sortByDateDesc(expenses.map(normalizeExpense)) });
  }, [ensureAuth, userId, backfillExpensesIfNeeded, withAuthRetry]);

  const addExpense = useCallback(
    async (expenseData) => {
      ensureAuth();

      const fixedIcon = normalizeIcon(expenseData?.icon);
      const category = safeCategoryFromInput(expenseData, fixedIcon);

      const methodType = safePayMethod(expenseData?.methodType || expenseData?.payMethod);
      const methodId = safeMethodId(
        expenseData,
        methodType,
        paymentCtx?.defaultCashWalletId || "",
      );

      const payload = {
        ...expenseData,
        amount: safeAmount(expenseData?.amount),
        icon: fixedIcon,
        category,
        methodType,
        methodId,
        payMethod: methodType,
        cardId: methodType === PAYMENT_METHOD.CARD ? methodId : "",
        cashId: methodType === PAYMENT_METHOD.CASH ? methodId : "",
        budgetId: budgetCtx?.budgetId || null,
      };

      const id = await withAuthRetry((t) => storeExpense(userId, t, payload));
      dispatch({ type: "ADD", payload: normalizeExpense({ ...payload, id }) });

      if (methodType === PAYMENT_METHOD.CASH) {
        const a = safeAmount(payload.amount);
        if (a > 0) {
          budgetCtx?.addCashDelta?.(-a);
          budgetCtx?.saveBudget?.().catch(() => {});
          await paymentCtx?.applyCashExpense?.(methodId, -a).catch(() => {});
        }
      } else if (methodType === PAYMENT_METHOD.CARD) {
        const a = safeAmount(payload.amount);
        if (a > 0) {
          await paymentCtx?.applyCardExpense?.(methodId, -a).catch(() => {});
        }
      }
    },
    [
      ensureAuth,
      userId,
      budgetCtx,
      paymentCtx?.defaultCashWalletId,
      paymentCtx?.applyCashExpense,
      paymentCtx?.applyCardExpense,
      withAuthRetry,
    ],
  );

  const updateExpenseHandler = useCallback(
    async (id, expenseData) => {
      ensureAuth();
      const prev = expensesRef.current.find((e) => e.id === id) || null;

      const fixedIcon = normalizeIcon(expenseData?.icon);
      const category = safeCategoryFromInput(expenseData, fixedIcon);

      const methodType = safePayMethod(expenseData?.methodType || expenseData?.payMethod);
      const methodId = safeMethodId(
        expenseData,
        methodType,
        paymentCtx?.defaultCashWalletId || "",
      );

      const payload = {
        ...expenseData,
        amount: safeAmount(expenseData?.amount),
        icon: fixedIcon,
        category,
        methodType,
        methodId,
        payMethod: methodType,
        cardId: methodType === PAYMENT_METHOD.CARD ? methodId : "",
        cashId: methodType === PAYMENT_METHOD.CASH ? methodId : "",
        budgetId: expenseData?.budgetId ?? budgetCtx?.budgetId ?? null,
      };

      await withAuthRetry((t) => updateExpense(userId, t, id, payload));
      dispatch({
        type: "UPDATE",
        payload: { id, data: normalizeExpense({ ...payload, id }) },
      });

      const deltasByWallet = new Map();
      const deltasByCard = new Map();
      const addDelta = (walletId, delta) => {
        const key = String(walletId || "").trim();
        const prevDelta = Number(deltasByWallet.get(key) || 0);
        deltasByWallet.set(key, prevDelta + delta);
      };
      const addCardDelta = (cardId, delta) => {
        const key = String(cardId || "").trim();
        const prevDelta = Number(deltasByCard.get(key) || 0);
        deltasByCard.set(key, prevDelta + delta);
      };

      if (prev) {
        const prevMethodType = safePayMethod(prev?.methodType || prev?.payMethod);
        const prevMethodId = safeMethodId(
          prev,
          prevMethodType,
          paymentCtx?.defaultCashWalletId || "",
        );
        const prevAmount = safeAmount(prev?.amount);
        if (prevMethodType === PAYMENT_METHOD.CASH && prevAmount > 0) {
          addDelta(prevMethodId, prevAmount);
        } else if (prevMethodType === PAYMENT_METHOD.CARD && prevAmount > 0) {
          addCardDelta(prevMethodId, prevAmount);
        }
      }

      const nextAmount = safeAmount(payload.amount);
      if (methodType === PAYMENT_METHOD.CASH && nextAmount > 0) {
        addDelta(methodId, -nextAmount);
      } else if (methodType === PAYMENT_METHOD.CARD && nextAmount > 0) {
        addCardDelta(methodId, -nextAmount);
      }

      for (const [walletId, delta] of deltasByWallet.entries()) {
        if (!delta) continue;
        // eslint-disable-next-line no-await-in-loop
        await paymentCtx?.applyCashExpense?.(walletId, delta).catch(() => {});
      }

      for (const [cardId, delta] of deltasByCard.entries()) {
        if (!delta) continue;
        // eslint-disable-next-line no-await-in-loop
        await paymentCtx?.applyCardExpense?.(cardId, delta).catch(() => {});
      }
    },
    [
      ensureAuth,
      userId,
      budgetCtx?.budgetId,
      paymentCtx?.defaultCashWalletId,
      paymentCtx?.applyCashExpense,
      paymentCtx?.applyCardExpense,
      withAuthRetry,
    ],
  );

  const deleteExpenseHandler = useCallback(
    async (id) => {
      ensureAuth();
      const prev = expensesRef.current.find((e) => e.id === id) || null;

      await withAuthRetry((t) => deleteExpense(userId, t, id));
      dispatch({ type: "DELETE", payload: id });

      if (prev) {
        const prevMethodType = safePayMethod(prev?.methodType || prev?.payMethod);
        if (prevMethodType === PAYMENT_METHOD.CASH) {
          const prevMethodId = safeMethodId(
            prev,
            prevMethodType,
            paymentCtx?.defaultCashWalletId || "",
          );
          const prevAmount = safeAmount(prev?.amount);
          if (prevAmount > 0) {
            await paymentCtx?.applyCashExpense?.(prevMethodId, prevAmount).catch(() => {});
          }
        } else if (prevMethodType === PAYMENT_METHOD.CARD) {
          const prevMethodId = safeMethodId(
            prev,
            prevMethodType,
            paymentCtx?.defaultCashWalletId || "",
          );
          const prevAmount = safeAmount(prev?.amount);
          if (prevAmount > 0) {
            await paymentCtx?.applyCardExpense?.(prevMethodId, prevAmount).catch(() => {});
          }
        }
      }
    },
    [
      ensureAuth,
      userId,
      paymentCtx?.defaultCashWalletId,
      paymentCtx?.applyCashExpense,
      paymentCtx?.applyCardExpense,
      withAuthRetry,
    ],
  );

  const deleteExpenseWithUndo = useCallback(
    async (id, delayMs = 4500) => {
      ensureAuth();

      const toDelete = expensesRef.current.find((e) => e.id === id);
      if (!toDelete) return;

      const snapshot = makeSnapshot(toDelete);
      const opId = `${id}_${Date.now()}`;

      const oldOp = pendingDeletesRef.current.get(id);
      if (oldOp?.timerId) clearTimeout(oldOp.timerId);

      dispatch({ type: "DELETE", payload: id });

      const op = {
        id,
        opId,
        snapshot,
        undone: false,
        status: "scheduled",
        timerId: null,
      };

      const commitDelete = async () => {
        op.status = "committing";
        try {
          await withAuthRetry((t) => deleteExpense(userId, t, id));

          if (op.undone) {
            await withAuthRetry((t) => upsertExpenseById(userId, t, id, op.snapshot));
          } else {
            const prevMethodType = safePayMethod(
              op.snapshot?.methodType || op.snapshot?.payMethod,
            );
            if (prevMethodType === PAYMENT_METHOD.CASH) {
              const prevMethodId = safeMethodId(
                op.snapshot,
                prevMethodType,
                paymentCtx?.defaultCashWalletId || "",
              );
              const prevAmount = safeAmount(op.snapshot?.amount);
              if (prevAmount > 0) {
                await paymentCtx?.applyCashExpense?.(prevMethodId, prevAmount).catch(() => {});
              }
            } else if (prevMethodType === PAYMENT_METHOD.CARD) {
              const prevMethodId = safeMethodId(
                op.snapshot,
                prevMethodType,
                paymentCtx?.defaultCashWalletId || "",
              );
              const prevAmount = safeAmount(op.snapshot?.amount);
              if (prevAmount > 0) {
                await paymentCtx?.applyCardExpense?.(prevMethodId, prevAmount).catch(() => {});
              }
            }
          }
        } catch {
          if (!op.undone) {
            dispatch({ type: "ADD", payload: normalizeExpense(op.snapshot) });
          }
        } finally {
          op.status = "done";
          pendingDeletesRef.current.delete(id);
          if (lastDeletedRef.current?.opId === opId) {
            lastDeletedRef.current = null;
            setCanUndo(false);
          }
        }
      };

      op.timerId = setTimeout(() => {
        commitDelete().catch(() => {});
      }, delayMs);

      pendingDeletesRef.current.set(id, op);
      lastDeletedRef.current = {
        opId,
        id,
        expense: snapshot,
        deletedAt: Date.now(),
      };
      setCanUndo(true);
    },
    [
      ensureAuth,
      userId,
      paymentCtx?.defaultCashWalletId,
      paymentCtx?.applyCashExpense,
      paymentCtx?.applyCardExpense,
      withAuthRetry,
    ],
  );

  const undoLastDelete = useCallback(() => {
    ensureAuth();

    const last = lastDeletedRef.current;
    if (!last?.expense) return;

    const id = last.expense.id;
    const pending = pendingDeletesRef.current.get(id);

    if (pending) {
      pending.undone = true;
      if (pending.timerId) {
        clearTimeout(pending.timerId);
        pending.timerId = null;
        pendingDeletesRef.current.delete(id);
      }
    }

    const exists = expensesRef.current.some((e) => e.id === id);
    if (!exists) {
      dispatch({ type: "ADD", payload: normalizeExpense(last.expense) });
    }

    lastDeletedRef.current = null;
    setCanUndo(false);
  }, [ensureAuth]);

  const value = useMemo(
    () => ({
      expenses: expensesState,
      fetchAndSetExpenses,
      addExpense,
      updateExpense: updateExpenseHandler,
      deleteExpense: deleteExpenseHandler,
      deleteExpenseWithUndo,
      undoLastDelete,
      undoDelete: undoLastDelete,
      canUndo,
    }),
    [
      expensesState,
      fetchAndSetExpenses,
      addExpense,
      updateExpenseHandler,
      deleteExpenseHandler,
      deleteExpenseWithUndo,
      undoLastDelete,
      canUndo,
    ],
  );

  return <ExpensesContext.Provider value={value}>{children}</ExpensesContext.Provider>;
}
