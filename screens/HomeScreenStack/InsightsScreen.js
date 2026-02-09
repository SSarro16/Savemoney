import React, { useContext, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ExpensesContext } from "../../store/expenses-context";
import { GlobalStyles } from "../../constants/styles";
import { useThemeRefresh } from "../../store/theme-context";
import { CustomizationContext } from "../../store/customization-context";
import { exportCurrentMonthCsv } from "../../util/reports/monthly-csv-export";
import { logger } from "../../util/logger";
import { useTranslation } from "../../store/language-context";

const PRESETS = {
  DAYS_7: "DAYS_7",
  MONTH_1: "MONTH_1",
  YEAR_1: "YEAR_1",
};

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function getPresetRange(preset) {
  const today = endOfDay(new Date());
  if (preset === PRESETS.DAYS_7) {
    const d = new Date(today);
    d.setDate(d.getDate() - 7);
    return { from: startOfDay(d), to: today };
  }
  if (preset === PRESETS.MONTH_1) {
    const d = new Date(today);
    d.setMonth(d.getMonth() - 1);
    return { from: startOfDay(d), to: today };
  }
  if (preset === PRESETS.YEAR_1) {
    const d = new Date(today);
    d.setFullYear(d.getFullYear() - 1);
    return { from: startOfDay(d), to: today };
  }
  return { from: null, to: null };
}

function euro(n) {
  const v = Number(n || 0);
  return `${v.toFixed(2)} EUR`;
}

