import React, { useContext, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { BudgetContext } from "../../store/budget-context";
import { GlobalStyles } from "../../constants/styles";
import { CustomizationContext } from "../../store/customization-context";

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
  const { compactMode, highContrast } = useContext(CustomizationContext);

  const colors = GlobalStyles.colors;
  const [mode, setMode] = useState("PIE"); // "PIE" | "ANALYTICS"

  useEffect(() => {
    const budgetId = route?.params?.budgetId;
    if (!budgetId) return;
    budgetCtx.selectBudget?.(budgetId).catch(() => {});
  }, [route?.params?.budgetId, budgetCtx]);

  const currentBudgetTitle = useMemo(() => {
    return String(
      budgetCtx.activeBudgetMeta?.title ||
        budgetCtx.activeBudgetMeta?.name ||
        route?.params?.title ||
        "Budget",
    );
  }, [
    budgetCtx.activeBudgetMeta?.title,
    budgetCtx.activeBudgetMeta?.name,
    route?.params?.title,
  ]);

  useEffect(() => {
    if (route?.params?.title === currentBudgetTitle) return;
    navigation.setParams({ title: currentBudgetTitle });
  }, [navigation, route?.params?.title, currentBudgetTitle]);

  const colorsPie = [
    colors.accent500,
    colors.primary500,
    colors.primary700,
    colors.gray500,
  ];

  const { total, used, remaining, isOver, categories, categoryValues } =
    useMemo(() => {
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

  const border = highContrast ? colors.borderStrong : colors.border;
  const pad = compactMode ? 12 : 16;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: pad, paddingBottom: 24, gap: 12 }}
      showsVerticalScrollIndicator={false}
    >
      {/* HERO */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: colors.surface2,
            borderColor: border,
            padding: pad,
          },
        ]}
      >
        <View style={styles.heroTop}>
          <View
            style={[
              styles.heroIcon,
              { backgroundColor: colors.surface, borderColor: border },
            ]}
          >
            <Ionicons
              name={isOver ? "warning-outline" : "pie-chart-outline"}
              size={18}
              color={colors.textTitle}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: colors.textTitle }]}>
              {currentBudgetTitle}
            </Text>
            <Text style={[styles.heroSub, { color: colors.textMuted }]}>
              {budgetCtx.formatEuro(used)} allocati su {budgetCtx.formatEuro(total)}
            </Text>
          </View>

          <View
            style={[
              styles.pill,
              {
                backgroundColor: isOver ? colors.danger20 : colors.accent16,
                borderColor: isOver ? colors.danger30 : colors.accent28,
              },
            ]}
          >
            <Text style={[styles.pillText, { color: colors.textTitle }]}>
              {isOver ? "SFORATO" : "OK"}
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.remainingValue,
            { color: isOver ? colors.textTitle : colors.textTitle },
          ]}
        >
          {budgetCtx.formatEuro(remaining)}
        </Text>
        <Text style={[styles.remainingLabel, { color: colors.textMuted }]}>
          Rimanenti
        </Text>

        <View style={[styles.meterTrack, { backgroundColor: colors.white10 }]}>
          <View
            style={[
              styles.meterFill,
              {
                width: `${Math.max(6, usageRatio * 100)}%`,
                backgroundColor: isOver ? colors.error500 : colors.accent500,
              },
            ]}
          />
        </View>
        <Text style={[styles.meterText, { color: colors.textMuted }]}>
          Utilizzato {usagePct}% del budget
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.surface, borderColor: border },
          ]}
        >
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Allocati</Text>
          <Text style={[styles.statValue, { color: colors.textTitle }]}>
            {budgetCtx.formatEuro(used)}
          </Text>
        </View>
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.surface, borderColor: border },
          ]}
        >
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Totale</Text>
          <Text style={[styles.statValue, { color: colors.textTitle }]}>
            {budgetCtx.formatEuro(total)}
          </Text>
        </View>
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.surface, borderColor: border },
          ]}
        >
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Residuo</Text>
          <Text
            style={[
              styles.statValue,
              { color: isOver ? colors.error500 : colors.textTitle },
            ]}
          >
            {budgetCtx.formatEuro(remaining)}
          </Text>
        </View>
      </View>

      {/* Toggle */}
      <View style={styles.toggleRow}>
        <Pressable
          onPress={() => setMode("PIE")}
          style={({ pressed }) => [
            styles.toggleBtn,
            {
              backgroundColor: colors.surface,
              borderColor: border,
              paddingVertical: compactMode ? 10 : 12,
            },
            mode === "PIE" && {
              backgroundColor: colors.accent18,
              borderColor: colors.accent35,
            },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="pie-chart-outline"
            size={16}
            color={mode === "PIE" ? colors.textOnAccent : colors.textMuted}
          />
            <Text
              style={[
                styles.toggleText,
                { color: mode === "PIE" ? colors.textOnAccent : colors.textBody },
              ]}
            >
            Torta
            </Text>
        </Pressable>

        <Pressable
          onPress={() => setMode("ANALYTICS")}
          style={({ pressed }) => [
            styles.toggleBtn,
            {
              backgroundColor: colors.surface,
              borderColor: border,
              paddingVertical: compactMode ? 10 : 12,
            },
            mode === "ANALYTICS" && {
              backgroundColor: colors.accent18,
              borderColor: colors.accent35,
            },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="analytics-outline"
            size={16}
            color={
              mode === "ANALYTICS" ? colors.textOnAccent : colors.textMuted
            }
          />
          <Text
            style={[
              styles.toggleText,
              {
                color:
                  mode === "ANALYTICS" ? colors.textOnAccent : colors.textBody,
              },
            ]}
          >
            Analisi
          </Text>
        </Pressable>
      </View>

      {/* CONTENT */}
      {mode === "PIE" ? (
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: border,
              padding: pad,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            Distribuzione
          </Text>

          <View style={styles.pieBox}>
            <PieChart data={categoryValues} colorsPie={colorsPie} size={210} />
          </View>

          <View style={{ marginTop: 8 }}>
            {Object.entries(categories).map(([cat, val], idx) => {
              const v = Number(val) || 0;
              const pct = total > 0 ? (v / total) * 100 : 0;

              return (
                <View
                  key={cat}
                  style={[styles.legendRow, { borderColor: border }]}
                >
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: colorsPie[idx % colorsPie.length] },
                    ]}
                  />

                  <View
                    style={[
                      styles.iconBadge,
                      { backgroundColor: colors.surface2, borderColor: border },
                    ]}
                  >
                    <Ionicons
                      name={categoryIcons[cat] ?? "pricetag-outline"}
                      size={18}
                      color={colors.textTitle}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.legendTitle, { color: colors.textTitle }]}
                    >
                      {cat}
                    </Text>
                    <Text
                      style={[styles.legendSub, { color: colors.textMuted }]}
                    >
                      {pct.toFixed(0)}% del totale
                    </Text>
                  </View>

                  <Text
                    style={[styles.legendValue, { color: colors.textBody }]}
                  >
                    {budgetCtx.formatEuro(v)}
                  </Text>
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

const styles = StyleSheet.create({
  heroCard: { borderRadius: 18, borderWidth: 1 },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  heroIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: { fontWeight: "900", fontSize: 16 },
  heroSub: { marginTop: 2, fontWeight: "800" },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: { fontWeight: "900", fontSize: 12, letterSpacing: 0.4 },

  remainingValue: { marginTop: 12, fontWeight: "900", fontSize: 28 },
  remainingLabel: {
    marginTop: 4,
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  meterTrack: {
    marginTop: 10,
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  meterFill: { height: "100%", borderRadius: 999 },
  meterText: { marginTop: 6, fontWeight: "800", fontSize: 12 },

  statsRow: { flexDirection: "row", gap: 8 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  statLabel: { fontWeight: "800", fontSize: 11 },
  statValue: { marginTop: 4, fontWeight: "900", fontSize: 12 },

  toggleRow: { flexDirection: "row", gap: 10 },
  toggleBtn: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  toggleText: { fontWeight: "900" },
  pressed: { opacity: 0.88 },

  card: { borderRadius: 18, borderWidth: 1 },
  sectionTitle: {
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  pieBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },

  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  colorDot: { width: 12, height: 12, borderRadius: 999 },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  legendTitle: { fontWeight: "900" },
  legendSub: { marginTop: 2, fontWeight: "800", fontSize: 12 },
  legendValue: { fontWeight: "900" },
});
