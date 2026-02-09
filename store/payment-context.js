import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AuthContext } from "./auth-context";
import {
  fetchCards,
  fetchCashWallets,
  removeCard,
  removeCashWallet,
  setDefaultCashWallet as setDefaultCashWalletHttp,
  upsertCard,
  upsertCashWallet,
} from "../util/payment-http";
import {
  getCurrentLanguage,
  translateWithLanguage,
} from "./language-context";

export const PaymentContext = createContext({
  cards: [],
  cashWallets: [],
  defaultCashWalletId: "",
  loading: false,
  initialized: false,
  refreshPayments: async () => {},
  addCard: async (_card) => {},
  updateCard: async (_id, _card) => {},
  deleteCard: async (_id) => {},
  addCashWallet: async (_wallet) => {},
  updateCashWallet: async (_id, _wallet) => {},
  deleteCashWallet: async (_id) => {},
  setDefaultCashWallet: async (_id) => {},
  applyCashExpense: async (_walletId, _amountDelta) => {},
  applyCardExpense: async (_cardId, _amountDelta) => {},
  resolveMethodLabel: (_expenseLike) => "",
});

function normalizeCards(list) {
  return Array.isArray(list) ? list : [];
}

function normalizeCash(list) {
  const safe = Array.isArray(list) ? list : [];
  if (!safe.length) return [];
  if (safe.some((w) => w.isDefault)) return safe;
  return safe.map((w, idx) => ({ ...w, isDefault: idx === 0 }));
}

function isAuthHttpError(error) {
  const status = Number(error?.response?.status || 0);
  return status === 401 || status === 403;
}

function tt(key, params) {
  return translateWithLanguage(getCurrentLanguage(), key, params);
}

