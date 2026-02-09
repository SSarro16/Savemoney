import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { GlobalStyles } from "../../constants/styles";
import { AuthContext } from "../../store/auth-context";
import { PaymentContext } from "../../store/payment-context";
import { ExpensesContext } from "../../store/expenses-context";
import { BudgetContext } from "../../store/budget-context";
import { ExpenseCategoriesContext } from "../../store/expense-categories-context";
import { getRecurringItems } from "../../util/recurring/recurring-storage";
import { isDueTodayOrPast } from "../../util/recurring/recurring-utils";
import { exportCurrentMonthCsv } from "../../util/reports/monthly-csv-export";
import AppLogo from "../../components/ui/AppLogo";

function isAuthHttpError(error) {
  const status = Number(error?.response?.status || 0);
  return status === 401 || status === 403;
}

function MetricCard({ icon, title, value, subtitle, colors, styles }) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIcon}>
        <Ionicons name={icon} size={18} color={colors.textTitle} />
      </View>
      <Text style={styles.metricTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.metricValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.metricSub} numberOfLines={1}>
        {subtitle}
      </Text>
    </View>
  );
}

function QuickAction({ icon, title, subtitle, onPress, colors, styles }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.white10,
        },
        pressed && { opacity: 0.9 },
      ]}
    >
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={16} color={colors.textTitle} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.actionTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.actionSub} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

function InfoRow({ icon, label, value, styles, colors }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={15} color={colors.textMuted} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export default function UserProfileScreen({ navigation }) {
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);

  const authCtx = useContext(AuthContext);
  const paymentCtx = useContext(PaymentContext);
  const expensesCtx = useContext(ExpensesContext);
  const budgetCtx = useContext(BudgetContext);
  const categoriesCtx = useContext(ExpenseCategoriesContext);

  const [recurringCount, setRecurringCount] = useState(0);
  const [dueRecurringCount, setDueRecurringCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
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
    return joined || "Profilo utente";
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

  const userIdShort = String(authCtx.userId || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 10);

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const result = await exportCurrentMonthCsv(expensesCtx.expenses || []);
      Alert.alert(
        "Export completato",
        `${result.count} movimenti - Totale ${Number(result.total || 0).toFixed(2)} EUR`,
      );
    } catch {
      Alert.alert("Export fallito", "Impossibile esportare il report CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={[styles.heroBubble, styles.heroBubbleTop]} />
        <View style={[styles.heroBubble, styles.heroBubbleBottom]} />
        <AppLogo size={56} />
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle} numberOfLines={1}>
            {fullName}
          </Text>
          <Text style={styles.heroSub} numberOfLines={1}>
            {authCtx.profile?.email || "Gestisci account e preferenze"}
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <InfoRow
          icon="mail-outline"
          label="Email"
          value={authCtx.profile?.email || "-"}
          styles={styles}
          colors={colors}
        />
        <InfoRow
          icon="id-card-outline"
          label="ID"
          value={userIdShort || "n/d"}
          styles={styles}
          colors={colors}
        />
        <InfoRow
          icon="pricetags-outline"
          label="Categorie"
          value={String((categoriesCtx.categories || []).length)}
          styles={styles}
          colors={colors}
        />
      </View>

      <Text style={styles.sectionTitle}>Panoramica</Text>
      <View style={styles.metricGrid}>
        <MetricCard
          icon="card-outline"
          title="Carte / Wallet"
          value={`${(paymentCtx.cards || []).length} / ${(paymentCtx.cashWallets || []).length}`}
          subtitle={`${(cardsTotal + cashTotal).toFixed(2)} EUR`}
          colors={colors}
          styles={styles}
        />
        <MetricCard
          icon="wallet-outline"
          title="Spese mese"
          value={`${monthExpenseTotal.toFixed(2)} EUR`}
          subtitle={`${(expensesCtx.expenses || []).length} movimenti`}
          colors={colors}
          styles={styles}
        />
        <MetricCard
          icon="pie-chart-outline"
          title="Budget"
          value={`${(budgetCtx.budgets || []).length}`}
          subtitle={budgetCtx.activeBudgetMeta?.title || "Nessun attivo"}
          colors={colors}
          styles={styles}
        />
        <MetricCard
          icon="repeat-outline"
          title="Ricorrenze"
          value={`${recurringCount}`}
          subtitle={`${dueRecurringCount} in scadenza`}
          colors={colors}
          styles={styles}
        />
      </View>

      <Text style={styles.sectionTitle}>Azioni rapide</Text>
      <View style={styles.actionsWrap}>
        <QuickAction
          icon={isExporting ? "time-outline" : "download-outline"}
          title={isExporting ? "Export in corso..." : "Esporta report mese"}
          subtitle="CSV con spese del mese corrente"
          onPress={handleExport}
          colors={colors}
          styles={styles}
        />
        <QuickAction
          icon="flash-outline"
          title="Impostazioni rapide"
          subtitle="Accessibilita, notifiche, modalita compatta"
          onPress={() => navigation.navigate("QuickSettings")}
          colors={colors}
          styles={styles}
        />
        <QuickAction
          icon="color-palette-outline"
          title="Personalizzazione"
          subtitle="Scegli tema e stile dell'app"
          onPress={() => navigation.navigate("CustomizeHome")}
          colors={colors}
          styles={styles}
        />
        <QuickAction
          icon="pricetags-outline"
          title="Gestione categorie"
          subtitle="Aggiungi o modifica categorie spesa"
          onPress={() => navigation.navigate("CategoriesManager")}
          colors={colors}
          styles={styles}
        />
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
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      paddingVertical: 14,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 12,
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
    heroBubbleTop: {
      width: 100,
      height: 100,
      right: -32,
      top: -30,
    },
    heroBubbleBottom: {
      width: 62,
      height: 62,
      right: 30,
      bottom: -28,
    },
    heroTitle: { color: colors.textTitle, fontWeight: "900", fontSize: 17 },
    heroSub: { marginTop: 2, color: colors.textMuted, fontWeight: "700", fontSize: 12 },

    infoCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginBottom: 12,
      gap: 8,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    infoLabel: {
      minWidth: 72,
      color: colors.textMuted,
      fontWeight: "800",
      fontSize: 12,
    },
    infoValue: {
      flex: 1,
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 12,
    },

    sectionTitle: {
      color: colors.textMuted,
      fontWeight: "900",
      fontSize: 12,
      letterSpacing: 0.3,
      textTransform: "uppercase",
      marginBottom: 8,
      marginTop: 2,
    },
    metricGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 12,
    },
    metricCard: {
      width: "48%",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      paddingHorizontal: 11,
      paddingVertical: 11,
    },
    metricIcon: {
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
    metricTitle: { color: colors.textMuted, fontWeight: "900", fontSize: 11 },
    metricValue: {
      marginTop: 2,
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 14,
    },
    metricSub: {
      marginTop: 3,
      color: colors.textMuted,
      fontWeight: "700",
      fontSize: 11,
    },
    actionsWrap: { gap: 10 },
    actionCard: {
      borderRadius: 16,
      borderWidth: 1,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    actionIcon: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
    },
    actionTitle: { color: colors.textTitle, fontWeight: "900", fontSize: 13 },
    actionSub: {
      color: colors.textMuted,
      fontWeight: "700",
      marginTop: 2,
      fontSize: 12,
    },
  });
}
