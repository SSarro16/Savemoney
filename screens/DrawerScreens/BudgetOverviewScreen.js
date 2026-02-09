import React, { useContext, useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { BudgetContext } from "../../store/budget-context";
import { GlobalStyles } from "../../constants/styles";
import { useThemeRefresh } from "../../store/theme-context";
import { CustomizationContext } from "../../store/customization-context";
import { useTranslation } from "../../store/language-context";

import PieChart from "../../components/ManageBudget/PieChart";
import BudgetAnalytics from "../../components/ManageBudget/BudgetAnalytics";

const categoryIcons = {
  Spese: "cart-outline",
  Risparmio: "wallet-outline",
  Svago: "game-controller-outline",
  Altro: "ellipsis-horizontal",
};

export default function BudgetOverviewScreen({ route, navigation }) {
  const budgetCtx = useContext(BudgetContext);
  const { compactMode } = useContext(CustomizationContext);
  useThemeRefresh();
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors, compactMode);
  const { t } = useTranslation();
  const [mode, setMode] = useState("PIE");

  useEffect(() => {
    const budgetId = route?.params?.budgetId;
    if (!budgetId) return;
    budgetCtx.selectBudget?.(budgetId).catch(() => {});
  }, [route?.params?.budgetId, budgetCtx]);

  const currentBudgetTitle = useMemo(
    () =>
      String(
          budgetCtx.activeBudgetMeta?.title ||
          budgetCtx.activeBudgetMeta?.name ||
          route?.params?.title ||
          t("drawer.budget"),
      ),
    [
      budgetCtx.activeBudgetMeta?.title,
      budgetCtx.activeBudgetMeta?.name,
      route?.params?.title,
      t,
    ],
  );

  useEffect(() => {
    if (route?.params?.title === currentBudgetTitle) return;
    navigation.setParams({ title: currentBudgetTitle });
  }, [navigation, route?.params?.title, currentBudgetTitle]);

  const colorsPie = [colors.accent500, colors.primary500, colors.primary700, colors.gray500];

  const { total, used, remaining, isOver, categories, categoryValues } = useMemo(() => {
    const t = Number(budgetCtx.total) || 0;
    const cats = budgetCtx.categories || {};
    const vals = Object.values(cats).map((v) => Number(v) || 0);
    const u = vals.reduce((s, v) => s + v, 0);
    const r = t - u;
    return {
      total: t,
      used: u,
      remaining: r,
      isOver: r < 0,
      categories: cats,
      categoryValues: vals,
    };
  }, [budgetCtx.total, budgetCtx.categories]);

  const usagePct = total > 0 ? Math.round((used / total) * 100) : 0;
  const usageRatio = total > 0 ? Math.min(1, Math.max(0, used / total)) : 0;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroCard}>
        <View style={[styles.heroBubble, styles.heroBubbleTop]} />
        <View style={[styles.heroBubble, styles.heroBubbleBottom]} />

        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Ionicons
              name={isOver ? "warning-outline" : "pie-chart-outline"}
              size={17}
              color={colors.textTitle}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{currentBudgetTitle}</Text>
            <Text style={styles.heroSub}>
              {t("budgetOverview.allocatedOfTotal", {
                allocated: budgetCtx.formatEuro(used),
                total: budgetCtx.formatEuro(total),
              })}
            </Text>
          </View>
          <View
            style={[
              styles.heroStatus,
              {
                backgroundColor: isOver ? colors.danger20 : colors.accent18,
                borderColor: isOver ? colors.danger30 : colors.accent35,
              },
            ]}
          >
            <Text style={styles.heroStatusText}>
              {isOver ? t("budgetOverview.overBudget") : t("budgetOverview.ok")}
            </Text>
          </View>
        </View>

        <Text style={styles.heroRemaining}>{budgetCtx.formatEuro(remaining)}</Text>
        <Text style={styles.heroRemainingLabel}>{t("budgetOverview.availableRemaining")}</Text>

        <View style={styles.heroProgressTrack}>
          <View
            style={[
              styles.heroProgressFill,
              {
                width: `${Math.max(4, usageRatio * 100)}%`,
                backgroundColor: isOver ? colors.error500 : colors.accent500,
              },
            ]}
          />
        </View>
        <Text style={styles.heroProgressText}>
          {t("budgetOverview.usedPercentOfBudget", { percent: usagePct })}
        </Text>
      </View>

      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>{t("budgetOverview.allocated")}</Text>
          <Text style={styles.kpiValue}>{budgetCtx.formatEuro(used)}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>{t("budgetOverview.total")}</Text>
          <Text style={styles.kpiValue}>{budgetCtx.formatEuro(total)}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>{t("budgetOverview.remaining")}</Text>
          <Text style={[styles.kpiValue, isOver && { color: colors.error500 }]}>
            {budgetCtx.formatEuro(remaining)}
          </Text>
        </View>
      </View>

      <View style={styles.toggleRow}>
        <Pressable
          onPress={() => setMode("PIE")}
          style={({ pressed }) => [
            styles.toggleBtn,
            mode === "PIE" && styles.toggleBtnActive,
            pressed && { opacity: 0.88 },
          ]}
        >
          <Ionicons
            name="pie-chart-outline"
            size={15}
            color={mode === "PIE" ? colors.textTitle : colors.textMuted}
          />
          <Text
            style={[
              styles.toggleText,
              { color: mode === "PIE" ? colors.textTitle : colors.textMuted },
            ]}
          >
            {t("budgetOverview.distribution")}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setMode("ANALYTICS")}
          style={({ pressed }) => [
            styles.toggleBtn,
            mode === "ANALYTICS" && styles.toggleBtnActive,
            pressed && { opacity: 0.88 },
          ]}
        >
          <Ionicons
            name="analytics-outline"
            size={15}
            color={mode === "ANALYTICS" ? colors.textTitle : colors.textMuted}
          />
          <Text
            style={[
              styles.toggleText,
              { color: mode === "ANALYTICS" ? colors.textTitle : colors.textMuted },
            ]}
          >
            {t("budgetOverview.analytics")}
          </Text>
        </Pressable>
      </View>

      {mode === "PIE" ? (
        <View style={styles.chartCard}>
          <Text style={styles.sectionLabel}>{t("budgetOverview.categoryComposition")}</Text>
          <View style={styles.chartWrap}>
            <PieChart data={categoryValues} colorsPie={colorsPie} size={208} />
          </View>

          <View style={styles.legendList}>
            {Object.entries(categories).map(([cat, value], idx) => {
              const amount = Number(value) || 0;
              const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
              return (
                <View key={cat} style={styles.legendRow}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: colorsPie[idx % colorsPie.length] },
                    ]}
                  />
                  <View style={styles.legendIcon}>
                    <Ionicons
                      name={categoryIcons[cat] ?? "pricetag-outline"}
                      size={15}
                      color={colors.textTitle}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.legendTitle}>{cat}</Text>
                    <Text style={styles.legendSub}>
                      {t("insights.percentOfTotal", { percent: pct })}
                    </Text>
                  </View>
                  <Text style={styles.legendValue}>{budgetCtx.formatEuro(amount)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : (
        <BudgetAnalytics total={total} categories={categories} />
      )}
    </ScrollView>
  );
}

