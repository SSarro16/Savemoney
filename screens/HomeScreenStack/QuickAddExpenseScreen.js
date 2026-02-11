import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Swipeable } from "react-native-gesture-handler";

import { GlobalStyles } from "../../constants/styles";
import { useThemeRefresh } from "../../store/theme-context";
import { ExpensesContext } from "../../store/expenses-context";
import { AuthContext } from "../../store/auth-context";
import { CustomizationContext } from "../../store/customization-context";
import { useTranslation } from "../../store/language-context";

import LoadingOverlay from "../../components/ui/LoadingOverlay";
import ErrorOverlay from "../../components/ui/ErrorOverlay";

import {
  getExpenseTemplates,
  removeExpenseTemplate,
} from "../../util/expenses/expense-template";
import {
  getRecurringItems,
  upsertRecurringItem,
} from "../../util/recurring/recurring-storage";
import {
  RecurringType,
  isDueTodayOrPast,
  advanceToFuture,
} from "../../util/recurring/recurring-utils";
import { PAYMENT_METHOD } from "../../util/expenses/expense-presets";
import { normalizeIcon } from "../../util/expenses/expense-normalize";

const RETRY_DELAYS_MS = [0, 450, 900];
const QUICK_RECURRING_TIMEOUT_MS = 2200;

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

function safePayMethod(v) {
  return v === PAYMENT_METHOD.CARD ? PAYMENT_METHOD.CARD : PAYMENT_METHOD.CASH;
}

function isAuthHttpError(error) {
  const status = Number(error?.response?.status || 0);
  return status === 401 || status === 403;
}