export default function PaymentContextProvider({ children }) {
  const authCtx = useContext(AuthContext);
  const userId = authCtx.userId;
  const token = authCtx.token;
  const refreshSession = authCtx.refreshSession;
  const refreshSessionRef = useRef(refreshSession);

  const [cards, setCards] = useState([]);
  const [cashWallets, setCashWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    refreshSessionRef.current = refreshSession;
  }, [refreshSession]);

  const ensureAuth = useCallback(() => {
    if (!userId || !token) {
      throw new Error(tt("quickAdd.authUnavailable"));
    }
  }, [userId, token]);

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

  const refreshPayments = useCallback(async () => {
    ensureAuth();
    setLoading(true);
    try {
      const [cardsResult, cashResult] = await Promise.allSettled([
        withAuthRetry((t) => fetchCards(userId, t)),
        withAuthRetry((t) => fetchCashWallets(userId, t)),
      ]);

      if (cardsResult.status === "fulfilled") {
        setCards(normalizeCards(cardsResult.value));
      }

      if (cashResult.status === "fulfilled") {
        setCashWallets(normalizeCash(cashResult.value));
      }

      if (cardsResult.status === "rejected" && cashResult.status === "rejected") {
        throw cardsResult.reason || cashResult.reason || new Error(tt("payments.loadFailed"));
      }
    } finally {
      setInitialized(true);
      setLoading(false);
    }
  }, [ensureAuth, userId, withAuthRetry]);

  useEffect(() => {
    if (!userId || !token) {
      setCards([]);
      setCashWallets([]);
      setInitialized(false);
      return;
    }
    refreshPayments().catch(() => {});
  }, [userId, token, refreshPayments]);

  const addCard = useCallback(
    async (card) => {
      ensureAuth();
      await withAuthRetry((t) => upsertCard(userId, t, card));
      await refreshPayments();
    },
    [ensureAuth, userId, withAuthRetry, refreshPayments],
  );

  const updateCard = useCallback(
    async (id, card) => {
      ensureAuth();
      await withAuthRetry((t) => upsertCard(userId, t, { ...card, id }));
      await refreshPayments();
    },
    [ensureAuth, userId, withAuthRetry, refreshPayments],
  );

  const deleteCard = useCallback(
    async (id) => {
      ensureAuth();
      await withAuthRetry((t) => removeCard(userId, t, id));
      await refreshPayments();
    },
    [ensureAuth, userId, withAuthRetry, refreshPayments],
  );

  const addCashWallet = useCallback(
    async (wallet) => {
      ensureAuth();
      await withAuthRetry((t) => upsertCashWallet(userId, t, wallet));
      await refreshPayments();
    },
    [ensureAuth, userId, withAuthRetry, refreshPayments],
  );

  const updateCashWallet = useCallback(
    async (id, wallet) => {
      ensureAuth();
      await withAuthRetry((t) => upsertCashWallet(userId, t, { ...wallet, id }));
      await refreshPayments();
    },
    [ensureAuth, userId, withAuthRetry, refreshPayments],
  );

  const deleteCashWallet = useCallback(
    async (id) => {
      ensureAuth();
      await withAuthRetry((t) => removeCashWallet(userId, t, id));
      await refreshPayments();
    },
    [ensureAuth, userId, withAuthRetry, refreshPayments],
  );

  const setDefaultCashWallet = useCallback(
    async (id) => {
      ensureAuth();
      await withAuthRetry((t) => setDefaultCashWalletHttp(userId, t, id, cashWallets));
      await refreshPayments();
    },
    [ensureAuth, userId, cashWallets, withAuthRetry, refreshPayments],
  );

  const applyCashExpense = useCallback(
    async (walletId, amountDelta) => {
      ensureAuth();

      const delta = Number(amountDelta || 0);
      if (!Number.isFinite(delta) || delta === 0) return;

      const list = Array.isArray(cashWallets) ? cashWallets : [];
      if (!list.length) return;

      const targetId =
        String(walletId || "").trim() ||
        String(list.find((w) => w.isDefault)?.id || "").trim() ||
        String(list[0]?.id || "").trim();
      if (!targetId) return;

      const target = list.find((w) => String(w.id) === targetId);
      if (!target) return;

      const nextBalance = Number(target.balance || 0) + delta;
      await withAuthRetry((t) =>
        upsertCashWallet(userId, t, {
          ...target,
          id: targetId,
          balance: Number(nextBalance.toFixed(2)),
        }),
      );
      await refreshPayments();
    },
    [
      ensureAuth,
      userId,
      cashWallets,
      withAuthRetry,
      refreshPayments,
    ],
  );

  const applyCardExpense = useCallback(
    async (cardId, amountDelta) => {
      ensureAuth();

      const delta = Number(amountDelta || 0);
      if (!Number.isFinite(delta) || delta === 0) return;

      const list = Array.isArray(cards) ? cards : [];
      if (!list.length) return;

      const targetId = String(cardId || "").trim();
      if (!targetId) return;

      const target = list.find((c) => String(c.id) === targetId);
      if (!target) return;

      const nextBalance = Number(target.balance || 0) + delta;
      await withAuthRetry((t) =>
        upsertCard(userId, t, {
          ...target,
          id: targetId,
          balance: Number(nextBalance.toFixed(2)),
        }),
      );
      await refreshPayments();
    },
    [ensureAuth, userId, cards, withAuthRetry, refreshPayments],
  );

  const defaultCashWalletId = useMemo(() => {
    const found = cashWallets.find((w) => w.isDefault);
    return found?.id ? String(found.id) : "";
  }, [cashWallets]);

  const cardsMap = useMemo(() => {
    const map = new Map();
    cards.forEach((c) => map.set(String(c.id), c));
    return map;
  }, [cards]);

  const cashMap = useMemo(() => {
    const map = new Map();
    cashWallets.forEach((w) => map.set(String(w.id), w));
    return map;
  }, [cashWallets]);

  const resolveMethodLabel = useCallback(
    (expenseLike) => {
      const cardLabel = tt("expensesOutput.card");
      const cashLabel = tt("expensesOutput.cash");
      const type =
        expenseLike?.methodType === "CARD" || expenseLike?.payMethod === "CARD"
          ? "CARD"
          : "CASH";
      const methodId = String(
        expenseLike?.methodId ||
          expenseLike?.cardId ||
          expenseLike?.cashId ||
          "",
      ).trim();

      if (type === "CARD") {
        const card = methodId ? cardsMap.get(methodId) : null;
        if (card?.name) return `${cardLabel} - ${card.name}`;

        if (!methodId && (cards || []).length === 1) {
          const singleCardName = String(cards?.[0]?.name || "").trim();
          if (singleCardName) return `${cardLabel} - ${singleCardName}`;
        }

        return cardLabel;
      }

      if (methodId) {
        const wallet = cashMap.get(methodId);
        if (wallet?.name) return `${cashLabel} - ${wallet.name}`;
      }

      const fallbackWallet =
        (cashWallets || []).find((w) => w?.isDefault) || cashWallets?.[0];
      const fallbackWalletName = String(fallbackWallet?.name || "").trim();
      if (fallbackWalletName) return `${cashLabel} - ${fallbackWalletName}`;

      return cashLabel;
    },
    [cardsMap, cashMap, cards, cashWallets],
  );

  const value = useMemo(
    () => ({
      cards,
      cashWallets,
      defaultCashWalletId,
      loading,
      initialized,
      refreshPayments,
      addCard,
      updateCard,
      deleteCard,
      addCashWallet,
      updateCashWallet,
      deleteCashWallet,
      setDefaultCashWallet,
      applyCashExpense,
      applyCardExpense,
      resolveMethodLabel,
    }),
    [
      cards,
      cashWallets,
      defaultCashWalletId,
      loading,
      initialized,
      refreshPayments,
      addCard,
      updateCard,
      deleteCard,
      addCashWallet,
      updateCashWallet,
      deleteCashWallet,
      setDefaultCashWallet,
      applyCashExpense,
      applyCardExpense,
      resolveMethodLabel,
    ],
  );

  return (
    <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>
  );
}
