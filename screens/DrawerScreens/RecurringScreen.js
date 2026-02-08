import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlobalStyles } from "../../constants/styles";
import LoadingOverlay from "../../components/ui/LoadingOverlay";
import ErrorOverlay from "../../components/ui/ErrorOverlay";

import { ExpensesContext } from "../../store/expenses-context";
import { AuthContext } from "../../store/auth-context";

import RecurringOutput from "../../components/RecurringOutput/RecurringOutput";
import RecurringList from "../../components/RecurringOutput/RecurringList";
import ManageRecurringModal from "../../components/ManageRecurring/ManageRecurringModal";

import {
  isDueTodayOrPast,
  RecurringType,
  advanceToFuture,
} from "../../util/recurring/recurring-utils";

import {
  getRecurringItems,
  removeRecurringItem,
  upsertRecurringItem,
} from "../../util/recurring/recurring-storage";

const RETRY_DELAYS_MS = [0, 450, 900];
const LOAD_TIMEOUT_MS = 6000;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout(promise, ms, message) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

function isAuthHttpError(error) {
  const status = Number(error?.response?.status || 0);
  return status === 401 || status === 403;
}

function toRecurringErrorMessage(error) {
  const rawError = error?.response?.data?.error;
  const raw =
    typeof rawError === "string"
      ? rawError.toLowerCase()
      : String(rawError?.message || "").toLowerCase();

  if (raw.includes("permission_denied") || raw.includes("permission denied")) {
    return "Accesso negato dal database. Verifica le regole Firebase.";
  }

  if (
    raw.includes("token expired") ||
    raw.includes("id token expired") ||
    raw.includes("invalid id token") ||
    raw.includes("invalid token")
  ) {
    return "Sessione scaduta. Effettua di nuovo l'accesso.";
  }

  return error?.message || "Impossibile caricare abitudini/abbonamenti.";
}

