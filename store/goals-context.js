import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AuthContext } from "./auth-context";
import { fetchGoals, removeGoal, upsertGoal } from "../util/goals-storage";
import { withFirebaseAuthRetry } from "../util/firebase-api-client";

export const GoalsContext = createContext({
  goals: [],
  loading: false,
  initialized: false,
  totalTarget: 0,
  totalSaved: 0,
  refreshGoals: async () => {},
  saveGoal: async (_goal) => {},
  deleteGoal: async (_id) => {},
  addProgress: async (_id, _delta) => {},
});

export default function GoalsContextProvider({ children }) {
  const authCtx = useContext(AuthContext);
  const userId = authCtx.userId;
  const token = authCtx.token;
  const refreshSession = authCtx.refreshSession;
  const refreshSessionRef = useRef(refreshSession);

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    refreshSessionRef.current = refreshSession;
  }, [refreshSession]);

  const ensureAuth = useCallback(() => {
    if (!userId || !token) {
      throw new Error("Auth non disponibile (token/userId mancanti).");
    }
  }, [userId, token]);

  const withAuthRetry = useCallback(
    async (request) => {
      return await withFirebaseAuthRetry(request, {
        token,
        refreshSession: refreshSessionRef.current,
      });
    },
    [token],
  );

  const refreshGoals = useCallback(async () => {
    ensureAuth();
    setLoading(true);
    try {
      const list = await withAuthRetry((t) => fetchGoals(userId, t));
      setGoals(Array.isArray(list) ? list : []);
      setInitialized(true);
      return list;
    } finally {
      setLoading(false);
    }
  }, [ensureAuth, userId, withAuthRetry]);

  useEffect(() => {
    if (!userId || !token) {
      setGoals([]);
      setInitialized(false);
      return;
    }
    refreshGoals().catch(() => {});
  }, [userId, token, refreshGoals]);

  const saveGoal = useCallback(
    async (goal) => {
      ensureAuth();
      await withAuthRetry((t) => upsertGoal(userId, t, goal));
      await refreshGoals();
    },
    [ensureAuth, userId, withAuthRetry, refreshGoals],
  );

  const deleteGoal = useCallback(
    async (id) => {
      ensureAuth();
      await withAuthRetry((t) => removeGoal(userId, t, id));
      await refreshGoals();
    },
    [ensureAuth, userId, withAuthRetry, refreshGoals],
  );

  const addProgress = useCallback(
    async (id, delta) => {
      ensureAuth();
      const target = goals.find((g) => String(g.id) === String(id));
      if (!target) return;

      const nextAmount = Number(target.currentAmount || 0) + Number(delta || 0);
      await withAuthRetry((t) =>
        upsertGoal(userId, t, {
          ...target,
          id: target.id,
          currentAmount: Number(nextAmount.toFixed(2)),
        }),
      );
      await refreshGoals();
    },
    [ensureAuth, userId, goals, withAuthRetry, refreshGoals],
  );

  const totalTarget = useMemo(
    () => goals.reduce((sum, goal) => sum + Number(goal?.targetAmount || 0), 0),
    [goals],
  );
  const totalSaved = useMemo(
    () => goals.reduce((sum, goal) => sum + Number(goal?.currentAmount || 0), 0),
    [goals],
  );

  const value = useMemo(
    () => ({
      goals,
      loading,
      initialized,
      totalTarget,
      totalSaved,
      refreshGoals,
      saveGoal,
      deleteGoal,
      addProgress,
    }),
    [
      goals,
      loading,
      initialized,
      totalTarget,
      totalSaved,
      refreshGoals,
      saveGoal,
      deleteGoal,
      addProgress,
    ],
  );

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
}