function Row({
  title,
  subtitle,
  icon,
  onPress,
  highlight = false,
  compact = false,
  contrast = false,
  colors,
  styles,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          paddingVertical: compact ? 10 : 12,
          borderColor: contrast ? colors.white18 : colors.white10,
        },
        highlight && {
          backgroundColor: colors.accent16,
          borderColor: colors.accent30,
        },
        pressed && styles.rowPressed,
      ]}
    >
      <View style={styles.rowLeft}>
        <View
          style={[
            styles.rowIconWrap,
            highlight && { backgroundColor: colors.white18 },
          ]}
        >
          <Ionicons name={icon || "pricetag-outline"} size={18} color={colors.textTitle} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {title}
          </Text>
          {!!subtitle && (
            <Text
              style={[styles.rowSub, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      <Ionicons
        name="add-circle"
        size={20}
        color={highlight ? colors.textOnAccentStrong : colors.accent500}
      />
    </Pressable>
  );
}

function SwipeTemplateRow({
  item,
  onAdd,
  onDelete,
  compact = false,
  contrast = false,
  colors,
  styles,
}) {
  const swipeRef = useRef(null);
  const { t } = useTranslation();

  return (
    <Swipeable
      ref={swipeRef}
      overshootRight={false}
      rightThreshold={36}
      renderRightActions={() => (
        <Pressable
          onPress={() => {
            swipeRef.current?.close?.();
            onDelete?.(item);
          }}
          style={({ pressed }) => [
            styles.deleteSwipeAction,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Ionicons name="trash-outline" size={18} color={colors.textTitle} />
          <Text style={styles.deleteSwipeText}>{t("common.delete")}</Text>
        </Pressable>
      )}
    >
      <View style={styles.swipeRowClip}>
        <Row
          title={item.title || item.description || t("quickAdd.templateFallback")}
          subtitle={`${Number(item.amount || 0).toFixed(2)} ${t("common.currencyCode")}`}
          icon={normalizeIcon(item.icon)}
          onPress={onAdd}
          compact={compact}
          contrast={contrast}
          colors={colors}
          styles={styles}
        />
      </View>
    </Swipeable>
  );
}

function ActionButton({
  label,
  icon,
  onPress,
  variant = "accent",
  compact = false,
  colors,
  styles,
}) {
  const bg = variant === "accent" ? colors.accent18 : colors.white08;
  const border = variant === "accent" ? colors.accent35 : colors.white10;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionBtn,
        {
          paddingVertical: compact ? 10 : 12,
          backgroundColor: bg,
          borderColor: border,
        },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={18} color={colors.textTitle} />
      <Text style={styles.actionText}>{label}</Text>
      <Ionicons name="arrow-forward" size={18} color={colors.textTitle} />
    </Pressable>
  );
}

function StatPill({ label, value, colors, styles }) {
  return (
    <View
      style={[
        styles.statPill,
        {
          backgroundColor: colors.white06,
          borderColor: colors.white10,
        },
      ]}
    >
      <Text style={[styles.statValue, { color: colors.textTitle }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
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

export default function QuickAddExpenseScreen({ navigation }) {
  const expensesCtx = useContext(ExpensesContext);
  const authCtx = useContext(AuthContext);
  const {
    compactMode,
    highContrast,
    reduceMotion = false,
  } = useContext(CustomizationContext);
  useThemeRefresh();
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);
  const { t } = useTranslation();

  const userId = authCtx.userId;
  const token = authCtx.token;
  const refreshSession = authCtx.refreshSession;
  const refreshSessionRef = useRef(refreshSession);

  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(420)).current;

  const [templates, setTemplates] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    refreshSessionRef.current = refreshSession;
  }, [refreshSession]);

  const withAuthRetry = useCallback(
    async (request) => {
      try {
        return await request(token);
      } catch (e) {
        if (!isAuthHttpError(e)) throw e;

        const refreshed = await refreshSessionRef.current?.(true).catch(() => null);
        const nextToken = refreshed?.token;
        if (!nextToken) throw e;

        return await request(nextToken);
      }
    },
    [token],
  );

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      const recurringPromise =
        userId && token
          ? withTimeout(
              withAuthRetry((t) => getRecurringItems(userId, t)),
              QUICK_RECURRING_TIMEOUT_MS,
              t("quickAdd.recurringLoadTimeout"),
            )
          : Promise.resolve([]);

      const [templatesResult, recurringResult] = await Promise.allSettled([
        userId && token ? getExpenseTemplates(userId, token) : Promise.resolve([]),
        recurringPromise,
      ]);

      if (templatesResult.status === "fulfilled") {
        setTemplates(Array.isArray(templatesResult.value) ? templatesResult.value : []);
      } else {
        setTemplates([]);
      }

      if (recurringResult.status === "fulfilled") {
        setRecurring(Array.isArray(recurringResult.value) ? recurringResult.value : []);
      } else {
        setRecurring([]);
      }

      if (
        templatesResult.status === "rejected" &&
        recurringResult.status === "rejected"
      ) {
        throw templatesResult.reason || recurringResult.reason || new Error(t("quickAdd.loadFailed"));
      }
    } catch {
      setError(t("quickAdd.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [userId, token, withAuthRetry, t]);

  useEffect(() => {
    loadAll();
    Animated.timing(translateY, {
      toValue: 0,
      duration: reduceMotion ? 0 : 260,
      useNativeDriver: true,
    }).start();
  }, [loadAll, reduceMotion, translateY]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAll();
    } finally {
      setRefreshing(false);
    }
  };

  const close = () => {
    Animated.timing(translateY, {
      toValue: 420,
      duration: reduceMotion ? 0 : 220,
      useNativeDriver: true,
    }).start(() => navigation.goBack());
  };

  const dueSubs = useMemo(() => {
    return (recurring || []).filter(
      (x) =>
        x.type === RecurringType.SUBSCRIPTION && isDueTodayOrPast(x.nextDue),
    );
  }, [recurring]);

  const habits = useMemo(() => {
    return (recurring || []).filter((x) => x.type === RecurringType.HABIT);
  }, [recurring]);

  const noRecurring = (recurring || []).length === 0;
  const hasRecurringBlocks = noRecurring || dueSubs.length > 0 || habits.length > 0;

  const goToRecurring = () => {
    close();
    setTimeout(() => {
      navigation.navigate("Drawer", { screen: "Recurring" });
    }, reduceMotion ? 0 : 250);
  };

  const addExpense = async ({
    amount,
    description,
    icon,
    category,
    payMethod,
    cardId,
    cashId,
    methodType,
    methodId,
  }) => {
    const pm = safePayMethod(methodType || payMethod);
    const resolvedMethodId =
      pm === PAYMENT_METHOD.CARD
        ? String(methodId || cardId || "").trim()
        : String(methodId || cashId || "").trim();

    await expensesCtx.addExpense({
      amount: Number(amount || 0),
      date: new Date(),
      description,
      icon,
      category,
      methodType: pm,
      methodId: resolvedMethodId,
      payMethod: pm,
      cardId: pm === PAYMENT_METHOD.CARD ? resolvedMethodId : "",
      cashId: pm === PAYMENT_METHOD.CASH ? resolvedMethodId : "",
    });
  };

  const deleteTemplate = (template) => {
    const id = String(template?.id || "").trim();
    const label = String(template?.title || template?.description || t("quickAdd.templateFallback"));
    if (!id) return;

    Alert.alert(t("quickAdd.deleteTemplateTitle"), t("quickAdd.deleteTemplateMessage", { name: label }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            if (!userId || !token) {
              throw new Error(t("quickAdd.authUnavailable"));
            }
            const next = await removeExpenseTemplate(userId, token, id);
            setTemplates(Array.isArray(next) ? next : []);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          } catch {
            Alert.alert(t("common.error"), t("quickAdd.deleteTemplateFailed"));
          }
        },
      },
    ]);
  };

  const updateRecurringWithRetry = async (patch) => {
    if (!userId || !token) {
      throw new Error(t("quickAdd.authUnavailable"));
    }

    let lastError = null;
    for (const wait of RETRY_DELAYS_MS) {
      try {
        if (wait > 0) await delay(wait);
        const next = await withAuthRetry((t) => upsertRecurringItem(userId, t, patch));
        setRecurring(Array.isArray(next) ? next : []);
        return true;
      } catch (e) {
        lastError = e;
      }
    }
    throw lastError || new Error(t("quickAdd.updateRecurringFailed"));
  };

  const handleRecurringFailure = (patch, message) => {
    Alert.alert(t("quickAdd.partialCompletedTitle"), message, [
      { text: t("common.close"), style: "cancel" },
      {
        text: t("quickAdd.retryUpdate"),
        onPress: async () => {
          try {
            await updateRecurringWithRetry(patch);
            Alert.alert(t("quickAdd.operationCompletedTitle"), t("quickAdd.recurringUpdated"));
          } catch {
            Alert.alert(
              t("common.error"),
              t("quickAdd.updateRecurringStillFailed"),
            );
          }
        },
      },
    ]);
  };

  const quickPaySubscription = async (item) => {
    try {
      await addExpense({
        amount: item.amount,
        description: item.title,
        icon: item.icon,
        category: item.category,
        payMethod: item.payMethod,
        cardId: item.cardId,
        cashId: item.cashId,
        methodType: item.methodType,
        methodId: item.methodId,
      });

      const patch = makeRecurringPatch(item, "subscription");
      try {
        await updateRecurringWithRetry(patch);
      } catch {
        handleRecurringFailure(
          patch,
          t("quickAdd.paymentAddedRecurringNotUpdated"),
        );
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      close();
    } catch {
      setError(t("quickAdd.addExpenseFailed"));
    }
  };

  const quickAddHabit = async (item) => {
    try {
      await addExpense({
        amount: item.amount,
        description: item.title,
        icon: item.icon,
        category: item.category,
        payMethod: item.payMethod,
        cardId: item.cardId,
        cashId: item.cashId,
        methodType: item.methodType,
        methodId: item.methodId,
      });

      const patch = makeRecurringPatch(item, "habit");
      try {
        await updateRecurringWithRetry(patch);
      } catch {
        handleRecurringFailure(
          patch,
          t("quickAdd.expenseAddedRecurringNotUpdated"),
        );
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      close();
    } catch {
      setError(t("quickAdd.addExpenseFailed"));
    }
  };

  const addAllDue = async () => {
    if (!dueSubs.length) return;

    Alert.alert(
      t("quickAdd.addAllDueTitle"),
      t("quickAdd.addAllDueMessage", { count: dueSubs.length }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("quickAdd.addAllDueAction"),
          onPress: async () => {
            const failedUpdates = [];
            try {
              for (const item of dueSubs) {
                await addExpense({
                  amount: item.amount,
                  description: item.title,
                  icon: item.icon,
                  category: item.category,
                  payMethod: item.payMethod,
                  cardId: item.cardId,
                  cashId: item.cashId,
                  methodType: item.methodType,
                  methodId: item.methodId,
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
                  t("quickAdd.partialCompletedTitle"),
                  t("quickAdd.partialNotUpdatedMessage", { count: failedUpdates.length }),
                  [
                    { text: t("common.close"), style: "cancel" },
                    {
                      text: t("quickAdd.retryUpdate"),
                      onPress: async () => {
                        try {
                          for (const patch of failedUpdates) {
                            await updateRecurringWithRetry(patch);
                          }
                          Alert.alert(t("quickAdd.operationCompletedTitle"), t("quickAdd.recurringsUpdated"));
                        } catch {
                          Alert.alert(
                            t("common.error"),
                            t("quickAdd.someRecurringNotUpdated"),
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
                close();
              }
            } catch {
              setError(t("quickAdd.addAllDueFailed"));
            }
          },
        },
      ],
    );
  };

  if (isLoading) return <LoadingOverlay message={t("common.loading")} />;
  if (error) {
    return <ErrorOverlay message={error} onRetry={loadAll} retryLabel={t("common.retry")} />;
  }

  return (
    <View style={[styles.backdrop, { backgroundColor: colors.overlay55 }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={close} />

      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.surface2,
            borderColor: highContrast ? colors.white18 : colors.white10,
            paddingBottom: 16 + insets.bottom,
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: colors.white20 }]} />
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.textTitle }]}>
              {t("quickAdd.title")}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {t("quickAdd.subtitle")}
            </Text>
          </View>
          <Pressable
            onPress={close}
            style={({ pressed }) => [
              styles.closeBtn,
              {
                backgroundColor: colors.white08,
                borderColor: colors.white10,
              },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="close" size={18} color={colors.textTitle} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 12 }}
        >
          <View style={styles.statsRow}>
            <StatPill
              label={t("quickAdd.due")}
              value={String(dueSubs.length)}
              colors={colors}
              styles={styles}
            />
            <StatPill
              label={t("quickAdd.habits")}
              value={String(habits.length)}
              colors={colors}
              styles={styles}
            />
            <StatPill
              label={t("quickAdd.templates")}
              value={String((templates || []).length)}
              colors={colors}
              styles={styles}
            />
          </View>

          {noRecurring ? (
            <View style={styles.sectionCard}>
              <ActionButton
                label={t("quickAdd.noRecurringAction")}
                icon="sparkles-outline"
                onPress={goToRecurring}
                variant="accent"
                compact={compactMode}
                colors={colors}
                styles={styles}
              />
            </View>
          ) : null}

          {!!dueSubs.length && (
            <View style={[styles.section, styles.sectionCard]}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                {t("quickAdd.duePayments")}
              </Text>

              <ActionButton
                label={t("quickAdd.addAllDueButton", { count: dueSubs.length })}
                icon="checkmark-done-outline"
                onPress={addAllDue}
                variant="accent"
                compact={compactMode}
                colors={colors}
                styles={styles}
              />

              {dueSubs.slice(0, 6).map((item) => (
                <Row
                  key={item.id}
                  title={item.title}
                  subtitle={`${Number(item.amount || 0).toFixed(2)} ${t("common.currencyCode")}`}
                  icon={normalizeIcon(item.icon)}
                  highlight
                  onPress={() => quickPaySubscription(item)}
                  compact={compactMode}
                  contrast={highContrast}
                  colors={colors}
                  styles={styles}
                />
              ))}

              <Pressable onPress={goToRecurring} style={styles.smallLink}>
                <Text style={[styles.smallLinkText, { color: colors.accent500 }]}>
                  {t("quickAdd.viewAllRecurring")}
                </Text>
              </Pressable>
            </View>
          )}

          {!!habits.length && (
            <View style={[styles.section, styles.sectionCard]}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                {t("quickAdd.habits")}
              </Text>
              {habits.slice(0, 6).map((item) => (
                <Row
                  key={item.id}
                  title={item.title}
                  subtitle={`${Number(item.amount || 0).toFixed(2)} ${t("common.currencyCode")}`}
                  icon={normalizeIcon(item.icon)}
                  onPress={() => quickAddHabit(item)}
                  compact={compactMode}
                  contrast={highContrast}
                  colors={colors}
                  styles={styles}
                />
              ))}
              <Pressable onPress={goToRecurring} style={styles.smallLink}>
                <Text style={[styles.smallLinkText, { color: colors.accent500 }]}>
                  {t("quickAdd.manageHabits")}
                </Text>
              </Pressable>
            </View>
          )}

          {hasRecurringBlocks ? <View style={styles.sectionSpacer} /> : null}

          <View style={[styles.section, styles.sectionCard, styles.modelsSection]}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                {t("quickAdd.templates")}
              </Text>

            {!(templates || []).length ? (
              <View style={styles.templateHint}>
                <Text style={[styles.rowSub, { color: colors.textMuted }]}> 
                  {t("quickAdd.noTemplates")}
                </Text>
              </View>
            ) : (
              (templates || []).slice(0, 10).map((t) => (
                <SwipeTemplateRow
                  key={t.id || t.title}
                  item={t}
                  onDelete={deleteTemplate}
                  onAdd={async () => {
                    try {
                      await addExpense({
                        amount: t.amount,
                        description: t.title || t.description,
                        icon: t.icon,
                        category: t.category,
                        payMethod: t.payMethod,
                        cardId: t.cardId,
                        cashId: t.cashId,
                        methodType: t.methodType,
                        methodId: t.methodId,
                      });

                      Haptics.notificationAsync(
                        Haptics.NotificationFeedbackType.Success,
                      ).catch(() => {});
                      close();
                    } catch {
                      setError(t("quickAdd.addExpenseFailed"));
                    }
                  }}
                  compact={compactMode}
                  contrast={highContrast}
                  colors={colors}
                  styles={styles}
                />
              ))
            )}
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: "flex-end",
    },
    sheet: {
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      paddingHorizontal: 16,
      paddingTop: 10,
      borderWidth: 1,
      maxHeight: "92%",
    },
    handle: {
      alignSelf: "center",
      width: 48,
      height: 5,
      borderRadius: 999,
      marginBottom: 8,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    title: { fontWeight: "900", fontSize: 18 },
    subtitle: { fontWeight: "700", fontSize: 12, marginTop: 2 },
    closeBtn: {
      padding: 10,
      borderRadius: 12,
      borderWidth: 1,
    },
    pressed: { opacity: 0.85 },
    section: { marginBottom: 14 },
    sectionSpacer: { height: 10 },
    sectionCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      padding: 10,
    },
    modelsSection: { marginTop: 2 },
    statsRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 10,
    },
    statPill: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1,
      paddingVertical: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    statValue: { fontWeight: "900", fontSize: 16 },
    statLabel: { marginTop: 2, fontWeight: "800", fontSize: 11 },
    sectionTitle: {
      fontWeight: "900",
      fontSize: 12,
      letterSpacing: 0.4,
      textTransform: "uppercase",
      marginBottom: 8,
    },
    row: {
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: colors.white06,
      borderWidth: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    swipeRowClip: {
      borderRadius: 14,
      overflow: "hidden",
    },
    deleteSwipeAction: {
      width: 74,
      marginLeft: 10,
      marginBottom: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.danger30,
      backgroundColor: colors.danger20,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    deleteSwipeText: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 11,
    },
    rowPressed: { opacity: 0.85 },
    rowLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
    rowIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: colors.white08,
      alignItems: "center",
      justifyContent: "center",
    },
    rowTitle: { color: colors.textTitle, fontWeight: "900" },
    rowSub: { fontWeight: "700", marginTop: 2 },
    smallLink: {
      paddingVertical: 6,
      paddingHorizontal: 4,
      alignSelf: "flex-start",
    },
    smallLinkText: { fontWeight: "900" },
    templateHint: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      padding: 12,
    },
    actionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 14,
      borderRadius: 18,
      borderWidth: 1,
      marginBottom: 12,
    },
    actionText: { color: colors.textTitle, fontWeight: "900", flex: 1 },
  });
}





