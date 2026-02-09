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
import { useThemeRefresh } from "../../store/theme-context";
import LoadingOverlay from "../../components/ui/LoadingOverlay";
import ErrorOverlay from "../../components/ui/ErrorOverlay";

import { ExpensesContext } from "../../store/expenses-context";
import { AuthContext } from "../../store/auth-context";
import { CustomizationContext } from "../../store/customization-context";
import { useTranslation } from "../../store/language-context";

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
import { syncRecurringReminderNotifications } from "../../util/notifications/recurring-reminders";
import { logger } from "../../util/logger";

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

function toRecurringErrorMessage(error, t) {
  const rawError = error?.response?.data?.error;
  const raw =
    typeof rawError === "string"
      ? rawError.toLowerCase()
      : String(rawError?.message || "").toLowerCase();

  if (raw.includes("permission_denied") || raw.includes("permission denied")) {
    return t("payments.permissionDenied");
  }

  if (
    raw.includes("token expired") ||
    raw.includes("id token expired") ||
    raw.includes("invalid id token") ||
    raw.includes("invalid token")
  ) {
    return t("payments.sessionExpired");
  }

  return error?.message || t("recurring.loadFailed");
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
  const { recurringRemindersEnabled, recurringReminderHour } = useContext(CustomizationContext);
  useThemeRefresh();
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);
  const { t } = useTranslation();

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
      } catch (requestError) {
        if (!isAuthHttpError(requestError)) throw requestError;

        const refreshed = await refreshSessionRef.current?.(true).catch(() => null);
        const nextToken = refreshed?.token;
        if (!nextToken) throw requestError;

        return await request(nextToken);
      }
    },
    [token],
  );

  const load = useCallback(async () => {
    if (!userId || !token) return;
    setError(null);
    const list = await withTimeout(
      withAuthRetry((nextToken) => getRecurringItems(userId, nextToken)),
      LOAD_TIMEOUT_MS,
      t("recurring.loadTimeout"),
    );
    setItems(Array.isArray(list) ? list : []);
  }, [userId, token, withAuthRetry, t]);

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
      } catch (loadError) {
        if (mounted) setError(toRecurringErrorMessage(loadError, t));
      } finally {
        if (mounted && !hasLoadedRef.current) setIsFetching(false);
        hasLoadedRef.current = true;
      }
    })();

    return () => {
      mounted = false;
    };
  }, [userId, token, load, t]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const normalized = useMemo(() => {
    const list = (items || []).map((entry) => ({
      ...entry,
      amount: Number(entry.amount || 0),
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
      (entry) =>
        entry.type === RecurringType.SUBSCRIPTION && isDueTodayOrPast(entry.nextDue),
    );
  }, [normalized]);

  const visibleItems = useMemo(() => {
    if (showPaidSubscriptions) return normalized;
    return normalized.filter((entry) => {
      if (entry.type !== RecurringType.SUBSCRIPTION) return true;
      return isDueTodayOrPast(entry.nextDue);
    });
  }, [normalized, showPaidSubscriptions]);

  useEffect(() => {
    if (!userId || !token) return;

    syncRecurringReminderNotifications(items, {
      enabled: recurringRemindersEnabled,
      hour: recurringReminderHour,
    }).catch((syncError) => {
      logger.warn("Recurring reminders sync failed", syncError);
    });
  }, [
    items,
    recurringRemindersEnabled,
    recurringReminderHour,
    userId,
    token,
  ]);

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
          const next = await withAuthRetry((nextToken) => upsertRecurringItem(userId, nextToken, patch));
          setItems(Array.isArray(next) ? next : []);
          return true;
        } catch (updateError) {
          lastError = updateError;
        }
      }
      throw lastError || new Error(t("recurring.updateRecurringFailed"));
    },
    [userId, withAuthRetry, t],
  );

  const handleSubmitRecurring = async (data) => {
    if (!userId || !token) return;

    try {
      const next = await withAuthRetry((nextToken) =>
        upsertRecurringItem(userId, nextToken, {
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
      Alert.alert(t("common.error"), t("recurring.saveFailed"));
    }
  };

  const handleDeleteRecurring = async (item) => {
    if (!userId || !token) return;

    try {
      const next = await withAuthRetry((nextToken) => removeRecurringItem(userId, nextToken, item.id));
      setItems(next);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
        () => {},
      );
    } catch {
      Alert.alert(t("common.error"), t("recurring.deleteFailed"));
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

    Alert.alert(
      t("recurring.confirmAddHabitTitle"),
      t("recurring.confirmSingleMessage", {
        title: item.title,
        amount: payload.amount.toFixed(2),
        currency: t("common.currencyCode"),
      }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("recurring.quickAdd"),
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
                  t("recurring.partialCompletedTitle"),
                  t("recurring.expenseAddedRecurringNotUpdated"),
                  [
                    { text: t("common.close"), style: "cancel" },
                    {
                      text: t("recurring.retryUpdate"),
                      onPress: async () => {
                        try {
                          await updateRecurringWithRetry(patch);
                          Alert.alert(t("recurring.operationCompletedTitle"), t("recurring.recurringUpdated"));
                        } catch {
                          Alert.alert(
                            t("common.error"),
                            t("recurring.updateRecurringStillFailed"),
                          );
                        }
                      },
                    },
                  ],
                );
                return;
              }
              Alert.alert(t("common.error"), t("recurring.addExpenseFailed"));
            }
          },
        },
      ],
    );
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
      t("recurring.confirmPaySubscriptionTitle"),
      t("recurring.confirmSingleMessage", {
        title: item.title,
        amount: payload.amount.toFixed(2),
        currency: t("common.currencyCode"),
      }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("recurring.registerAction"),
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
                  t("recurring.partialCompletedTitle"),
                  t("recurring.paymentAddedRecurringNotUpdated"),
                  [
                    { text: t("common.close"), style: "cancel" },
                    {
                      text: t("recurring.retryUpdate"),
                      onPress: async () => {
                        try {
                          await updateRecurringWithRetry(patch);
                          Alert.alert(t("recurring.operationCompletedTitle"), t("recurring.recurringUpdated"));
                        } catch {
                          Alert.alert(
                            t("common.error"),
                            t("recurring.updateRecurringStillFailed"),
                          );
                        }
                      },
                    },
                  ],
                );
                return;
              }
              Alert.alert(t("common.error"), t("recurring.payFailed"));
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
      t("recurring.confirmAddAllTitle"),
      t("recurring.confirmAddAllMessage", { count: dueSubscriptions.length }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("recurring.addAllAction"),
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
                  t("recurring.partialCompletedTitle"),
                  t("recurring.someRecurringNotUpdated", { count: failedUpdates.length }),
                  [
                    { text: t("common.close"), style: "cancel" },
                    {
                      text: t("recurring.retryUpdate"),
                      onPress: async () => {
                        try {
                          for (const patch of failedUpdates) {
                            await updateRecurringWithRetry(patch);
                          }
                          Alert.alert(t("recurring.operationCompletedTitle"), t("recurring.recurringsUpdated"));
                        } catch {
                          Alert.alert(
                            t("common.error"),
                            t("recurring.someRecurringStillNotUpdated"),
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
              Alert.alert(t("common.error"), t("recurring.addAllFailed"));
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
    } catch (loadError) {
      setError(toRecurringErrorMessage(loadError, t));
    } finally {
      setIsFetching(false);
    }
  };

  if (isFetching) return <LoadingOverlay message={t("recurring.loading")} />;
  if (error) {
    return <ErrorOverlay message={error} onRetry={retry} retryLabel={t("common.retry")} />;
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