function makeRecurringPatch(item, type) {
  const now = new Date();
  const nextDue = advanceToFuture(item.nextDue || now, item.cadence, now);
  if (type === "subscription") {
    return {
      ...item,
      lastPaidAt: now.toISOString(),
      nextDue: nextDue.toISOString(),
      updatedAt: now.toISOString(),
    };
  }
  return {
    ...item,
    lastAddedAt: now.toISOString(),
    nextDue: nextDue.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export default function RecurringScreen() {
  const insets = useSafeAreaInsets();
  const expensesCtx = useContext(ExpensesContext);
  const authCtx = useContext(AuthContext);
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);

  const userId = authCtx.userId;
  const token = authCtx.token;
  const refreshSession = authCtx.refreshSession;
  const refreshSessionRef = useRef(refreshSession);

  const [items, setItems] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const hasLoadedRef = useRef(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDefaults, setModalDefaults] = useState(null);
  const [showPaidSubscriptions, setShowPaidSubscriptions] = useState(false);

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

  const load = useCallback(async () => {
    if (!userId || !token) return;
    setError(null);
    const list = await withTimeout(
      withAuthRetry((t) => getRecurringItems(userId, t)),
      LOAD_TIMEOUT_MS,
      "Timeout caricamento ricorrenze.",
    );
    setItems(Array.isArray(list) ? list : []);
  }, [userId, token, withAuthRetry]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!userId || !token) {
        if (mounted) setIsFetching(false);
        return;
      }

      if (!hasLoadedRef.current) setIsFetching(true);
      setError(null);
      try {
        await load();
      } catch (e) {
        if (mounted) setError(toRecurringErrorMessage(e));
      } finally {
        if (mounted && !hasLoadedRef.current) setIsFetching(false);
        hasLoadedRef.current = true;
      }
    })();

    return () => {
      mounted = false;
    };
  }, [userId, token, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const normalized = useMemo(() => {
    const list = (items || []).map((x) => ({
      ...x,
      amount: Number(x.amount || 0),
    }));

    return list.sort((a, b) => {
      const aSub = a.type === RecurringType.SUBSCRIPTION;
      const bSub = b.type === RecurringType.SUBSCRIPTION;

      const aDue = aSub && isDueTodayOrPast(a.nextDue);
      const bDue = bSub && isDueTodayOrPast(b.nextDue);

      if (aDue !== bDue) return aDue ? -1 : 1;

      const aNext = a.nextDue
        ? new Date(a.nextDue).getTime()
        : Number.MAX_SAFE_INTEGER;
      const bNext = b.nextDue
        ? new Date(b.nextDue).getTime()
        : Number.MAX_SAFE_INTEGER;

      if (aSub && bSub && aNext !== bNext) return aNext - bNext;
      if (aSub !== bSub) return aSub ? -1 : 1;

      return String(a.title || "").localeCompare(String(b.title || ""));
    });
  }, [items]);

  const dueSubscriptions = useMemo(() => {
    return normalized.filter(
      (x) =>
        x.type === RecurringType.SUBSCRIPTION && isDueTodayOrPast(x.nextDue),
    );
  }, [normalized]);

  const visibleItems = useMemo(() => {
    if (showPaidSubscriptions) return normalized;
    return normalized.filter((x) => {
      if (x.type !== RecurringType.SUBSCRIPTION) return true;
      return isDueTodayOrPast(x.nextDue);
    });
  }, [normalized, showPaidSubscriptions]);

  const openCreateHabit = () => {
    setModalDefaults({
      type: RecurringType.HABIT,
      title: "",
      description: "",
      amount: "",
      category: "Spese",
      icon: "flash-outline",
      cadence: "DAILY",
      nextDue: new Date().toISOString(),
    });
    setModalOpen(true);
  };

  const openCreateSubscription = () => {
    setModalDefaults({
      type: RecurringType.SUBSCRIPTION,
      title: "",
      description: "",
      amount: "",
      category: "Spese",
      icon: "repeat-outline",
      cadence: "MONTHLY",
      nextDue: new Date().toISOString(),
    });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setModalDefaults(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalDefaults(null);
  };

  const updateRecurringWithRetry = useCallback(
    async (patch) => {
      let lastError = null;
      for (const wait of RETRY_DELAYS_MS) {
        try {
          if (wait > 0) await delay(wait);
          const next = await withAuthRetry((t) => upsertRecurringItem(userId, t, patch));
          setItems(Array.isArray(next) ? next : []);
          return true;
        } catch (e) {
          lastError = e;
        }
      }
      throw lastError || new Error("Aggiornamento ricorrenza non riuscito.");
    },
    [userId, withAuthRetry],
  );

  const handleSubmitRecurring = async (data) => {
    if (!userId || !token) return;

    try {
      const next = await withAuthRetry((t) =>
        upsertRecurringItem(userId, t, {
          ...data,
          amount: Number(data?.amount || 0),
        }),
      );
      setItems(next);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      closeModal();
    } catch {
      Alert.alert("Errore", "Impossibile salvare la ricorrenza.");
    }
  };

  const handleDeleteRecurring = async (item) => {
    if (!userId || !token) return;

    try {
      const next = await withAuthRetry((t) => removeRecurringItem(userId, t, item.id));
      setItems(next);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
        () => {},
      );
    } catch {
      Alert.alert("Errore", "Impossibile eliminare.");
    }
  };

  const addExpenseFromHabit = async (item) => {
    if (!userId || !token) return;

    const payload = {
      amount: Number(item.amount || 0),
      date: new Date(),
      description: item.title,
      icon: item.icon,
      category: item.category,
      methodType: item?.methodType || item?.payMethod || "CASH",
      methodId: item?.methodId || item?.cardId || item?.cashId || "",
      payMethod: item?.methodType || item?.payMethod || "CASH",
      cardId: item?.cardId || "",
      cashId: item?.cashId || "",
    };

    Alert.alert("Aggiungere?", `${item.title}\n${payload.amount.toFixed(2)} EUR`, [
      { text: "Annulla", style: "cancel" },
      {
        text: "Aggiungi",
        onPress: async () => {
          let expenseAdded = false;
          const patch = makeRecurringPatch(item, "habit");
          try {
            await expensesCtx.addExpense(payload);
            expenseAdded = true;
            await updateRecurringWithRetry(patch);

            Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            ).catch(() => {});
          } catch {
            if (expenseAdded) {
              setItems((prev) => prev);
              Alert.alert(
                "Completato parzialmente",
                "Spesa aggiunta, ma non e stato possibile aggiornare la ricorrenza.",
                [
                  { text: "Chiudi", style: "cancel" },
                  {
                    text: "Riprova aggiornamento",
                    onPress: async () => {
                      try {
                        await updateRecurringWithRetry(patch);
                        Alert.alert("Operazione completata", "Ricorrenza aggiornata.");
                      } catch {
                        Alert.alert(
                          "Errore",
                          "Aggiornamento ricorrenza ancora non riuscito. Riprova da Abbonamenti/Abitudinali.",
                        );
                      }
                    },
                  },
                ],
              );
              return;
            }
            Alert.alert("Errore", "Impossibile aggiungere la spesa.");
          }
        },
      },
    ]);
  };

  const paySubscription = async (item) => {
    if (!userId || !token) return;

    const payload = {
      amount: Number(item.amount || 0),
      date: new Date(),
      description: item.title,
      icon: item.icon,
      category: item.category,
      methodType: item?.methodType || item?.payMethod || "CASH",
      methodId: item?.methodId || item?.cardId || item?.cashId || "",
      payMethod: item?.methodType || item?.payMethod || "CASH",
      cardId: item?.cardId || "",
      cashId: item?.cashId || "",
    };

    Alert.alert(
      "Registrare pagamento?",
      `${item.title}\n${payload.amount.toFixed(2)} EUR`,
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Registra",
          onPress: async () => {
            let expenseAdded = false;
            const patch = makeRecurringPatch(item, "subscription");
            try {
              await expensesCtx.addExpense(payload);
              expenseAdded = true;
              await updateRecurringWithRetry(patch);

              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              ).catch(() => {});
            } catch {
              if (expenseAdded) {
                Alert.alert(
                  "Completato parzialmente",
                  "Pagamento registrato, ma non e stato possibile aggiornare la ricorrenza.",
                  [
                    { text: "Chiudi", style: "cancel" },
                    {
                      text: "Riprova aggiornamento",
                      onPress: async () => {
                        try {
                          await updateRecurringWithRetry(patch);
                          Alert.alert("Operazione completata", "Ricorrenza aggiornata.");
                        } catch {
                          Alert.alert(
                            "Errore",
                            "Aggiornamento ricorrenza ancora non riuscito. Riprova da Abbonamenti/Abitudinali.",
                          );
                        }
                      },
                    },
                  ],
                );
                return;
              }
              Alert.alert("Errore", "Impossibile registrare il pagamento.");
            }
          },
        },
      ],
    );
  };

  const addAllDue = async () => {
    if (!userId || !token) return;
    if (!dueSubscriptions.length) return;

    Alert.alert(
      "Aggiungere tutto?",
      `Vuoi registrare ${dueSubscriptions.length} pagamento/i in scadenza?`,
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Aggiungi tutto",
          onPress: async () => {
            const failedUpdates = [];
            try {
              for (const item of dueSubscriptions) {
                await expensesCtx.addExpense({
                  amount: Number(item.amount || 0),
                  date: new Date(),
                  description: item.title,
                  icon: item.icon,
                  category: item.category,
                  methodType: item?.methodType || item?.payMethod || "CASH",
                  methodId: item?.methodId || item?.cardId || item?.cashId || "",
                  payMethod: item?.methodType || item?.payMethod || "CASH",
                  cardId: item?.cardId || "",
                  cashId: item?.cashId || "",
                });

                const patch = makeRecurringPatch(item, "subscription");
                try {
                  await updateRecurringWithRetry(patch);
                } catch {
                  failedUpdates.push(patch);
                }
              }

              if (failedUpdates.length) {
                Alert.alert(
                  "Completato parzialmente",
                  `${failedUpdates.length} ricorrenza/e non aggiornate.`,
                  [
                    { text: "Chiudi", style: "cancel" },
                    {
                      text: "Riprova aggiornamento",
                      onPress: async () => {
                        try {
                          for (const patch of failedUpdates) {
                            await updateRecurringWithRetry(patch);
                          }
                          Alert.alert("Operazione completata", "Ricorrenze aggiornate.");
                        } catch {
                          Alert.alert(
                            "Errore",
                            "Alcune ricorrenze non sono state aggiornate.",
                          );
                        }
                      },
                    },
                  ],
                );
              } else {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                ).catch(() => {});
              }
            } catch {
              Alert.alert("Errore", "Impossibile aggiungere tutto.");
            }
          },
        },
      ],
    );
  };

  const retry = async () => {
    setIsFetching(true);
    setError(null);
    try {
      await load();
    } catch (e) {
      setError(toRecurringErrorMessage(e));
    } finally {
      setIsFetching(false);
    }
  };

  if (isFetching) return <LoadingOverlay message="Caricamento..." />;
  if (error) {
    return <ErrorOverlay message={error} onRetry={retry} retryLabel="Riprova" />;
  }

  return (
    <View style={styles.container}>
      <RecurringList
        items={visibleItems}
        onEdit={openEdit}
        onDelete={handleDeleteRecurring}
        onQuickAdd={addExpenseFromHabit}
        onQuickPay={paySubscription}
        onRefresh={onRefresh}
        refreshing={refreshing}
        contentContainerStyle={{
          paddingHorizontal: 14,
          paddingBottom: 20 + insets.bottom,
        }}
        ListHeaderComponent={
          <View style={{ paddingTop: 12, paddingBottom: 6 }}>
            <RecurringOutput
              items={normalized}
              onCreateHabit={openCreateHabit}
              onCreateSubscription={openCreateSubscription}
              onAddAllDue={addAllDue}
              dueCount={dueSubscriptions.length}
              showPaidSubscriptions={showPaidSubscriptions}
              onToggleShowPaid={() =>
                setShowPaidSubscriptions((prev) => !prev)
              }
              hiddenPaidCount={Math.max(0, normalized.length - visibleItems.length)}
            />
          </View>
        }
      />

      <ManageRecurringModal
        visible={modalOpen}
        defaultValues={modalDefaults}
        onClose={closeModal}
        onSubmit={handleSubmitRecurring}
      />
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
  });
}