function PresetPill({ label, active, onPress, styles, colors }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.presetPill,
        active && styles.presetPillActive,
        pressed && { opacity: 0.88 },
      ]}
    >
      <Text
        style={[
          styles.presetPillText,
          { color: active ? colors.textTitle : colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function MetricTile({ icon, label, value, sub, styles, colors }) {
  return (
    <View style={styles.metricTile}>
      <View style={styles.metricIcon}>
        <Ionicons name={icon} size={14} color={colors.textTitle} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue} numberOfLines={1}>
        {value}
      </Text>
      {!!sub ? (
        <Text style={styles.metricSub} numberOfLines={1}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

function SectionCard({ title, icon, children, styles, colors }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Ionicons name={icon} size={14} color={colors.textTitle} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function InsightsScreen() {
  const expensesCtx = useContext(ExpensesContext);
  const { compactMode } = useContext(CustomizationContext);
  useThemeRefresh();
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors, compactMode);
  const { t } = useTranslation();

  const [preset, setPreset] = useState(PRESETS.DAYS_7);
  const [exporting, setExporting] = useState(false);
  const range = useMemo(() => getPresetRange(preset), [preset]);

  const filtered = useMemo(() => {
    const { from, to } = range;
    return (expensesCtx.expenses || []).filter((e) => {
      const d = e.date instanceof Date ? e.date : new Date(e.date);
      if (!d || Number.isNaN(d.getTime())) return false;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [expensesCtx.expenses, range]);

  const total = useMemo(
    () => filtered.reduce((sum, e) => sum + Number(e.amount || 0), 0),
    [filtered],
  );

  const byCategory = useMemo(() => {
    const map = new Map();
    for (const e of filtered) {
      const c =
        String(e.category || t("expenses.uncategorized")).trim() ||
        t("expenses.uncategorized");
      map.set(c, (map.get(c) || 0) + Number(e.amount || 0));
    }
    return Array.from(map.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [filtered]);

  const byMethod = useMemo(() => {
    const map = new Map();
    for (const e of filtered) {
      const type =
        e?.methodType === "CARD" || e?.payMethod === "CARD" ? "CARD" : "CASH";
      map.set(type, (map.get(type) || 0) + Number(e.amount || 0));
    }
    return [
      { key: "CARD", label: t("expensesOutput.card"), amount: map.get("CARD") || 0 },
      { key: "CASH", label: t("expensesOutput.cash"), amount: map.get("CASH") || 0 },
    ];
  }, [filtered, t]);

  const topDescriptions = useMemo(() => {
    const map = new Map();
    for (const e of filtered) {
      const d = String(e.description || "").trim();
      if (!d) continue;
      const key = d.toLowerCase();
      map.set(key, (map.get(key) || 0) + Number(e.amount || 0));
    }
    return Array.from(map.entries())
      .map(([desc, amount]) => ({ desc, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [filtered]);

  const topCategory = byCategory[0] || null;
  const averageSpend = filtered.length ? total / filtered.length : 0;
  const maxCategory = topCategory?.amount || 0;
  const cardAmount = byMethod.find((x) => x.key === "CARD")?.amount || 0;
  const cashAmount = byMethod.find((x) => x.key === "CASH")?.amount || 0;
  const cardPct = total > 0 ? Math.round((cardAmount / total) * 100) : 0;
  const cashPct = total > 0 ? Math.round((cashAmount / total) * 100) : 0;

  const handleExportMonthlyCsv = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const result = await exportCurrentMonthCsv(expensesCtx.expenses || []);
      Alert.alert(
        t("insights.reportCreatedTitle"),
        t("insights.reportCreatedMessage", { count: result.count, total: euro(result.total) }),
      );
    } catch (error) {
      logger.warn("Monthly CSV export failed", error);
      Alert.alert(t("common.error"), t("insights.reportFailedMessage"));
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroCard}>
        <View style={[styles.heroBubble, styles.heroBubbleA]} />
        <View style={[styles.heroBubble, styles.heroBubbleB]} />
        <View style={styles.heroTopRow}>
          <View style={styles.heroIcon}>
            <Ionicons name="trending-up-outline" size={17} color={colors.textTitle} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{t("insights.heroTitle")}</Text>
            <Text style={styles.heroSub}>{t("insights.heroSub")}</Text>
          </View>
          <Pressable
            onPress={handleExportMonthlyCsv}
            style={({ pressed }) => [styles.exportBtn, pressed && { opacity: 0.88 }]}
          >
            <Ionicons name="download-outline" size={14} color={colors.textTitle} />
            <Text style={styles.exportBtnText}>
              {exporting ? t("insights.exporting") : t("insights.exportMonth")}
            </Text>
          </Pressable>
        </View>

        <View style={styles.presetRow}>
          <PresetPill
            label={t("insights.preset7Days")}
            active={preset === PRESETS.DAYS_7}
            onPress={() => setPreset(PRESETS.DAYS_7)}
            styles={styles}
            colors={colors}
          />
          <PresetPill
            label={t("insights.preset1Month")}
            active={preset === PRESETS.MONTH_1}
            onPress={() => setPreset(PRESETS.MONTH_1)}
            styles={styles}
            colors={colors}
          />
          <PresetPill
            label={t("insights.preset1Year")}
            active={preset === PRESETS.YEAR_1}
            onPress={() => setPreset(PRESETS.YEAR_1)}
            styles={styles}
            colors={colors}
          />
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <MetricTile
          icon="wallet-outline"
          label={t("insights.totalPeriod")}
          value={euro(total)}
          sub={t("insights.movementsCount", { count: filtered.length })}
          styles={styles}
          colors={colors}
        />
        <MetricTile
          icon="stats-chart-outline"
          label={t("insights.averageTicket")}
          value={euro(averageSpend)}
          sub={filtered.length ? t("insights.perMovement") : t("insights.noData")}
          styles={styles}
          colors={colors}
        />
        <MetricTile
          icon="ribbon-outline"
          label={t("insights.topCategory")}
          value={topCategory?.category || t("common.none")}
          sub={topCategory ? euro(topCategory.amount) : ""}
          styles={styles}
          colors={colors}
        />
      </View>

      <SectionCard title={t("insights.categoryDistribution")} icon="pricetags-outline" styles={styles} colors={colors}>
        {!byCategory.length ? (
          <Text style={styles.emptyText}>{t("insights.noCategoriesInPeriod")}</Text>
        ) : (
          <View style={styles.rankWrap}>
            {byCategory.slice(0, 6).map((item, index) => {
              const relative = maxCategory > 0 ? Math.max(6, Math.round((item.amount / maxCategory) * 100)) : 0;
              const share = total > 0 ? Math.round((item.amount / total) * 100) : 0;
              return (
                <View key={item.category} style={styles.rankRow}>
                  <View style={styles.rankHead}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankBadgeText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.rankLabel} numberOfLines={1}>
                      {item.category}
                    </Text>
                    <Text style={styles.rankValue}>{euro(item.amount)}</Text>
                  </View>
                  <View style={styles.rankTrack}>
                    <View style={[styles.rankFill, { width: `${relative}%` }]} />
                  </View>
                  <Text style={styles.rankShare}>{t("insights.percentOfTotal", { percent: share })}</Text>
                </View>
              );
            })}
          </View>
        )}
      </SectionCard>

      <SectionCard title={t("insights.paymentMethods")} icon="card-outline" styles={styles} colors={colors}>
        <View style={styles.methodGrid}>
          <View style={styles.methodCard}>
            <Text style={styles.methodLabel}>{t("expensesOutput.card")}</Text>
            <Text style={styles.methodValue}>{euro(cardAmount)}</Text>
            <Text style={styles.methodSub}>{t("insights.percentOfTotal", { percent: cardPct })}</Text>
          </View>
          <View style={styles.methodCard}>
            <Text style={styles.methodLabel}>{t("expensesOutput.cash")}</Text>
            <Text style={styles.methodValue}>{euro(cashAmount)}</Text>
            <Text style={styles.methodSub}>{t("insights.percentOfTotal", { percent: cashPct })}</Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard title={t("insights.topEntries")} icon="trophy-outline" styles={styles} colors={colors}>
        {!topDescriptions.length ? (
          <Text style={styles.emptyText}>{t("insights.noDescriptionsInPeriod")}</Text>
        ) : (
          <View style={styles.topList}>
            {topDescriptions.map((item, index) => (
              <View key={item.desc} style={styles.topRow}>
                <View style={styles.topRank}>
                  <Text style={styles.topRankText}>{index + 1}</Text>
                </View>
                <Text style={styles.topDesc} numberOfLines={1}>
                  {item.desc}
                </Text>
                <Text style={styles.topAmount}>{euro(item.amount)}</Text>
              </View>
            ))}
          </View>
        )}
      </SectionCard>
    </ScrollView>
  );
}

function makeStyles(colors, compactMode) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: {
      padding: compactMode ? 12 : 16,
      paddingBottom: 28,
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
    heroBubbleA: { width: 126, height: 126, right: -32, top: -34 },
    heroBubbleB: { width: 66, height: 66, right: 42, bottom: -28 },
    heroTopRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    heroIcon: {
      width: 38,
      height: 38,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.accent35,
      backgroundColor: colors.accent18,
      alignItems: "center",
      justifyContent: "center",
    },
    heroTitle: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 19,
    },
    heroSub: {
      marginTop: 2,
      color: colors.textMuted,
      fontWeight: "700",
      fontSize: 12,
    },
    exportBtn: {
      borderRadius: 11,
      borderWidth: 1,
      borderColor: colors.white12,
      backgroundColor: colors.surface2,
      paddingHorizontal: 10,
      paddingVertical: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    exportBtnText: { color: colors.textTitle, fontWeight: "900", fontSize: 11 },
    presetRow: {
      marginTop: 12,
      flexDirection: "row",
      gap: 8,
    },
    presetPill: {
      flex: 1,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      paddingVertical: 9,
      alignItems: "center",
    },
    presetPillActive: {
      borderColor: colors.accent35,
      backgroundColor: colors.accent18,
    },
    presetPillText: { fontWeight: "900", fontSize: 12 },

    metricsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    metricTile: {
      width: "48%",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      paddingVertical: 10,
      paddingHorizontal: 10,
    },
    metricIcon: {
      width: 30,
      height: 30,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 7,
    },
    metricLabel: { color: colors.textMuted, fontWeight: "900", fontSize: 11 },
    metricValue: { marginTop: 2, color: colors.textTitle, fontWeight: "900", fontSize: 14 },
    metricSub: { marginTop: 2, color: colors.textMuted, fontWeight: "700", fontSize: 11 },

    sectionCard: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 10,
    },
    sectionIcon: {
      width: 30,
      height: 30,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
      alignItems: "center",
      justifyContent: "center",
    },
    sectionTitle: { color: colors.textTitle, fontWeight: "900", fontSize: 14 },
    emptyText: { color: colors.textFaint, fontWeight: "700", fontSize: 12 },

    rankWrap: { gap: 10 },
    rankRow: { gap: 5 },
    rankHead: { flexDirection: "row", alignItems: "center", gap: 8 },
    rankBadge: {
      width: 22,
      height: 22,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.accent35,
      backgroundColor: colors.accent18,
      alignItems: "center",
      justifyContent: "center",
    },
    rankBadgeText: { color: colors.textTitle, fontWeight: "900", fontSize: 11 },
    rankLabel: { flex: 1, color: colors.textTitle, fontWeight: "800", fontSize: 12 },
    rankValue: { color: colors.accent500, fontWeight: "900", fontSize: 12 },
    rankTrack: {
      height: 9,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
      overflow: "hidden",
    },
    rankFill: { height: "100%", borderRadius: 999, backgroundColor: colors.accent500 },
    rankShare: { color: colors.textMuted, fontWeight: "700", fontSize: 11 },

    methodGrid: { flexDirection: "row", gap: 10 },
    methodCard: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
      paddingVertical: 10,
      paddingHorizontal: 10,
    },
    methodLabel: { color: colors.textMuted, fontWeight: "800", fontSize: 12 },
    methodValue: { marginTop: 3, color: colors.textTitle, fontWeight: "900", fontSize: 14 },
    methodSub: { marginTop: 2, color: colors.textMuted, fontWeight: "700", fontSize: 11 },

    topList: { gap: 8 },
    topRow: {
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
    topRank: {
      width: 22,
      height: 22,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.white12,
      backgroundColor: colors.white08,
      alignItems: "center",
      justifyContent: "center",
    },
    topRankText: { color: colors.textTitle, fontWeight: "900", fontSize: 11 },
    topDesc: { flex: 1, color: colors.textTitle, fontWeight: "800", fontSize: 12 },
    topAmount: { color: colors.textBody, fontWeight: "900", fontSize: 12 },
  });
}
