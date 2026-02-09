import React, { useContext, useEffect, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { GlobalStyles } from "../../constants/styles";
import ManageBudget from "../../components/ManageBudget/ManageBudget";
import { BudgetContext } from "../../store/budget-context";
import { useTranslation } from "../../store/language-context";

export default function BudgetScreen({ navigation, route }) {
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);
  const budgetCtx = useContext(BudgetContext);
  const { t } = useTranslation();

  useEffect(() => {
    const budgetId = route?.params?.budgetId;
    if (!budgetId) return;
    budgetCtx.selectBudget?.(budgetId).catch(() => {});
  }, [route?.params?.budgetId, budgetCtx]);

  const title = String(
    budgetCtx.activeBudgetMeta?.title ||
      budgetCtx.activeBudgetMeta?.name ||
      t("budgetsHub.newBudgetFallback"),
  );

  const stats = useMemo(() => {
    const total = Number(budgetCtx.total || 0);
    const allocated = Object.values(budgetCtx.categories || {}).reduce(
      (sum, value) => sum + Number(value || 0),
      0,
    );
    const remaining = total - allocated;
    const pct = total > 0 ? Math.round((allocated / total) * 100) : 0;
    return { total, allocated, remaining, pct };
  }, [budgetCtx.total, budgetCtx.categories]);

  return (
    <View style={styles.screen}>
      <View style={styles.heroCard}>
        <View style={[styles.heroBubble, styles.heroBubbleTop]} />
        <View style={[styles.heroBubble, styles.heroBubbleBottom]} />
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Ionicons name="construct-outline" size={17} color={colors.textTitle} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.heroSub}>{t("budgetScreen.heroSub")}</Text>
          </View>
        </View>
        <View style={styles.kpisRow}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>{t("budgetOverview.allocated")}</Text>
            <Text style={styles.kpiValue}>{stats.allocated.toFixed(2)} {t("common.currencyCode")}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>{t("budgetOverview.remaining")}</Text>
            <Text style={styles.kpiValue}>{stats.remaining.toFixed(2)} {t("common.currencyCode")}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>{t("budgetOverview.usage")}</Text>
            <Text style={styles.kpiValue}>{stats.pct}%</Text>
          </View>
        </View>
      </View>

      <View style={styles.formWrap}>
        <ManageBudget onSave={() => navigation.goBack()} />
      </View>
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg, padding: 12, gap: 10 },
    heroCard: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      paddingVertical: 12,
      paddingHorizontal: 12,
      position: "relative",
      overflow: "hidden",
    },
    heroBubble: {
      position: "absolute",
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.accent18,
      backgroundColor: colors.accent12,
    },
    heroBubbleTop: { width: 100, height: 100, right: -28, top: -30 },
    heroBubbleBottom: { width: 58, height: 58, right: 38, bottom: -24 },
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
    kpisRow: { marginTop: 10, flexDirection: "row", gap: 8 },
    kpiBox: {
      flex: 1,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      paddingVertical: 8,
      paddingHorizontal: 8,
    },
    kpiLabel: { color: colors.textMuted, fontWeight: "800", fontSize: 11 },
    kpiValue: { marginTop: 3, color: colors.textTitle, fontWeight: "900", fontSize: 12 },
    formWrap: {
      flex: 1,
      borderRadius: 20,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
    },
  });
}
