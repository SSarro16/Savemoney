import React, { useContext, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { GlobalStyles } from "../../constants/styles";
import { CustomizationContext } from "../../store/customization-context";
import { PaymentContext } from "../../store/payment-context";
import { useTranslation } from "../../store/language-context";
import { formatDateIT } from "../../util/date";
import { PAYMENT_METHOD } from "../../util/expenses/expense-presets";

function isEmoji(value) {
  return typeof value === "string" && !value.includes("-");
}

function safeDate(dateLike) {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (!d || isNaN(d.getTime())) return null;
  return d;
}

function ExpenseItem({
  id,
  description,
  amount,
  date,
  icon,
  category,
  payMethod,
  methodId,
  cardId,
  cashId,
}) {
  const navigation = useNavigation();
  const { compactMode, highContrast, showCategoryTag, showPaymentTag } =
    useContext(CustomizationContext);
  const paymentCtx = useContext(PaymentContext);
  const colors = GlobalStyles.colors;
  const { t } = useTranslation();

  const d = safeDate(date);
  const safeIcon = icon || "pricetag-outline";
  const safeCategory =
    typeof category === "string"
      ? category.trim()
      : category
        ? String(category)
        : "";

  const payLabel = useMemo(() => {
    const resolved = paymentCtx.resolveMethodLabel?.({
      methodType: payMethod,
      payMethod,
      methodId: methodId || cardId || cashId || "",
      cardId,
      cashId,
    });
    if (resolved) return String(resolved);
    if (payMethod === PAYMENT_METHOD.CARD) return t("expensesOutput.card");
    if (payMethod === PAYMENT_METHOD.CASH) return t("expensesOutput.cash");
    return "";
  }, [payMethod, methodId, cardId, cashId, paymentCtx, t]);

  function expensePressHandler() {
    navigation.navigate("ManageExpenses", { expenseId: id });
  }

  return (
    <Pressable
      onPress={expensePressHandler}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: highContrast ? colors.borderStrong : colors.border,
          paddingVertical: compactMode ? 9 : 10,
          paddingHorizontal: compactMode ? 11 : 12,
        },
        pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: colors.surface2,
            borderColor: highContrast ? colors.borderStrong : colors.border,
          },
        ]}
      >
        {isEmoji(safeIcon) ? (
          <Text style={styles.iconEmoji}>{safeIcon}</Text>
        ) : (
          <Ionicons name={safeIcon} size={16} color={colors.textTitle} />
        )}
      </View>

      <View style={styles.left}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.description, { color: colors.textTitle }]}
            numberOfLines={1}
          >
            {description || t("expensesOutput.expenseFallbackTitle")}
          </Text>

          {showCategoryTag && !!safeCategory && (
            <View
              style={[
                styles.catPill,
                {
                  backgroundColor: colors.accent16,
                  borderColor: colors.accent28,
                },
              ]}
            >
              <Text
                style={[styles.catText, { color: colors.textTitle }]}
                numberOfLines={1}
              >
                {safeCategory}
              </Text>
            </View>
          )}

          {showPaymentTag && !!payLabel && (
            <View
              style={[
                styles.payPill,
                {
                  backgroundColor: colors.white06,
                  borderColor: colors.white12,
                },
              ]}
            >
              <Ionicons
                name={
                  payMethod === PAYMENT_METHOD.CARD
                    ? "card-outline"
                    : "cash-outline"
                }
                size={12}
                color={colors.textMuted}
              />
              <Text
                style={[styles.payText, { color: colors.textBody }]}
                numberOfLines={1}
              >
                {payLabel}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.metaRow}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color={colors.textMuted}
          />
          <Text style={[styles.date, { color: colors.textBody }]}>
            {d ? formatDateIT(d) : ""}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        <Text style={[styles.amount, { color: colors.accent500 }]}>
          {Number(amount || 0).toFixed(2)} {t("common.currencyCode")}
        </Text>

        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

export default ExpenseItem;

const styles = StyleSheet.create({
  card: {
    marginVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: { fontSize: 16 },

  left: { flex: 1, paddingRight: 8 },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    columnGap: 4,
    rowGap: 4,
    marginBottom: 4,
  },
  description: { fontSize: 15, fontWeight: "800", marginRight: 2, maxWidth: "100%" },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },

  date: { fontSize: 12, fontWeight: "700" },

  catPill: {
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 120,
  },
  catText: { fontWeight: "900", fontSize: 10 },

  payPill: {
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: 130,
  },
  payText: { fontWeight: "900", fontSize: 10 },

  right: { alignItems: "flex-end", justifyContent: "center", gap: 4 },

  amount: { fontSize: 15, fontWeight: "900", letterSpacing: 0.2 },
});
