import React, { useContext, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { GlobalStyles } from "../../constants/styles";
import { CustomizationContext } from "../../store/customization-context";
import { useTranslation } from "../../store/language-context";
import ProgressBar from "./ProgressBar";

export default function BudgetAnalytics({ total, categories }) {
  const { compactMode, highContrast } = useContext(CustomizationContext);
  const colors = GlobalStyles.colors;
  const { t } = useTranslation();

  const border = highContrast ? colors.borderStrong : colors.border;
  const pad = compactMode ? 12 : 16;

  const rows = useMemo(() => {
    const cats = categories || {};
    return Object.entries(cats)
      .map(([name, value]) => ({ name, value: Number(value || 0) }))
      .sort((a, b) => b.value - a.value);
  }, [categories]);

  const used = rows.reduce((sum, row) => sum + row.value, 0);
  const remaining = Number(total || 0) - used;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: border, padding: pad },
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: colors.surface2, borderColor: border },
          ]}
        >
          <Ionicons
            name="analytics-outline"
            size={16}
            color={colors.textTitle}
          />
        </View>
        <Text style={[styles.title, { color: colors.textTitle }]}>
          {t("budgetOverview.analytics")}
        </Text>
      </View>

      <View style={[styles.kpis, { borderColor: border }]}>
        <View style={styles.kpi}>
          <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>
            {t("budgetOverview.allocated")}
          </Text>
          <Text style={[styles.kpiValue, { color: colors.accent500 }]}>
            {used.toFixed(2)} {t("common.currencyCode")}
          </Text>
        </View>

        <View style={[styles.sep, { backgroundColor: border }]} />

        <View style={styles.kpi}>
          <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>
            {t("budgetOverview.remaining")}
          </Text>
          <Text style={[styles.kpiValue, { color: colors.textTitle }]}>
            {remaining.toFixed(2)} {t("common.currencyCode")}
          </Text>
        </View>
      </View>

      <Text style={[styles.section, { color: colors.textMuted }]}>
        {t("budgetOverview.categoryComposition")}
      </Text>

      <View style={{ gap: 10 }}>
        {rows.map((row, index) => {
          const pct = total > 0 ? Math.min(1, row.value / total) : 0;
          const barColor = index === 0 ? colors.accent500 : colors.primary500;

          return (
            <View key={row.name} style={styles.row}>
              <View style={styles.rowTop}>
                <Text
                  style={[styles.rowName, { color: colors.textTitle }]}
                  numberOfLines={1}
                >
                  {row.name}
                </Text>
                <Text style={[styles.rowValue, { color: colors.textBody }]}> 
                  {row.value.toFixed(2)} {t("common.currencyCode")}
                </Text>
              </View>

              <ProgressBar value={pct} color={barColor} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontWeight: "900", fontSize: 14 },

  kpis: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  kpi: { flex: 1 },
  kpiLabel: {
    fontWeight: "900",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  kpiValue: { marginTop: 4, fontWeight: "900", fontSize: 16 },
  sep: { width: 1, height: 42, marginHorizontal: 10 },

  section: {
    fontWeight: "900",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 8,
  },

  row: { marginBottom: 4 },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
  },
  rowName: { fontWeight: "900", flex: 1 },
  rowValue: { fontWeight: "900" },
});
