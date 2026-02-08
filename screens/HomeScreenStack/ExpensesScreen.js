import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import ExpensesOutput from "../../components/ExpensesOutput/ExpensesOutput";
import { ExpensesContext } from "../../store/expenses-context";
import { AuthContext } from "../../store/auth-context";
import LoadingOverlay from "../../components/ui/LoadingOverlay";
import ErrorOverlay from "../../components/ui/ErrorOverlay";
import { GlobalStyles } from "../../constants/styles";
import { saveUserProfile } from "../../util/profile-http";

export const PRESETS = {
  TODAY: "TODAY",
  YESTERDAY: "YESTERDAY",
  DAYS_7: "DAYS_7",
  MONTH_1: "MONTH_1",
  YEAR_1: "YEAR_1",
  TOTAL: "TOTAL",
  CUSTOM: "CUSTOM",
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

  if (preset === PRESETS.TODAY) {
    return { from: startOfDay(today), to: endOfDay(today) };
  }

  if (preset === PRESETS.YESTERDAY) {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return { from: startOfDay(d), to: endOfDay(d) };
  }

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

function formatDate(d) {
  if (!d) return "";
  const months = [
    "Gen",
    "Feb",
    "Mar",
    "Apr",
    "Mag",
    "Giu",
    "Lug",
    "Ago",
    "Set",
    "Ott",
    "Nov",
    "Dic",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateShort(d) {
  if (!d) return "";
  const months = [
    "Gen",
    "Feb",
    "Mar",
    "Apr",
    "Mag",
    "Giu",
    "Lug",
    "Ago",
    "Set",
    "Ott",
    "Nov",
    "Dic",
  ];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function safeDate(dateLike) {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (!d || Number.isNaN(d.getTime())) return null;
  return d;
}

function normalizeNameInput(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function isValidHumanName(value) {
  return /^[A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF' -]{2,30}$/.test(
    String(value || ""),
  );
}

function isAuthHttpError(error) {
  const status = Number(error?.response?.status || 0);
  return status === 401 || status === 403;
}

function stripAccents(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const LIKELY_MALE_ENDING_A = new Set([
  "andrea",
  "mattia",
  "nicola",
  "elia",
  "enea",
]);

const LIKELY_FEMALE_NON_A = new Set([
  "iris",
  "noemi",
  "carmen",
  "ester",
  "miriam",
  "sarah",
]);

function getWelcomePrefix(firstName) {
  const base = stripAccents(firstName).toLowerCase().trim();
  if (!base) return "Bentornato";
  if (LIKELY_FEMALE_NON_A.has(base)) return "Bentornata";
  if (LIKELY_MALE_ENDING_A.has(base)) return "Bentornato";
  if (base.endsWith("a")) return "Bentornata";
  return "Bentornato";
}

function ExpensesScreen() {
  const expensesCtx = useContext(ExpensesContext);
  const authCtx = useContext(AuthContext);
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);

  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(null);

  const [preset, setPreset] = useState(PRESETS.TODAY);
  const [rangeFrom, setRangeFrom] = useState(null);
  const [rangeTo, setRangeTo] = useState(null);
  const hasLoadedRef = useRef(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [firstNameDraft, setFirstNameDraft] = useState("");
  const [lastNameDraft, setLastNameDraft] = useState("");

  // ✅ IMPORTANT: dipendenze STABILI (evita loop infinito)
  const loadExpenses = useCallback(async () => {
    if (!hasLoadedRef.current) setIsFetching(true);
    setError(null);

    try {
      await expensesCtx.fetchAndSetExpenses();
    } catch {
      setError("Impossibile recuperare le spese!");
    } finally {
      if (!hasLoadedRef.current) setIsFetching(false);
      hasLoadedRef.current = true;
    }
  }, [expensesCtx.fetchAndSetExpenses]);

  // ✅ una sola fetch all’avvio (no loop)
  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const effectiveRange = useMemo(() => {
    if (preset === PRESETS.CUSTOM) {
      const from = rangeFrom ? startOfDay(rangeFrom) : null;
      const to = rangeTo ? endOfDay(rangeTo) : null;
      return { from, to };
    }
    if (preset === PRESETS.TOTAL) return { from: null, to: null };
    return getPresetRange(preset);
  }, [preset, rangeFrom, rangeTo]);

  const filteredExpenses = useMemo(() => {
    const all = expensesCtx.expenses || [];

    if (preset === PRESETS.TOTAL) return all;

    const { from, to } = effectiveRange;

    return all.filter((expense) => {
      const d = safeDate(expense.date);
      if (!d) return false;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [expensesCtx.expenses, preset, effectiveRange]);

  const periodLabel = useMemo(() => {
    if (preset === PRESETS.TODAY) return "Oggi";
    if (preset === PRESETS.YESTERDAY) return "Ieri";
    if (preset === PRESETS.DAYS_7) return "Ultimi 7 giorni";
    if (preset === PRESETS.MONTH_1) return "Ultimo mese";
    if (preset === PRESETS.YEAR_1) return "Ultimo anno";
    if (preset === PRESETS.TOTAL) return "Totale";

    const { from, to } = effectiveRange;
    if (from && to) return `${formatDate(from)} - ${formatDate(to)}`;
    if (from && !to) return `Da ${formatDate(from)}`;
    if (!from && to) return `Fino a ${formatDate(to)}`;
    return "Periodo personalizzato";
  }, [preset, effectiveRange]);

  const emptyStateText = useMemo(() => {
    if (preset === PRESETS.TODAY) return "Nessuna spesa oggi";
    if (preset === PRESETS.YESTERDAY) return "Nessuna spesa ieri";
    if (preset === PRESETS.DAYS_7) {
      return "Nessuna spesa effettuata in sette giorni";
    }
    if (preset === PRESETS.MONTH_1) {
      return "Nessuna spesa effettuata in un mese";
    }
    if (preset === PRESETS.YEAR_1) {
      return "Nessuna spesa effettuata in un anno";
    }
    if (preset === PRESETS.TOTAL) return "Nessuna spesa registrata";

    const { from, to } = effectiveRange;
    if (from && to) {
      return `Nessuna spesa effettuata dal ${formatDateShort(from)} al ${formatDateShort(to)}`;
    }
    if (from && !to) {
      return `Nessuna spesa effettuata dal ${formatDateShort(from)}`;
    }
    if (!from && to) {
      return `Nessuna spesa effettuata fino al ${formatDateShort(to)}`;
    }
    return "Nessuna spesa nel periodo selezionato.";
  }, [preset, effectiveRange]);

  const handleSelectPreset = (p) => {
    setPreset(p);
    if (p !== PRESETS.CUSTOM) {
      setRangeFrom(null);
      setRangeTo(null);
    }
  };

  const handleChangeRange = (from, to) => {
    setPreset(PRESETS.CUSTOM);

    if (from && to && from > to) {
      setRangeFrom(to);
      setRangeTo(from);
    } else {
      setRangeFrom(from ?? null);
      setRangeTo(to ?? null);
    }
  };

  const welcomeName = [authCtx.firstName, authCtx.lastName]
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .join(" ");

  const firstName = normalizeNameInput(authCtx.firstName).split(" ")[0];
  const welcomePrefix = getWelcomePrefix(firstName);
  const welcomeText = welcomeName ? `${welcomePrefix}, ${welcomeName}` : "";
  const needsProfileData =
    !normalizeNameInput(authCtx.firstName) || !normalizeNameInput(authCtx.lastName);

  useEffect(() => {
    if (!authCtx.isAuthenticated) return;
    if (!needsProfileData) {
      setProfileModalOpen(false);
      return;
    }

    setFirstNameDraft((current) => current || normalizeNameInput(authCtx.firstName));
    setLastNameDraft((current) => current || normalizeNameInput(authCtx.lastName));
    setProfileModalOpen(true);
  }, [authCtx.isAuthenticated, authCtx.firstName, authCtx.lastName, needsProfileData]);

  const submitLegacyProfile = useCallback(async () => {
    const firstName = normalizeNameInput(firstNameDraft);
    const lastName = normalizeNameInput(lastNameDraft);

    if (!firstName || !lastName) {
      Alert.alert("Dati mancanti", "Inserisci sia il Nome che il Cognome.");
      return;
    }

    if (!isValidHumanName(firstName)) {
      Alert.alert(
        "Nome non valido",
        "Il Nome deve avere 2-30 caratteri e contenere solo lettere.",
      );
      return;
    }

    if (!isValidHumanName(lastName)) {
      Alert.alert(
        "Cognome non valido",
        "Il Cognome deve avere 2-30 caratteri e contenere solo lettere.",
      );
      return;
    }

    setProfileSaving(true);
    try {
      const payload = {
        firstName,
        lastName,
        email: String(authCtx?.profile?.email || "").trim(),
      };

      try {
        await saveUserProfile(authCtx.userId, authCtx.token, payload);
      } catch (error) {
        if (!isAuthHttpError(error)) throw error;
        const refreshed = await authCtx.refreshSession(true).catch(() => null);
        const nextToken = refreshed?.token;
        if (!nextToken) throw error;
        await saveUserProfile(authCtx.userId, nextToken, payload);
      }

      await authCtx.setProfile(payload);
      setProfileModalOpen(false);
    } catch {
      Alert.alert(
        "Errore",
        "Non siamo riusciti a salvare i dati. Controlla la connessione e riprova.",
      );
    } finally {
      setProfileSaving(false);
    }
  }, [
    firstNameDraft,
    lastNameDraft,
    authCtx,
  ]);

  if (isFetching) {
    return (
      <LoadingOverlay
        message={welcomeText ? `${welcomeText} - carico le spese...` : "Caricamento spese..."}
      />
    );
  }

  if (error) {
    return (
      <ErrorOverlay
        message={error}
        onRetry={loadExpenses}
        retryLabel="Riprova"
      />
    );
  }

  return (
    <View style={styles.screen}>
      <View style={{ flex: 1 }}>
        <ExpensesOutput
          expenses={filteredExpenses}
          expensesPeriod={periodLabel}
          welcomeText={welcomeText}
          fallbackText={emptyStateText}
          rangeFrom={rangeFrom}
          rangeTo={rangeTo}
          onChangeRange={handleChangeRange}
          onResetRange={() => handleSelectPreset(PRESETS.TODAY)}
          onSelectPreset={handleSelectPreset}
          activePreset={preset}
          presets={PRESETS}
        />
      </View>

      <Modal
        visible={profileModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => {}}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            style={styles.modalAvoid}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 86 : 20}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                Da questo aggiornamento abbiamo bisogno di questi tuoi dati
              </Text>

              <Text style={styles.label}>Inserisci il tuo Nome</Text>
              <TextInput
                value={firstNameDraft}
                onChangeText={setFirstNameDraft}
                placeholder="Nome"
                placeholderTextColor={colors.white45}
                style={styles.input}
                editable={!profileSaving}
                autoCapitalize="words"
                returnKeyType="next"
                blurOnSubmit={false}
              />

              <Text style={styles.label}>Inserisci il tuo Cognome</Text>
              <TextInput
                value={lastNameDraft}
                onChangeText={setLastNameDraft}
                placeholder="Cognome"
                placeholderTextColor={colors.white45}
                style={styles.input}
                editable={!profileSaving}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={submitLegacyProfile}
              />

              <Pressable
                onPress={submitLegacyProfile}
                disabled={profileSaving}
                style={({ pressed }) => [
                  styles.submitBtn,
                  pressed && { opacity: 0.9 },
                  profileSaving && { opacity: 0.6 },
                ]}
              >
                <Text style={styles.submitBtnText}>
                  {profileSaving ? "Salvataggio..." : "Inseriti"}
                </Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

export default ExpensesScreen;

function makeStyles(colors) {
  return StyleSheet.create({
    screen: { flex: 1 },
    modalBackdrop: {
      flex: 1,
      backgroundColor: colors.overlay72,
      padding: 18,
      justifyContent: "center",
    },
    modalAvoid: { width: "100%" },
    modalCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      padding: 14,
    },
    modalTitle: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 12,
      textAlign: "center",
    },
    label: {
      color: colors.textMuted,
      fontWeight: "800",
      fontSize: 12,
      marginBottom: 6,
      marginTop: 4,
    },
    input: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
      color: colors.textTitle,
      fontWeight: "800",
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    submitBtn: {
      marginTop: 14,
      height: 46,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.accent30,
      backgroundColor: colors.accent500,
    },
    submitBtnText: { color: colors.textOnAccentStrong, fontWeight: "900" },
  });
}
