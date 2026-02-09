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
import { useThemeRefresh } from "../../store/theme-context";
import { ExpensesContext } from "../../store/expenses-context";
import { PaymentContext } from "../../store/payment-context";
import { useTranslation } from "../../store/language-context";
import ExpenseForm from "../../components/ManageExpense/ExpenseForm";
import LoadingOverlay from "../../components/ui/LoadingOverlay";
import ErrorOverlay from "../../components/ui/ErrorOverlay";
import AppLogo from "../../components/ui/AppLogo";

import {
  addExpenseTemplate,
  getExpenseTemplates,
  removeExpenseTemplate,
} from "../../util/expenses/expense-template";

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

  useThemeRefresh();
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);

  const expensesCtx = useContext(ExpensesContext);
  const paymentCtx = useContext(PaymentContext);
  const { t } = useTranslation();

  const editedExpenseId = route.params?.expenseId;
  const isEditing = !!editedExpenseId;

  const preset = route.params?.preset;

  const selectedExpense = useMemo(() => {
    return expensesCtx.expenses.find(
      (expense) => expense.id === editedExpenseId,
    );
  }, [expensesCtx.expenses, editedExpenseId]);

  const lastActionRef = useRef(null);
  const submitLockRef = useRef(false);

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
          t("manageExpense.missingDescriptionTitle"),
          t("manageExpense.missingDescriptionMessage"),
        );
        return;
      }

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
        Alert.alert(
          t("manageExpense.favoriteRemovedTitle"),
          t("manageExpense.favoriteRemovedMessage"),
        );
        return;
      }

      if (matching?.id) {
        setFavoriteSaved(true);
        setFavoriteTemplateId(String(matching.id));
        Alert.alert(
          t("manageExpense.favoriteAlreadySavedTitle"),
          t("manageExpense.favoriteAlreadySavedMessage"),
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
        t("manageExpense.favoriteSavedTitle"),
        t("manageExpense.favoriteSavedMessage"),
      );
    } catch (saveError) {
      Alert.alert(
        t("common.error"),
        saveError?.message || t("manageExpense.favoriteSaveFailed"),
      );
    }
  }, [favoriteSaved, favoriteTemplateId, t]);

  useEffect(() => {
    setFavoriteSaved(false);
    setFavoriteTemplateId("");
    submitLockRef.current = false;
  }, [editedExpenseId]);

  function confirmDelete() {
    Alert.alert(t("manageExpense.confirmDeleteTitle"), t("manageExpense.confirmDeleteMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.delete"), style: "destructive", onPress: deleteExpenseHandler },
    ]);
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditing
        ? t("manageExpense.editExpenseTitle")
        : t("manageExpense.addExpenseTitle"),
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
    t,
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
      setError(t("manageExpense.deleteFailed"));
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  }

  function cancelHandler() {
    navigation.goBack();
  }

  async function confirmHandler(expenseData) {
    if (isSubmitting || submitLockRef.current) return;

    lastActionRef.current = isEditing
      ? { type: "update", id: editedExpenseId, data: expenseData }
      : { type: "add", data: expenseData };

    submitLockRef.current = true;
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
      setError(t("manageExpense.saveFailed"));
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  }

  async function retryLastAction() {
    const last = lastActionRef.current;
    if (!last || isSubmitting || submitLockRef.current) return;

    submitLockRef.current = true;
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
      submitLockRef.current = false;
    } catch {
      setError(t("manageExpense.operationFailed"));
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  }

  if (error && !isSubmitting) {
    return (
      <ErrorOverlay
        message={error}
        onRetry={retryLastAction}
        retryLabel={t("common.retry")}
        retryDelayMs={2000}
      />
    );
  }

  if (isSubmitting) {
    return <LoadingOverlay message={t("manageExpense.saving")} />;
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
          <View
            style={[
              styles.heroOrb,
              styles.heroOrbTop,
              { backgroundColor: colors.accent12, borderColor: colors.accent18 },
            ]}
          />
          <View
            style={[
              styles.heroOrb,
              styles.heroOrbBottom,
              { backgroundColor: colors.accent12, borderColor: colors.accent18 },
            ]}
          />

          <View style={styles.heroTopRow}>
            <AppLogo size={42} style={styles.logoWrap} />
            <View style={styles.heroBadge}>
              <Ionicons
                name={isEditing ? "create-outline" : "add-circle-outline"}
                size={14}
                color={colors.textTitle}
              />
              <Text style={styles.heroBadgeText}>
                {isEditing ? t("manageExpense.editModeBadge") : t("manageExpense.newExpenseBadge")}
              </Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>
            {isEditing ? t("manageExpense.editHeroTitle") : t("manageExpense.newHeroTitle")}
          </Text>
          <Text style={styles.heroSub}>
            {isEditing
              ? t("manageExpense.editHeroSubtitle")
              : t("manageExpense.newHeroSubtitle")}
          </Text>

          <View style={styles.heroMetaRow}>
            <View style={styles.heroMetaPill}>
              <Ionicons name="wallet-outline" size={14} color={colors.textMuted} />
              <Text style={styles.heroMetaText}>Savemoney</Text>
            </View>
            <View style={styles.heroMetaPill}>
              <Ionicons name="checkmark-done-outline" size={14} color={colors.textMuted} />
              <Text style={styles.heroMetaText}>{t("manageExpense.secureSaving")}</Text>
            </View>
          </View>
        </View>

        <View style={styles.formWrap}>
          <ExpenseForm
            ref={formRef}
            submitButtonLabel={isEditing ? t("manageExpense.updateAction") : t("manageExpense.addAction")}
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
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingHorizontal: 16, paddingTop: 12 },
    heroCard: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      paddingVertical: 14,
      paddingHorizontal: 14,
      gap: 10,
      marginBottom: 14,
      overflow: "hidden",
      position: "relative",
    },
    heroOrb: {
      position: "absolute",
      borderRadius: 999,
      borderWidth: 1,
    },
    heroOrbTop: {
      width: 104,
      height: 104,
      right: -30,
      top: -28,
    },
    heroOrbBottom: {
      width: 62,
      height: 62,
      right: 24,
      bottom: -30,
    },
    heroTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    logoWrap: {
      borderColor: colors.accent30,
      borderWidth: 1,
    },
    heroBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.white12,
      backgroundColor: colors.white08,
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    heroBadgeText: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 11,
      letterSpacing: 0.2,
    },
    heroTitle: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 17,
      lineHeight: 20,
    },
    heroSub: {
      marginTop: 1,
      color: colors.textMuted,
      fontWeight: "800",
      fontSize: 12,
      lineHeight: 18,
    },
    heroMetaRow: {
      marginTop: 2,
      flexDirection: "row",
      gap: 8,
      flexWrap: "wrap",
    },
    heroMetaPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.white12,
      backgroundColor: colors.white06,
      paddingVertical: 5,
      paddingHorizontal: 9,
    },
    heroMetaText: {
      color: colors.textMuted,
      fontWeight: "800",
      fontSize: 11,
    },
    formWrap: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 9,
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
