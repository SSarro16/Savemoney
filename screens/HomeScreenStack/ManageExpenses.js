import {
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  Pressable,
  Text,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlobalStyles } from "../../constants/styles";
import { ExpensesContext } from "../../store/expenses-context";
import { PaymentContext } from "../../store/payment-context";
import ExpenseForm from "../../components/ManageExpense/ExpenseForm";
import LoadingOverlay from "../../components/ui/LoadingOverlay";
import ErrorOverlay from "../../components/ui/ErrorOverlay";

import {
  addExpenseTemplate,
  getExpenseTemplates,
  removeExpenseTemplate,
} from "../../util/expenses/expense-template";

// ✅ per normalizzare il metodo pagamento
import { PAYMENT_METHOD } from "../../util/expenses/expense-presets";

function safePayMethod(v) {
  return v === PAYMENT_METHOD.CARD ? PAYMENT_METHOD.CARD : PAYMENT_METHOD.CASH;
}

function templateFingerprint(templateLike) {
  const payMethod = safePayMethod(templateLike?.payMethod);
  const amount = Number(templateLike?.amount || 0);
  const normalizedAmount =
    Number.isFinite(amount) && amount > 0 ? amount.toFixed(2) : "";

  return [
    String(templateLike?.description || "").trim().toLowerCase(),
    String(templateLike?.category || "").trim().toLowerCase(),
    String(templateLike?.icon || "pricetag-outline").trim(),
    payMethod,
    payMethod === PAYMENT_METHOD.CARD
      ? String(templateLike?.cardId || "").trim()
      : "",
    normalizedAmount,
  ].join("|");
}

