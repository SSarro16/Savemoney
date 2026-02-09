import React, { useContext } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlobalStyles } from "../../constants/styles";
import { CustomizationContext } from "../../store/customization-context";
import { useTranslation } from "../../store/language-context";

function ExpensesSummary({ expenses, periodName }) {
  const { compactMode, highContrast } = useContext(CustomizationContext);
  const colors = GlobalStyles.colors;
  const { t } = useTranslation();

  const expensesSum = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface2,
          borderColor: highContrast ? colors.borderStrong : colors.border,
          padding: compactMode ? 12 : 14,
        },
      ]}
    >
      <View style={styles.left}>
        <View
          style={[
            styles.pill,
            {
              backgroundColor: colors.surface,
              borderColor: highContrast ? colors.borderStrong : colors.border,
            },
          ]}
        >
          <Ionicons name="time-outline" size={14} color={colors.textTitle} />
          <Text style={[styles.pillText, { color: colors.textBody }]} numberOfLines={1}>
            {periodName}
          </Text>
        </View>

        <Text style={[styles.label, { color: colors.textMuted }]}>
          {t("expensesOutput.totalExpenses")}
        </Text>
        <Text style={[styles.sum, { color: colors.textTitle }]}>
          {expensesSum.toFixed(2)}
          <Text style={[styles.currency, { color: colors.textBody }]}> {t("common.currencyCode")}</Text>
        </Text>
      </View>

      <View
        style={[
          styles.divider,
          {
            backgroundColor: highContrast ? colors.borderStrong : colors.border,
          },
        ]}
      />

      <View style={styles.right}>
        <View
          style={[
            styles.badge,
            { backgroundColor: colors.accent500, borderColor: colors.accent30 },
          ]}
        >
          <Ionicons
            name="receipt-outline"
            size={16}
            color={colors.textOnAccentStrong}
          />
          <Text style={[styles.badgeText, { color: colors.textOnAccentStrong }]}>
            {expenses.length}
          </Text>
        </View>
        <Text style={[styles.badgeHint, { color: colors.textMuted }]}>
          {t("expensesOutput.entries")}
        </Text>
      </View>
    </View>
  );
}

export default ExpensesSummary;

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  left: { flex: 1, paddingRight: 12 },

  pill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 10,
    maxWidth: "100%",
  },
  pillText: { flexShrink: 1, fontWeight: "900", fontSize: 12 },

  label: {
    fontWeight: "900",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  sum: { fontSize: 26, fontWeight: "900" },
  currency: { fontSize: 18, fontWeight: "900" },

  divider: { width: 1, height: 46, marginHorizontal: 10 },

  right: { alignItems: "center", justifyContent: "center", width: 72 },
  badge: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    borderWidth: 1,
  },
  badgeText: { fontWeight: "900", fontSize: 16 },
  badgeHint: { marginTop: 6, fontWeight: "800", fontSize: 12 },
});
