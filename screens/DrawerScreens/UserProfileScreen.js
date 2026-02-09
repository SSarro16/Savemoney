import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
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
import { saveUserProfile } from "../../util/profile-http";
import AppLogo from "../../components/ui/AppLogo";
import Button from "../../components/ui/CButton";
import CustomDatePicker from "../../components/ui/DatePicker";

function isAuthHttpError(error) {
  const status = Number(error?.response?.status || 0);
  return status === 401 || status === 403;
}

function safeDate(value) {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return new Date(2000, 0, 1);
  return parsed;
}

function formatDate(value) {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return "Non impostata";
  return parsed.toLocaleDateString("it-IT");
}

function genderLabel(value) {
  if (value === "MALE") return "Maschio";
  if (value === "FEMALE") return "Femmina";
  return "Non impostato";
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

function GenderSelector({ value, onChange, styles }) {
  return (
    <View style={styles.genderRow}>
      {[
        { key: "MALE", label: "Maschio" },
        { key: "FEMALE", label: "Femmina" },
      ].map((option) => {
        const active = value === option.key;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(active ? "" : option.key)}
            style={({ pressed }) => [
              styles.genderChip,
              active && styles.genderChipActive,
              pressed && { opacity: 0.88 },
            ]}
          >
            <Text style={[styles.genderChipText, active && styles.genderChipTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
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
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [draftFirstName, setDraftFirstName] = useState("");
  const [draftLastName, setDraftLastName] = useState("");
  const [draftGender, setDraftGender] = useState("");
  const [draftDob, setDraftDob] = useState(new Date(2000, 0, 1));
  const refreshSessionRef = useRef(authCtx.refreshSession);

  useEffect(() => {
    refreshSessionRef.current = authCtx.refreshSession;
  }, [authCtx.refreshSession]);

  useEffect(() => {
    setDraftFirstName(String(authCtx.profile?.firstName || ""));
    setDraftLastName(String(authCtx.profile?.lastName || ""));
    setDraftGender(String(authCtx.profile?.gender || ""));
    setDraftDob(safeDate(authCtx.profile?.dateOfBirth));
  }, [
    authCtx.profile?.firstName,
    authCtx.profile?.lastName,
    authCtx.profile?.gender,
    authCtx.profile?.dateOfBirth,
  ]);

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

  const profileDirty = useMemo(() => {
    const currentFirst = String(authCtx.profile?.firstName || "").trim();
    const currentLast = String(authCtx.profile?.lastName || "").trim();
    const currentGender = String(authCtx.profile?.gender || "").trim().toUpperCase();
    const currentDob = safeDate(authCtx.profile?.dateOfBirth).toISOString().slice(0, 10);
    const draftDobKey = safeDate(draftDob).toISOString().slice(0, 10);

    return (
      currentFirst !== String(draftFirstName || "").trim() ||
      currentLast !== String(draftLastName || "").trim() ||
      currentGender !== String(draftGender || "").trim().toUpperCase() ||
      currentDob !== draftDobKey
    );
  }, [
    authCtx.profile?.firstName,
    authCtx.profile?.lastName,
    authCtx.profile?.gender,
    authCtx.profile?.dateOfBirth,
    draftFirstName,
    draftLastName,
    draftGender,
    draftDob,
  ]);

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

  const handleSaveProfile = async () => {
    if (isSavingProfile || !authCtx.userId || !authCtx.token) return;
    setIsSavingProfile(true);

    const payload = {
      firstName: String(draftFirstName || "").trim(),
      lastName: String(draftLastName || "").trim(),
      gender: String(draftGender || "").trim().toUpperCase(),
      dateOfBirth: safeDate(draftDob).toISOString(),
      email: authCtx.profile?.email || "",
      profileCompletionV2: true,
    };

    try {
      const saved = await saveUserProfile(authCtx.userId, authCtx.token, payload);
      await authCtx.setProfile(saved || payload);
      Alert.alert("Profilo aggiornato", "I dati account sono stati salvati.");
    } catch (error) {
      if (isAuthHttpError(error)) {
        const refreshed = await refreshSessionRef.current?.(true).catch(() => null);
        if (refreshed?.token) {
          try {
            const saved = await saveUserProfile(authCtx.userId, refreshed.token, payload);
            await authCtx.setProfile(saved || payload);
            Alert.alert("Profilo aggiornato", "I dati account sono stati salvati.");
            return;
          } catch {
            // handled below
          }
        }
      }
      Alert.alert("Aggiornamento fallito", "Impossibile salvare il profilo.");
    } finally {
      setIsSavingProfile(false);
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
          icon="male-female-outline"
          label="Genere"
          value={genderLabel(authCtx.gender)}
          styles={styles}
          colors={colors}
        />
        <InfoRow
          icon="calendar-outline"
          label="Nascita"
          value={formatDate(authCtx.dateOfBirth)}
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

      <Text style={styles.sectionTitle}>Account settings</Text>
      <View style={styles.editorCard}>
        <View style={styles.editorRow}>
          <View style={styles.editorField}>
            <Text style={styles.editorLabel}>Nome</Text>
            <TextInput
              value={draftFirstName}
              onChangeText={setDraftFirstName}
              placeholder="Nome"
              placeholderTextColor={colors.textFaint}
              style={styles.editorInput}
            />
          </View>
          <View style={styles.editorField}>
            <Text style={styles.editorLabel}>Cognome</Text>
            <TextInput
              value={draftLastName}
              onChangeText={setDraftLastName}
              placeholder="Cognome"
              placeholderTextColor={colors.textFaint}
              style={styles.editorInput}
            />
          </View>
        </View>

        <Text style={styles.editorLabel}>Genere</Text>
        <GenderSelector value={draftGender} onChange={setDraftGender} styles={styles} />

        <View style={{ marginTop: 10 }}>
          <CustomDatePicker
            label="Data di nascita"
            value={safeDate(draftDob)}
            onChange={setDraftDob}
          />
        </View>

        <View style={styles.editorSaveWrap}>
          <Button onPress={handleSaveProfile} disabled={!profileDirty || isSavingProfile}>
            {isSavingProfile ? "Salvataggio..." : "Salva dati account"}
          </Button>
        </View>
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
    editorCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      padding: 12,
      marginBottom: 12,
    },
    editorRow: {
      flexDirection: "row",
      gap: 8,
    },
    editorField: { flex: 1 },
    editorLabel: {
      color: colors.textMuted,
      fontWeight: "800",
      fontSize: 11,
      marginBottom: 5,
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    editorInput: {
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.white12,
      backgroundColor: colors.surface2,
      color: colors.textTitle,
      fontWeight: "800",
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginBottom: 10,
    },
    genderRow: {
      flexDirection: "row",
      gap: 8,
    },
    genderChip: {
      flex: 1,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.white12,
      backgroundColor: colors.surface2,
      paddingVertical: 10,
      alignItems: "center",
    },
    genderChipActive: {
      borderColor: colors.accent35,
      backgroundColor: colors.accent18,
    },
    genderChipText: { color: colors.textMuted, fontWeight: "900", fontSize: 12 },
    genderChipTextActive: { color: colors.textTitle },
    editorSaveWrap: {
      marginTop: 12,
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
