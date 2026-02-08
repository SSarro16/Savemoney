import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { GlobalStyles } from "../../constants/styles";
import { AuthContext } from "../../store/auth-context";
import { PaymentContext } from "../../store/payment-context";
import { ExpensesContext } from "../../store/expenses-context";
import { BudgetContext } from "../../store/budget-context";
import { ExpenseCategoriesContext } from "../../store/expense-categories-context";
import { getRecurringItems } from "../../util/recurring/recurring-storage";
import { isDueTodayOrPast } from "../../util/recurring/recurring-utils";

function isAuthHttpError(error) {
  const status = Number(error?.response?.status || 0);
  return status === 401 || status === 403;
}

function SummaryCard({ icon, title, value, subtitle, colors, styles }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardIcon}>
        <Ionicons name={icon} size={18} color={colors.textTitle} />
      </View>
      <Text style={styles.cardTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.cardValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.cardSub} numberOfLines={1}>
        {subtitle}
      </Text>
    </View>
  );
}

export default function UserProfileScreen() {
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);

  const authCtx = useContext(AuthContext);
  const paymentCtx = useContext(PaymentContext);
  const expensesCtx = useContext(ExpensesContext);
  const budgetCtx = useContext(BudgetContext);
  const categoriesCtx = useContext(ExpenseCategoriesContext);

  const [recurringCount, setRecurringCount] = useState(0);
  const [dueRecurringCount, setDueRecurringCount] = useState(0);
  const refreshSessionRef = useRef(authCtx.refreshSession);

  useEffect(() => {
    refreshSessionRef.current = authCtx.refreshSession;
  }, [authCtx.refreshSession]);

  const loadRecurringSummary = useCallback(async () => {
    if (!authCtx.userId || !authCtx.token) return;

    const run = async (token) => {
      const items = await getRecurringItems(authCtx.userId, token);
      const safe = Array.isArray(items) ? items : [];
      setRecurringCount(safe.length);
      setDueRecurringCount(
        safe.filter((x) => x?.type === "SUBSCRIPTION" && isDueTodayOrPast(x?.nextDue))
          .length,
      );
    };

    try {
      await run(authCtx.token);
    } catch (error) {
      if (!isAuthHttpError(error)) return;
      const refreshed = await refreshSessionRef.current?.(true).catch(() => null);
      const nextToken = refreshed?.token;
      if (!nextToken) return;
      await run(nextToken).catch(() => {});
    }
  }, [authCtx.userId, authCtx.token]);

  useEffect(() => {
    loadRecurringSummary().catch(() => {});
  }, [loadRecurringSummary]);

  const fullName = useMemo(() => {
    const joined = [authCtx.firstName, authCtx.lastName]
      .map((x) => String(x || "").trim())
      .filter(Boolean)
      .join(" ");
    return joined || "Profilo";
  }, [authCtx.firstName, authCtx.lastName]);

  const monthExpenseTotal = useMemo(() => {
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    return (expensesCtx.expenses || []).reduce((sum, exp) => {
      const d = exp?.date instanceof Date ? exp.date : new Date(exp?.date);
      if (!d || Number.isNaN(d.getTime())) return sum;
      if (d.getMonth() !== m || d.getFullYear() !== y) return sum;
      return sum + Number(exp?.amount || 0);
    }, 0);
  }, [expensesCtx.expenses]);

  const cardsTotal = useMemo(
    () =>
      (paymentCtx.cards || []).reduce((sum, c) => sum + Number(c?.balance || 0), 0),
    [paymentCtx.cards],
  );
  const cashTotal = useMemo(
    () =>
      (paymentCtx.cashWallets || []).reduce(
        (sum, w) => sum + Number(w?.balance || 0),
        0,
      ),
    [paymentCtx.cashWallets],
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 22 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="person-circle-outline" size={24} color={colors.textTitle} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle} numberOfLines={1}>
            {fullName}
          </Text>
          <Text style={styles.heroSub} numberOfLines={1}>
            {authCtx.profile?.email || "Il tuo riepilogo rapido"}
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        <SummaryCard
          icon="card-outline"
          title="Carte / Wallet"
          value={`${(paymentCtx.cards || []).length} / ${(paymentCtx.cashWallets || []).length}`}
          subtitle={`${(cardsTotal + cashTotal).toFixed(2)} EUR`}
          colors={colors}
          styles={styles}
        />

        <SummaryCard
          icon="wallet-outline"
          title="Spese mese"
          value={`${monthExpenseTotal.toFixed(2)} EUR`}
          subtitle={`${(expensesCtx.expenses || []).length} movimenti`}
          colors={colors}
          styles={styles}
        />

        <SummaryCard
          icon="pie-chart-outline"
          title="Budget"
          value={`${(budgetCtx.budgets || []).length}`}
          subtitle={budgetCtx.activeBudgetMeta?.title || "Nessun budget attivo"}
          colors={colors}
          styles={styles}
        />

        <SummaryCard
          icon="repeat-outline"
          title="Ricorrenze"
          value={`${recurringCount}`}
          subtitle={`${dueRecurringCount} in scadenza`}
          colors={colors}
          styles={styles}
        />
      </View>

      <View style={styles.footerNote}>
        <Ionicons name="pricetags-outline" size={15} color={colors.textMuted} />
        <Text style={styles.footerNoteText}>
          Categorie disponibili: {(categoriesCtx.categories || []).length}
        </Text>
      </View>
    </ScrollView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.primary800,
      paddingHorizontal: 14,
      paddingTop: 12,
    },
    hero: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      paddingVertical: 12,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
    },
    heroIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
    },
    heroTitle: { color: colors.textTitle, fontWeight: "900", fontSize: 16 },
    heroSub: { marginTop: 2, color: colors.textMuted, fontWeight: "700", fontSize: 12 },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    card: {
      width: "48%",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      paddingHorizontal: 11,
      paddingVertical: 11,
    },
    cardIcon: {
      width: 32,
      height: 32,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
      marginBottom: 8,
    },
    cardTitle: { color: colors.textMuted, fontWeight: "900", fontSize: 11 },
    cardValue: {
      marginTop: 2,
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 14,
    },
    cardSub: {
      marginTop: 3,
      color: colors.textMuted,
      fontWeight: "700",
      fontSize: 11,
    },
    footerNote: {
      marginTop: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      paddingVertical: 10,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    footerNoteText: { color: colors.textMuted, fontWeight: "800", fontSize: 12 },
  });
}
