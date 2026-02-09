import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { GlobalStyles } from "../../constants/styles";
import { useThemeRefresh } from "../../store/theme-context";
import { AuthContext } from "../../store/auth-context";
import LoadingOverlay from "../../components/ui/LoadingOverlay";
import ErrorOverlay from "../../components/ui/ErrorOverlay";
import {
  getBudgets,
  makeEmptyBudget,
  removeBudget,
  setActiveBudgetId,
  upsertBudget,
} from "../../util/budget/budget-storage";
import { useTranslation } from "../../store/language-context";

function BudgetCard({ item, onOpen, onDelete, styles, colors, t }) {
  const total = Number(item?.total || 0);
  const allocated = Object.values(item?.categories || {}).reduce(
    (sum, value) => sum + Number(value || 0),
    0,
  );
  const ratio = total > 0 ? Math.min(1, Math.max(0, allocated / total)) : 0;
  const pct = Math.round(ratio * 100);

  return (
    <Pressable
      onPress={() => onOpen(item)}
      style={({ pressed }) => [styles.budgetCard, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.budgetCardTop}>
        <View style={styles.budgetIcon}>
          <Ionicons name="wallet-outline" size={17} color={colors.textTitle} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.budgetTitle} numberOfLines={1}>
            {item?.title || item?.name || t("budgetsHub.newBudgetFallback")}
          </Text>
          <Text style={styles.budgetSub}>
            {allocated.toFixed(2)} / {total.toFixed(2)} {t("common.currencyCode")}
          </Text>
        </View>
        <View style={styles.budgetPctBadge}>
          <Text style={styles.budgetPctText}>{pct}%</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(4, pct)}%` }]} />
      </View>

      <View style={styles.budgetActions}>
        <Pressable onPress={() => onDelete(item)} style={styles.budgetDeleteBtn}>
          <Ionicons name="trash-outline" size={14} color={colors.error500} />
          <Text style={[styles.budgetDeleteText, { color: colors.error500 }]}>{t("common.delete")}</Text>
        </Pressable>
        <View style={styles.budgetOpenHint}>
          <Text style={styles.budgetOpenText}>{t("budgetsHub.openDetails")}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </View>
      </View>
    </Pressable>
  );
}

export default function BudgetsHubScreen({ navigation }) {
  useThemeRefresh();
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);
  const authCtx = useContext(AuthContext);
  const { t } = useTranslation();
  const userId = authCtx.userId;
  const token = authCtx.token;
  const refreshSession = authCtx.refreshSession;

  const [items, setItems] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(null);

  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const hasLoadedRef = useRef(false);
  const refreshSessionRef = useRef(refreshSession);

  const hubStats = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    const totalBudgets = list.length;
    const totalPlanned = list.reduce((sum, b) => sum + Number(b?.total || 0), 0);
    const average = totalBudgets > 0 ? totalPlanned / totalBudgets : 0;
    const richest = list.reduce(
      (best, b) => {
        const value = Number(b?.total || 0);
        if (value > best.value) {
          return {
            value,
            title: String(b?.title || b?.name || t("budgetsHub.newBudgetFallback")),
          };
        }
        return best;
      },
      { value: 0, title: "-" },
    );
    return {
      totalBudgets,
      totalPlanned,
      average,
      topName: richest.title,
      topTotal: richest.value,
    };
  }, [items, t]);

  useEffect(() => {
    refreshSessionRef.current = refreshSession;
  }, [refreshSession]);

  const withAuthRetry = useCallback(
    async (request) => {
      try {
        return await request(token);
      } catch (err) {
        const status = Number(err?.response?.status || 0);
        if (status !== 401 && status !== 403) throw err;
        const refreshed = await refreshSessionRef.current?.(true).catch(() => null);
        const nextToken = refreshed?.token;
        if (!nextToken) throw err;
        return await request(nextToken);
      }
    },
    [token],
  );

  const load = useCallback(
    async (showLoader = true) => {
      try {
        setError(null);
        if (showLoader) setIsFetching(true);
        const list = await withAuthRetry((t) => getBudgets(userId, t));
        setItems(list);
      } catch (e) {
        setError(e?.message || t("common.error"));
      } finally {
        if (showLoader) setIsFetching(false);
        hasLoadedRef.current = true;
      }
    },
    [userId, withAuthRetry],
  );

  useFocusEffect(
    useCallback(() => {
      load(!hasLoadedRef.current);
    }, [load]),
  );

  const openBudget = async (budget) => {
    const budgetTitle = String(budget?.title || budget?.name || t("budgetsHub.newBudgetFallback"));
    await setActiveBudgetId(budget.id, userId);
    navigation.navigate("BudgetOverview", {
      budgetId: budget.id,
      title: budgetTitle,
    });
  };

  const confirmDelete = (budget) => {
    const budgetTitle = String(budget?.title || budget?.name || t("budgetsHub.newBudgetFallback"));
    Alert.alert(t("budgetsHub.deleteBudgetTitle"), t("budgetsHub.deleteBudgetMessage", { name: budgetTitle }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          const next = await withAuthRetry((t) => removeBudget(userId, t, budget.id));
          setItems(next);
        },
      },
    ]);
  };

  const createNew = async () => {
    try {
      const cleanTitle = String(title || "").trim() || t("budgetsHub.newBudgetFallback");
      const budget = makeEmptyBudget({ title: cleanTitle });
      const next = await withAuthRetry((t) => upsertBudget(userId, t, budget));
      setItems(next);
      setCreating(false);
      setTitle("");
      navigation.navigate("BudgetOverview", {
        budgetId: budget.id,
        title: String(budget?.title || budget?.name || cleanTitle),
      });
    } catch (e) {
      Alert.alert(t("common.error"), e?.message || t("budgetsHub.createBudgetFailed"));
    }
  };

  if (isFetching) return <LoadingOverlay message={t("budgetsHub.loadingBudgets")} />;
  if (error) return <ErrorOverlay message={error} onRetry={load} />;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={[styles.heroBubble, styles.heroBubbleTop]} />
          <View style={[styles.heroBubble, styles.heroBubbleBottom]} />
          <View style={styles.heroTopRow}>
            <View style={styles.heroIcon}>
              <Ionicons name="layers-outline" size={18} color={colors.textTitle} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>{t("budgetsHub.heroTitle")}</Text>
              <Text style={styles.heroSub}>{t("budgetsHub.heroSub")}</Text>
            </View>
            <Pressable
              onPress={() => setCreating((v) => !v)}
              style={({ pressed }) => [styles.heroAddBtn, pressed && { opacity: 0.9 }]}
            >
              <Ionicons
                name={creating ? "close" : "add"}
                size={18}
                color={colors.textOnAccentStrong}
              />
            </Pressable>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{t("drawer.budget")}</Text>
              <Text style={styles.statValue}>{hubStats.totalBudgets}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{t("budgetsHub.totalPlanned")}</Text>
              <Text style={styles.statValue}>{hubStats.totalPlanned.toFixed(2)} {t("common.currencyCode")}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{t("budgetsHub.average")}</Text>
              <Text style={styles.statValue}>{hubStats.average.toFixed(2)} {t("common.currencyCode")}</Text>
            </View>
          </View>

          {!!hubStats.totalBudgets ? (
            <View style={styles.topLine}>
              <Ionicons name="trophy-outline" size={14} color={colors.textMuted} />
              <Text style={styles.topLineText} numberOfLines={1}>
                {t("budgetsHub.topBudgetLine", {
                  name: hubStats.topName,
                  total: `${hubStats.topTotal.toFixed(2)} ${t("common.currencyCode")}`,
                })}
              </Text>
            </View>
          ) : null}
        </View>

        {creating ? (
          <View style={styles.createCard}>
            <Text style={styles.createLabel}>{t("budgetsHub.budgetName")}</Text>
            <View style={styles.createInputWrap}>
              <Ionicons name="create-outline" size={17} color={colors.textMuted} />
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={t("budgetsHub.namePlaceholder")}
                placeholderTextColor={colors.textFaint}
                style={styles.createInput}
                returnKeyType="done"
                onSubmitEditing={createNew}
              />
            </View>
            <Pressable
              onPress={createNew}
              style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.createBtnText}>{t("budgetsHub.createAndOpenBudget")}</Text>
            </Pressable>
          </View>
        ) : null}

        {!items.length ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="sparkles-outline" size={18} color={colors.textTitle} />
            </View>
            <Text style={styles.emptyTitle}>{t("budgetsHub.noBudgetsTitle")}</Text>
            <Text style={styles.emptySub}>
              {t("budgetsHub.noBudgetsSub")}
            </Text>
            <Pressable
              onPress={() => setCreating(true)}
              style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.emptyBtnText}>{t("budgetsHub.createBudget")}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.listWrap}>
            {items.map((item) => (
              <BudgetCard
                key={item.id}
                item={item}
                onOpen={openBudget}
                onDelete={confirmDelete}
                styles={styles}
                colors={colors}
                t={t}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    content: {
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 24,
      gap: 12,
    },
    heroCard: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      padding: 13,
      overflow: "hidden",
      position: "relative",
    },
    heroBubble: {
      position: "absolute",
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.accent18,
      backgroundColor: colors.accent12,
    },
    heroBubbleTop: { width: 118, height: 118, right: -34, top: -34 },
    heroBubbleBottom: { width: 66, height: 66, right: 46, bottom: -28 },
    heroTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    heroIcon: {
      width: 40,
      height: 40,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
      alignItems: "center",
      justifyContent: "center",
    },
    heroTitle: { color: colors.textTitle, fontWeight: "900", fontSize: 18 },
    heroSub: { marginTop: 2, color: colors.textMuted, fontWeight: "700", fontSize: 12 },
    heroAddBtn: {
      width: 44,
      height: 44,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.accent30,
      backgroundColor: colors.accent500,
      alignItems: "center",
      justifyContent: "center",
    },
    statsRow: { marginTop: 12, flexDirection: "row", gap: 8 },
    statCard: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      paddingVertical: 9,
      paddingHorizontal: 9,
    },
    statLabel: { color: colors.textMuted, fontWeight: "800", fontSize: 11 },
    statValue: { marginTop: 3, color: colors.textTitle, fontWeight: "900", fontSize: 12 },
    topLine: {
      marginTop: 9,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      paddingVertical: 7,
      paddingHorizontal: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    topLineText: { flex: 1, color: colors.textMuted, fontWeight: "800", fontSize: 11 },

    createCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    createLabel: {
      color: colors.textMuted,
      fontWeight: "800",
      fontSize: 11,
      marginBottom: 7,
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    createInputWrap: {
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.white12,
      backgroundColor: colors.surface2,
      paddingVertical: 10,
      paddingHorizontal: 11,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    createInput: { flex: 1, color: colors.textTitle, fontWeight: "800", fontSize: 13 },
    createBtn: {
      marginTop: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.accent30,
      backgroundColor: colors.accent500,
      paddingVertical: 10,
      alignItems: "center",
    },
    createBtnText: { color: colors.textOnAccentStrong, fontWeight: "900", fontSize: 12 },

    emptyCard: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      alignItems: "center",
      paddingVertical: 18,
      paddingHorizontal: 14,
    },
    emptyIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    emptyTitle: { color: colors.textTitle, fontWeight: "900", fontSize: 15 },
    emptySub: {
      marginTop: 3,
      color: colors.textMuted,
      fontWeight: "700",
      fontSize: 12,
      textAlign: "center",
      lineHeight: 18,
    },
    emptyBtn: {
      marginTop: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.accent30,
      backgroundColor: colors.accent500,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    emptyBtnText: { color: colors.textOnAccentStrong, fontWeight: "900", fontSize: 12 },

    listWrap: { gap: 10 },
    budgetCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      paddingVertical: 11,
      paddingHorizontal: 11,
    },
    budgetCardTop: { flexDirection: "row", alignItems: "center", gap: 9 },
    budgetIcon: {
      width: 38,
      height: 38,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
      alignItems: "center",
      justifyContent: "center",
    },
    budgetTitle: { color: colors.textTitle, fontWeight: "900", fontSize: 14 },
    budgetSub: { marginTop: 2, color: colors.textMuted, fontWeight: "700", fontSize: 11 },
    budgetPctBadge: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.accent35,
      backgroundColor: colors.accent18,
      minWidth: 50,
      paddingVertical: 5,
      paddingHorizontal: 9,
      alignItems: "center",
    },
    budgetPctText: { color: colors.textTitle, fontWeight: "900", fontSize: 11 },
    progressTrack: {
      marginTop: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
      height: 8,
      overflow: "hidden",
    },
    progressFill: { height: "100%", borderRadius: 999, backgroundColor: colors.accent500 },
    budgetActions: {
      marginTop: 9,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    budgetDeleteBtn: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.danger22,
      backgroundColor: colors.danger12,
      paddingVertical: 7,
      paddingHorizontal: 9,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    budgetDeleteText: { fontWeight: "900", fontSize: 11 },
    budgetOpenHint: { flexDirection: "row", alignItems: "center", gap: 4 },
    budgetOpenText: { color: colors.textMuted, fontWeight: "800", fontSize: 11 },
  });
}
