import React, { useContext, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { GlobalStyles } from "../../constants/styles";
import { useThemeRefresh } from "../../store/theme-context";
import { useTranslation } from "../../store/language-context";
import { ExpensesContext } from "../../store/expenses-context";
import { PaymentContext } from "../../store/payment-context";
import { RecurringType, Cadence } from "../../util/recurring/recurring-utils";
import ErrorOverlay from "../../components/ui/ErrorOverlay";

function isEmoji(value) {
  return typeof value === "string" && !value.includes("-");
}

function safeDate(dateLike) {
  const date = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (!date || Number.isNaN(date.getTime())) return null;
  return date;
}

function formatDateTime(dateLike, localeTag) {
  const date = safeDate(dateLike);
  if (!date) return "-";
  return date.toLocaleDateString(localeTag || "it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function DetailRow({ icon, label, value, styles, colors }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <Ionicons name={icon} size={15} color={colors.textMuted} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export default function ExpenseDetailScreen({ route, navigation }) {
  const params = route?.params || {};
  const detailType = params?.detailType === "RECURRING" ? "RECURRING" : "EXPENSE";
  const expenseId = String(params?.expenseId || "").trim();
  const recurringItem =
    params?.recurringItem && typeof params.recurringItem === "object"
      ? params.recurringItem
      : null;

  useThemeRefresh();
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);
  const { t, localeTag } = useTranslation();
  const expensesCtx = useContext(ExpensesContext);
  const paymentCtx = useContext(PaymentContext);

  const expense = useMemo(() => {
    if (detailType !== "EXPENSE") return null;
    return (expensesCtx.expenses || []).find(
      (item) => String(item?.id || "").trim() === expenseId,
    );
  }, [detailType, expenseId, expensesCtx.expenses]);

  const item = detailType === "RECURRING" ? recurringItem : expense;

  const cadenceLabel = useMemo(() => {
    return {
      [Cadence.DAILY]: t("recurringForm.cadenceDaily"),
      [Cadence.WEEKLY]: t("recurringForm.cadenceWeekly"),
      [Cadence.MONTHLY]: t("recurringForm.cadenceMonthly"),
      [Cadence.YEARLY]: t("recurringForm.cadenceYearly"),
    };
  }, [t]);

  const currencyCode = String(t("common.currencyCode") || "EUR");
  const moneyFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat(localeTag || "it-IT", {
        style: "currency",
        currency: currencyCode,
      });
    } catch {
      return new Intl.NumberFormat("it-IT", {
        style: "currency",
        currency: "EUR",
      });
    }
  }, [localeTag, currencyCode]);

  const formatMoney = (value) => {
    const amount = Number(value || 0);
    return moneyFormatter.format(Number.isFinite(amount) ? amount : 0);
  };

  if (!item) {
    return (
      <ErrorOverlay
        message={t("expenseDetail.notFound")}
        onRetry={() => navigation.goBack()}
        retryLabel={t("common.close")}
      />
    );
  }

  const isRecurring = detailType === "RECURRING";
  const isSubscription = item?.type === RecurringType.SUBSCRIPTION;
  const typeLabel = isRecurring
    ? isSubscription
      ? t("recurring.typeSubscription")
      : t("recurring.typeHabit")
    : t("expenseDetail.expenseLabel");

  const icon = item?.icon || "pricetag-outline";
  const title = String(
    isRecurring
      ? item?.title || t("expenseDetail.recurringFallback")
      : item?.description || t("expensesOutput.expenseFallbackTitle"),
  );

  const notesValue = String(
    isRecurring
      ? item?.description || ""
      : item?.notes || item?.note || item?.description || "",
  ).trim();

  const paymentLabel = isRecurring
    ? t("expenseDetail.notAvailable")
    : paymentCtx.resolveMethodLabel?.(item) || t("expenseDetail.notAvailable");

  const editItem = () => {
    if (!isRecurring) {
      navigation.navigate("ManageExpenses", { expenseId: item.id });
      return;
    }

    const recurringId = String(item?.id || "").trim();
    if (!recurringId) return;

    navigation.navigate("Drawer", {
      screen: "Recurring",
      params: {
        screen: "RecurringHome",
        params: {
          editRecurringId: recurringId,
          requestId: String(Date.now()),
        },
      },
    });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={styles.heroLeft}>
          <View style={styles.iconWrap}>
            {isEmoji(icon) ? (
              <Text style={styles.iconEmoji}>{icon}</Text>
            ) : (
              <Ionicons name={icon} size={20} color={colors.textTitle} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {title}
            </Text>
            <View style={styles.typeChip}>
              <Text style={styles.typeChipText}>{typeLabel}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.heroAmount}>{formatMoney(item?.amount)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t("expenseDetail.mainDetails")}</Text>
        <DetailRow
          icon="cash-outline"
          label={t("expenseDetail.amount")}
          value={formatMoney(item?.amount)}
          styles={styles}
          colors={colors}
        />
        {!isRecurring ? (
          <DetailRow
            icon="calendar-outline"
            label={t("expenseDetail.date")}
            value={formatDateTime(item?.date, localeTag)}
            styles={styles}
            colors={colors}
          />
        ) : null}
        {isRecurring && isSubscription ? (
          <DetailRow
            icon="calendar-outline"
            label={t("expenseDetail.nextDue")}
            value={formatDateTime(item?.nextDue, localeTag)}
            styles={styles}
            colors={colors}
          />
        ) : null}
        <DetailRow
          icon="pricetags-outline"
          label={t("expenseDetail.category")}
          value={String(item?.category || t("expenseDetail.notAvailable"))}
          styles={styles}
          colors={colors}
        />

        {isRecurring ? (
          <DetailRow
            icon="time-outline"
            label={t("expenseDetail.cadence")}
            value={cadenceLabel[item?.cadence] || String(item?.cadence || "-")}
            styles={styles}
            colors={colors}
          />
        ) : (
          <DetailRow
            icon="card-outline"
            label={t("expenseDetail.paymentMethod")}
            value={paymentLabel}
            styles={styles}
            colors={colors}
          />
        )}
      </View>

      {isRecurring ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("expenseDetail.activity")}</Text>
          <DetailRow
            icon="checkmark-done-outline"
            label={t("expenseDetail.lastAction")}
            value={
              isSubscription
                ? formatDateTime(item?.lastPaidAt, localeTag)
                : formatDateTime(item?.lastAddedAt, localeTag)
            }
            styles={styles}
            colors={colors}
          />
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t("expenseDetail.notes")}</Text>
        <Text style={styles.notesText}>
          {notesValue || t("expenseDetail.noNotes")}
        </Text>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.btnGhost, pressed && { opacity: 0.9 }]}
        >
          <Text style={styles.btnGhostText}>{t("common.close")}</Text>
        </Pressable>
        <Pressable
          onPress={editItem}
          style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.9 }]}
        >
          <Ionicons name="create-outline" size={18} color={colors.textOnAccentStrong} />
          <Text style={styles.btnPrimaryText}>{t("expenseDetail.editAction")}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    content: {
      padding: 14,
      paddingBottom: 28,
      gap: 12,
    },
    hero: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      padding: 12,
      gap: 10,
    },
    heroLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
      alignItems: "center",
      justifyContent: "center",
    },
    iconEmoji: { fontSize: 20 },
    heroTitle: { color: colors.textTitle, fontWeight: "900", fontSize: 16 },
    typeChip: {
      alignSelf: "flex-start",
      marginTop: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.accent35,
      backgroundColor: colors.accent18,
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    typeChipText: { color: colors.textTitle, fontWeight: "900", fontSize: 11 },
    heroAmount: { color: colors.accent500, fontWeight: "900", fontSize: 20 },

    card: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      padding: 12,
      gap: 10,
    },
    sectionTitle: {
      color: colors.textMuted,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.3,
      fontSize: 11,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      paddingVertical: 10,
      paddingHorizontal: 10,
    },
    detailLeft: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
    detailLabel: { color: colors.textMuted, fontWeight: "800", fontSize: 12 },
    detailValue: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 12,
      textAlign: "right",
      flexShrink: 1,
      maxWidth: "56%",
    },
    notesText: {
      color: colors.textBody,
      fontWeight: "700",
      fontSize: 13,
      lineHeight: 20,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      padding: 10,
    },
    actionsRow: { flexDirection: "row", gap: 10 },
    btnGhost: {
      flex: 1,
      height: 46,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.white12,
      backgroundColor: colors.white06,
      alignItems: "center",
      justifyContent: "center",
    },
    btnGhostText: { color: colors.textTitle, fontWeight: "900" },
    btnPrimary: {
      flex: 1.4,
      height: 46,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.accent30,
      backgroundColor: colors.accent500,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    btnPrimaryText: { color: colors.textOnAccentStrong, fontWeight: "900" },
  });
}