function ManageExpenses({ route, navigation }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [favoriteSaved, setFavoriteSaved] = useState(false);
  const [favoriteTemplateId, setFavoriteTemplateId] = useState("");

  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);

  const expensesCtx = useContext(ExpensesContext);
  const paymentCtx = useContext(PaymentContext);

  const editedExpenseId = route.params?.expenseId;
  const isEditing = !!editedExpenseId;

  const preset = route.params?.preset;

  const selectedExpense = useMemo(() => {
    return expensesCtx.expenses.find(
      (expense) => expense.id === editedExpenseId,
    );
  }, [expensesCtx.expenses, editedExpenseId]);

  const lastActionRef = useRef(null);

  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const keyboardOffset = Platform.OS === "ios" ? headerHeight : 0;

  const formRef = useRef(null);

  const saveFavoriteHandler = useCallback(async () => {
    try {
      const draft = formRef.current?.getFavoriteDraft?.();
      if (!draft) return;

      if (!draft.description?.trim()) {
        Alert.alert(
          "Manca la descrizione",
          "Scrivi una descrizione per salvare nei preferiti.",
        );
        return;
      }

      // ✅ aggiungo anche metodo pagamento/cardId nel template
      const pm = safePayMethod(draft.payMethod);
      const cid =
        pm === PAYMENT_METHOD.CARD ? String(draft.cardId || "").trim() : "";
      const payload = {
        ...draft,
        payMethod: pm,
        ...(pm === PAYMENT_METHOD.CARD ? { cardId: cid } : {}),
      };
      const targetFingerprint = templateFingerprint(payload);
      const templates = await getExpenseTemplates();
      const matching = (templates || []).find(
        (template) => templateFingerprint(template) === targetFingerprint,
      );

      if (favoriteSaved) {
        const removeId = String(favoriteTemplateId || matching?.id || "").trim();
        if (removeId) {
          await removeExpenseTemplate(removeId);
        }

        setFavoriteSaved(false);
        setFavoriteTemplateId("");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        Alert.alert("Rimosso", "Preferito rimosso.");
        return;
      }

      if (matching?.id) {
        setFavoriteSaved(true);
        setFavoriteTemplateId(String(matching.id));
        Alert.alert(
          "Già salvato",
          "Questo preferito esiste già. Premi ancora la stella per rimuoverlo.",
        );
        return;
      }

      const next = await addExpenseTemplate(payload);
      const added =
        (next || []).find(
          (template) => templateFingerprint(template) === targetFingerprint,
        ) || next?.[0];

      setFavoriteSaved(true);
      setFavoriteTemplateId(String(added?.id || ""));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      Alert.alert(
        "Salvato",
        "Aggiunto ai preferiti (lo trovi in Aggiunta Rapida)",
      );
    } catch {
      Alert.alert("Errore", "Impossibile salvare nei preferiti.");
    }
  }, [favoriteSaved, favoriteTemplateId]);

  useEffect(() => {
    setFavoriteSaved(false);
    setFavoriteTemplateId("");
  }, [editedExpenseId]);

  function confirmDelete() {
    Alert.alert("Eliminare la spesa?", "Puoi annullare per alcuni secondi.", [
      { text: "Annulla", style: "cancel" },
      { text: "Elimina", style: "destructive", onPress: deleteExpenseHandler },
    ]);
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditing ? "Modifica Spesa" : "Aggiungi Spesa",
      headerRight: () => (
        <View style={styles.headerRight}>
          <Pressable
            onPress={saveFavoriteHandler}
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.saveBtn,
              favoriteSaved && styles.saveBtnSaved,
              pressed && !isSubmitting && { opacity: 0.88 },
              isSubmitting && { opacity: 0.6 },
            ]}
          >
            <Ionicons
              name={favoriteSaved ? "star" : "star-outline"}
              size={18}
              color={favoriteSaved ? colors.textOnAccentStrong : colors.textTitle}
            />
          </Pressable>

          {isEditing ? (
            <Pressable
              onPress={confirmDelete}
              style={({ pressed }) => [
                styles.trashBtn,
                pressed && { opacity: 0.88 },
              ]}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error500} />
            </Pressable>
          ) : null}
        </View>
      ),
    });
  }, [
    navigation,
    isEditing,
    isSubmitting,
    saveFavoriteHandler,
    favoriteTemplateId,
    favoriteSaved,
    colors.error500,
    colors.textOnAccentStrong,
    colors.textTitle,
  ]);

  async function deleteExpenseHandler() {
    if (!editedExpenseId || isSubmitting) return;

    lastActionRef.current = { type: "delete", id: editedExpenseId };
    setIsSubmitting(true);
    setError(null);

    try {
      await expensesCtx.deleteExpenseWithUndo(editedExpenseId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
        () => {},
      );
      navigation.goBack();
    } catch {
      setError("Impossibile eliminare la spesa! Riprova più tardi.");
      setIsSubmitting(false);
    }
  }

  function cancelHandler() {
    navigation.goBack();
  }

  async function confirmHandler(expenseData) {
    if (isSubmitting) return;

    lastActionRef.current = isEditing
      ? { type: "update", id: editedExpenseId, data: expenseData }
      : { type: "add", data: expenseData };

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing) {
        await expensesCtx.updateExpense(editedExpenseId, expenseData);
      } else {
        await expensesCtx.addExpense(expenseData);
      }
      navigation.goBack();
    } catch {
      setError("Impossibile salvare la spesa! Riprova più tardi.");
      setIsSubmitting(false);
    }
  }

  async function retryLastAction() {
    const last = lastActionRef.current;
    if (!last || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (last.type === "delete") {
        await expensesCtx.deleteExpenseWithUndo(last.id);
        navigation.goBack();
        return;
      }
      if (last.type === "update") {
        await expensesCtx.updateExpense(last.id, last.data);
        navigation.goBack();
        return;
      }
      if (last.type === "add") {
        await expensesCtx.addExpense(last.data);
        navigation.goBack();
        return;
      }
      setIsSubmitting(false);
    } catch {
      setError("Operazione non riuscita. Riprova più tardi.");
      setIsSubmitting(false);
    }
  }

  if (error && !isSubmitting) {
    return (
      <ErrorOverlay
        message={error}
        onRetry={retryLastAction}
        retryLabel="Riprova"
        retryDelayMs={2000}
      />
    );
  }

  if (isSubmitting) {
    return <LoadingOverlay message="Salvataggio in corso..." />;
  }

  const Wrapper = Platform.OS === "ios" ? KeyboardAvoidingView : View;

  return (
    <Wrapper
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={keyboardOffset}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 28 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons
              name={isEditing ? "create-outline" : "add-circle-outline"}
              size={20}
              color={colors.textTitle}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>
              {isEditing ? "Aggiorna la tua spesa" : "Aggiungi una nuova spesa"}
            </Text>
            <Text style={styles.heroSub}>
              {isEditing
                ? "Modifica i dettagli e salva. Cestino = elimina con undo."
                : "Compila il form e registra la spesa. Stella = preferito."}
            </Text>
          </View>
        </View>

        <View style={styles.formWrap}>
          <ExpenseForm
            ref={formRef}
            submitButtonLabel={isEditing ? "Aggiorna" : "Aggiungi"}
            onCancel={cancelHandler}
            onSubmit={confirmHandler}
            defaultValues={selectedExpense ?? preset}
            autoFocusAmount={!isEditing}
            disabled={isSubmitting}
            cards={paymentCtx.cards}
            cashWallets={paymentCtx.cashWallets}
            defaultCashWalletId={paymentCtx.defaultCashWalletId}
          />
        </View>
      </ScrollView>
    </Wrapper>
  );
}

export default ManageExpenses;

function makeStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.primary800 },
    content: { paddingHorizontal: 16, paddingTop: 12 },
    heroCard: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      paddingVertical: 14,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      marginBottom: 14,
    },
    heroIcon: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.accent30,
      backgroundColor: colors.accent16,
    },
    heroTitle: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 16,
      lineHeight: 20,
    },
    heroSub: {
      marginTop: 4,
      color: colors.textMuted,
      fontWeight: "800",
      fontSize: 12,
      lineHeight: 18,
    },
    formWrap: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white08,
      padding: 8,
    },

    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingRight: 4,
    },
    saveBtn: {
      width: 32,
      height: 32,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.white08,
      borderWidth: 1,
      borderColor: colors.white10,
    },
    saveBtnSaved: {
      backgroundColor: colors.accent500,
      borderColor: colors.accent30,
    },
    trashBtn: {
      width: 32,
      height: 32,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.danger12,
      borderWidth: 1,
      borderColor: colors.danger22,
    },
  });
}