function makeStyles(colors, compactMode) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    content: {
      paddingHorizontal: compactMode ? 12 : 16,
      paddingVertical: compactMode ? 10 : 14,
      paddingBottom: 24,
      gap: 12,
    },
    heroCard: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      padding: 12,
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
    heroBubbleTop: { width: 112, height: 112, right: -34, top: -34 },
    heroBubbleBottom: { width: 62, height: 62, right: 42, bottom: -28 },
    heroTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    heroIcon: {
      width: 38,
      height: 38,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
      alignItems: "center",
      justifyContent: "center",
    },
    heroTitle: { color: colors.textTitle, fontWeight: "900", fontSize: 16 },
    heroSub: { marginTop: 2, color: colors.textMuted, fontWeight: "700", fontSize: 12 },
    heroStatus: {
      borderRadius: 999,
      borderWidth: 1,
      paddingVertical: 5,
      paddingHorizontal: 9,
    },
    heroStatusText: { color: colors.textTitle, fontWeight: "900", fontSize: 11 },
    heroRemaining: { marginTop: 11, color: colors.textTitle, fontWeight: "900", fontSize: 28 },
    heroRemainingLabel: {
      marginTop: 2,
      color: colors.textMuted,
      fontWeight: "800",
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    heroProgressTrack: {
      marginTop: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
      height: 8,
      overflow: "hidden",
    },
    heroProgressFill: { height: "100%", borderRadius: 999 },
    heroProgressText: { marginTop: 6, color: colors.textMuted, fontWeight: "800", fontSize: 12 },

    kpiRow: { flexDirection: "row", gap: 8 },
    kpiCard: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      paddingVertical: 10,
      paddingHorizontal: 9,
    },
    kpiLabel: {
      color: colors.textMuted,
      fontWeight: "800",
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.2,
    },
    kpiValue: { marginTop: 4, color: colors.textTitle, fontWeight: "900", fontSize: 12 },

    toggleRow: { flexDirection: "row", gap: 8 },
    toggleBtn: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    toggleBtnActive: {
      borderColor: colors.accent35,
      backgroundColor: colors.accent18,
    },
    toggleText: { fontWeight: "900", fontSize: 12 },

    chartCard: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    sectionLabel: {
      color: colors.textMuted,
      fontWeight: "900",
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    chartWrap: {
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
      marginBottom: 6,
    },
    legendList: { gap: 8 },
    legendRow: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
      paddingVertical: 9,
      paddingHorizontal: 9,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    legendDot: { width: 10, height: 10, borderRadius: 999 },
    legendIcon: {
      width: 30,
      height: 30,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white08,
      alignItems: "center",
      justifyContent: "center",
    },
    legendTitle: { color: colors.textTitle, fontWeight: "900", fontSize: 12 },
    legendSub: { marginTop: 1, color: colors.textMuted, fontWeight: "700", fontSize: 11 },
    legendValue: { color: colors.textBody, fontWeight: "900", fontSize: 12 },
  });
}
