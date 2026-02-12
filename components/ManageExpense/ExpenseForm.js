import React, {
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  forwardRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import Button from "../ui/CButton";
import AppLogo from "../ui/AppLogo";
import CustomDatePicker from "../ui/DatePicker";
import { GlobalStyles } from "../../constants/styles";
import { EXPENSE_ICONS } from "../../constants/expense-icons";
import { PAYMENT_METHOD } from "../../util/expenses/expense-presets";
import { ExpenseCategoriesContext } from "../../store/expense-categories-context";
import { useTranslation } from "../../store/language-context";

function parseAmount(text) {
  const cleaned = String(text ?? "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

function isEmoji(value) {
  return typeof value === "string" && !value.includes("-");
}

function safePayMethod(v) {
  return v === PAYMENT_METHOD.CARD ? PAYMENT_METHOD.CARD : PAYMENT_METHOD.CASH;
}

function normalizeMethodId(value) {
  return String(value || "").trim();
}

function getDefaultCashMethodId(cashWallets = [], defaultCashWalletId = "") {
  const list = Array.isArray(cashWallets) ? cashWallets : [];
  const defaultId =
    normalizeMethodId(defaultCashWalletId) ||
    normalizeMethodId(list.find((wallet) => wallet?.isDefault)?.id) ||
    normalizeMethodId(list[0]?.id);
  return defaultId;
}

function resolveCashMethodId(candidate, cashWallets = [], defaultCashWalletId = "") {
  const list = Array.isArray(cashWallets) ? cashWallets : [];
  const candidateId = normalizeMethodId(candidate);
  if (candidateId && list.some((wallet) => normalizeMethodId(wallet?.id) === candidateId)) {
    return candidateId;
  }
  return getDefaultCashMethodId(list, defaultCashWalletId);
}

function resolveCardMethodId(candidate, cards = []) {
  const list = Array.isArray(cards) ? cards : [];
  const candidateId = normalizeMethodId(candidate);
  if (candidateId && list.some((card) => normalizeMethodId(card?.id) === candidateId)) {
    return candidateId;
  }
  if (list.length === 1) {
    return normalizeMethodId(list[0]?.id);
  }
  return "";
}

function formatCompactDate(value, localeTag) {
  const date = value instanceof Date ? value : new Date(value);
  if (!date || Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(localeTag || "it-IT", {
    day: "2-digit",
    month: "short",
  });
}

const ExpenseForm = forwardRef(function ExpenseForm(
  {
    submitButtonLabel,
    onCancel,
    onSubmit,
    defaultValues,
    disabled = false,
    autoFocusAmount = false,
    cards = [],
    cashWallets = [],
    defaultCashWalletId = "",
  },
  ref,
) {
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);
  const { height: windowHeight } = useWindowDimensions();
  const categoriesCtx = useContext(ExpenseCategoriesContext);
  const { t, localeTag } = useTranslation();
  const stackDateField = windowHeight < 760;

  const initialPayMethod = safePayMethod(
    defaultValues?.methodType || defaultValues?.payMethod,
  );
  const initialMethodId = String(
    defaultValues?.methodId ||
      defaultValues?.cardId ||
      defaultValues?.cashId ||
      "",
  ).trim();
  const initialResolvedMethodId =
    initialPayMethod === PAYMENT_METHOD.CARD
      ? resolveCardMethodId(initialMethodId, cards)
      : resolveCashMethodId(initialMethodId, cashWallets, defaultCashWalletId);

  const [inputs, setInputs] = useState({
    amount:
      defaultValues?.amount != null && defaultValues.amount !== ""
        ? String(defaultValues.amount)
        : "",
    date: defaultValues?.date ? new Date(defaultValues.date) : new Date(),
    description: defaultValues?.description
      ? String(defaultValues.description)
      : "",
    icon: defaultValues?.icon || "pricetag-outline",
    category: defaultValues?.category || "",
    payMethod: initialPayMethod,
    methodId: initialResolvedMethodId,
  });

  const amountRef = useRef(null);

  useEffect(() => {
    if (autoFocusAmount) {
      requestAnimationFrame(() => amountRef.current?.focus?.());
    }
  }, [autoFocusAmount]);

  const amountNumber = useMemo(() => parseAmount(inputs.amount), [inputs.amount]);
  const amountOk = !inputs.amount || (!Number.isNaN(amountNumber) && amountNumber > 0);
  const descOk = inputs.description.trim().length > 0;
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState({
    amount: false,
    description: false,
  });
  const showAmountError = (submitted || touched.amount) && !amountOk;
  const showDescriptionError = (submitted || touched.description) && !descOk;

  useEffect(() => {
    setInputs((current) => {
      const payMethod = safePayMethod(current?.payMethod);
      const currentMethodId = normalizeMethodId(current?.methodId);
      const nextMethodId =
        payMethod === PAYMENT_METHOD.CARD
          ? resolveCardMethodId(currentMethodId, cards)
          : resolveCashMethodId(currentMethodId, cashWallets, defaultCashWalletId);
      if (nextMethodId === currentMethodId) return current;
      return { ...current, methodId: nextMethodId };
    });
  }, [cards, cashWallets, defaultCashWalletId]);

  function inputChangedHandler(key, value) {
    setInputs((cur) => ({ ...cur, [key]: value }));
  }

  function markTouched(key) {
    setTouched((cur) => ({ ...cur, [key]: true }));
  }

  function submitHandler() {
    setSubmitted(true);
    setTouched((cur) => ({
      ...cur,
      amount: true,
      description: true,
    }));

    const payMethod = safePayMethod(inputs.payMethod);
    const methodId =
      payMethod === PAYMENT_METHOD.CARD
        ? resolveCardMethodId(inputs.methodId, cards)
        : resolveCashMethodId(inputs.methodId, cashWallets, defaultCashWalletId);

    if (payMethod === PAYMENT_METHOD.CARD && !methodId) {
      Alert.alert(t("expenseForm.cardMissingTitle"), t("expenseForm.cardMissingMessage"));
      return;
    }

    const expenseData = {
      amount: amountNumber,
      date: inputs.date,
      description: inputs.description.trim(),
      icon: inputs.icon,
      category: inputs.category?.trim() || undefined,
      methodType: payMethod,
      methodId,
      payMethod,
      ...(payMethod === PAYMENT_METHOD.CARD
        ? { cardId: methodId.trim() }
        : { cashId: methodId }),
    };

    const amountIsValid = !Number.isNaN(expenseData.amount) && expenseData.amount > 0;
    const dateIsValid = expenseData.date instanceof Date;
    const descriptionIsValid = expenseData.description.length > 0;

    if (!amountIsValid || !dateIsValid || !descriptionIsValid) {
      Alert.alert(t("expenseForm.invalidInputTitle"), t("expenseForm.invalidInputMessage"));
      return;
    }

    onSubmit(expenseData);
  }

  useImperativeHandle(ref, () => ({
    getFavoriteDraft: () => {
      const desc = inputs.description.trim();
      const category = inputs.category?.trim() || "";
      const icon = inputs.icon || "pricetag-outline";

      const amount = parseAmount(inputs.amount);
      const amountValid = Number.isFinite(amount) && amount > 0;

      const payMethod = safePayMethod(inputs.payMethod);
      const methodId =
        payMethod === PAYMENT_METHOD.CARD
          ? resolveCardMethodId(inputs.methodId, cards)
          : resolveCashMethodId(inputs.methodId, cashWallets, defaultCashWalletId);

      return {
        title: (desc || category || t("expenseForm.favoriteFallback")).slice(0, 22),
        description: desc.slice(0, 40),
        icon,
        category,
        methodType: payMethod,
        methodId,
        payMethod,
        cardId: payMethod === PAYMENT_METHOD.CARD ? methodId : "",
        cashId: payMethod === PAYMENT_METHOD.CASH ? methodId : "",
        ...(amountValid ? { amount } : {}),
      };
    },
  }));

  const amountFocus = useRef(new Animated.Value(0)).current;
  const amountBorderColor = amountFocus.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.white22, colors.accent500],
  });

  const placeholder = colors.white45;
  const iconColor = colors.white75;

  const [iconModalOpen, setIconModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("CATEGORY");
  const [newCategory, setNewCategory] = useState("");
  const iconItems = useMemo(() => Array.from(new Set(EXPENSE_ICONS || [])), []);

  const categoryItems = useMemo(() => {
    const base = Array.isArray(categoriesCtx?.categories)
      ? categoriesCtx.categories
      : [];
    const selected = String(inputs.category || "").trim();
    if (!selected) return base;
    const exists = base.some(
      (x) => String(x).toLowerCase() === selected.toLowerCase(),
    );
    return exists ? base : [...base, selected];
  }, [categoriesCtx?.categories, inputs.category]);

  const [payModalOpen, setPayModalOpen] = useState(false);

  const payLabel =
    inputs.payMethod === PAYMENT_METHOD.CARD ? t("expensesOutput.card") : t("expensesOutput.cash");

  const selectedCardName = useMemo(() => {
    if (inputs.payMethod !== PAYMENT_METHOD.CARD) return "";
    const found = (cards || []).find((c) => String(c.id) === String(inputs.methodId));
    return found?.name ? String(found.name) : "";
  }, [inputs.payMethod, inputs.methodId, cards]);

  const selectedCashName = useMemo(() => {
    if (inputs.payMethod !== PAYMENT_METHOD.CASH) return "";
    const found = (cashWallets || []).find((w) => String(w.id) === String(inputs.methodId));
    return found?.name ? String(found.name) : "";
  }, [inputs.payMethod, inputs.methodId, cashWallets]);

  const addCustomCategory = async () => {
    const clean = String(newCategory || "").trim();
    if (!clean) {
      Alert.alert(t("categories.invalidTitle"), t("expenseForm.categoryMissingMessage"));
      return;
    }

    const added = await categoriesCtx?.addCategory?.(clean);
    if (!added) {
      Alert.alert(t("categories.invalidTitle"), t("expenseForm.categoryInvalidMessage"));
      return;
    }

    inputChangedHandler("category", added);
    setNewCategory("");
    setIconModalOpen(false);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.brandBar}>
        <View style={styles.brandLeft}>
          <AppLogo size={34} borderRadius={12} />
          <View>
            <Text style={styles.brandTitle}>{t("expenseForm.brandTitle")}</Text>
            <Text style={styles.brandSub}>{t("expenseForm.brandSubtitle")}</Text>
          </View>
        </View>
        <View style={styles.brandBadge}>
          <Ionicons name="sparkles-outline" size={12} color={colors.textOnAccentStrong} />
          <Text style={styles.brandBadgeText}>{t("expenseForm.newBadge")}</Text>
        </View>
      </View>

      <View style={styles.header}>
        <View style={styles.headerIcon}>
          {isEmoji(inputs.icon) ? (
            <Text style={styles.headerEmoji}>{inputs.icon}</Text>
          ) : (
            <Ionicons name={inputs.icon} size={22} color={colors.primary50} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t("expenseForm.title")}</Text>
          <Text style={styles.subtitle}>{t("expenseForm.subtitle")}</Text>
        </View>
      </View>

      <View style={styles.previewRow}>
        <View style={styles.previewChip}>
          <Ionicons name="cash-outline" size={14} color={colors.textMuted} />
          <Text style={styles.previewText}>
            {Number.isFinite(amountNumber) && amountNumber > 0
              ? `${amountNumber.toFixed(2)} ${t("common.currencyCode")}`
              : t("expenseForm.amountPending")}
          </Text>
        </View>
        <View style={styles.previewChip}>
          <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
          <Text style={styles.previewText}>{formatCompactDate(inputs.date, localeTag)}</Text>
        </View>
        <View style={styles.previewChip}>
          <Ionicons name="card-outline" size={14} color={colors.textMuted} />
          <Text style={styles.previewText}>{payLabel}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionCard}>
          <Text style={styles.label}>{t("expenseForm.paymentHow")}</Text>

          <Pressable
            disabled={disabled}
            onPress={() => setPayModalOpen(true)}
            style={({ pressed }) => [
              styles.field,
              styles.sectionControl,
              pressed && !disabled && { opacity: 0.92 },
            ]}
          >
            <View style={styles.iconPreview}>
              <Ionicons
                name={inputs.payMethod === PAYMENT_METHOD.CARD ? "card-outline" : "cash-outline"}
                size={18}
                color={colors.textTitle}
              />
            </View>

            <Text style={styles.iconPickerText} numberOfLines={1}>
              {payLabel}
              {inputs.payMethod === PAYMENT_METHOD.CARD && selectedCardName ? ` - ${selectedCardName}` : ""}
              {inputs.payMethod === PAYMENT_METHOD.CASH && selectedCashName ? ` - ${selectedCashName}` : ""}
            </Text>

            <Ionicons name="chevron-down" size={18} color={colors.white65} />
          </Pressable>

          {inputs.payMethod === PAYMENT_METHOD.CARD && !selectedCardName ? (
            <Text style={styles.hintText}>{t("expenseForm.selectCardHint")}</Text>
          ) : null}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.label}>{t("expenseForm.category")}</Text>

          <Pressable
            disabled={disabled}
            onPress={() => {
              setActiveTab("CATEGORY");
              setIconModalOpen(true);
            }}
            style={({ pressed }) => [
              styles.field,
              styles.sectionControl,
              pressed && !disabled && { opacity: 0.92 },
            ]}
          >
            <View style={styles.iconPreview}>
              <Ionicons name="pricetags-outline" size={18} color={colors.textTitle} />
            </View>

            <Text style={styles.iconPickerText} numberOfLines={1}>
              {inputs.category ? inputs.category : t("expenseForm.selectCategory")}
            </Text>

            <Ionicons name="chevron-down" size={18} color={colors.white65} />
          </Pressable>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.label}>{t("expenseForm.icon")}</Text>

          <Pressable
            disabled={disabled}
            onPress={() => {
              setActiveTab("ICONS");
              setIconModalOpen(true);
            }}
            style={({ pressed }) => [
              styles.field,
              styles.sectionControl,
              pressed && !disabled && { opacity: 0.92 },
            ]}
          >
            <View style={styles.iconPreview}>
              {isEmoji(inputs.icon) ? (
                <Text style={styles.previewEmoji}>{inputs.icon}</Text>
              ) : (
                <Ionicons name={inputs.icon} size={18} color={colors.textTitle} />
              )}
            </View>

            <Text style={styles.iconPickerText} numberOfLines={1}>
              {t("expenseForm.selectIcon")}
            </Text>

            <Ionicons name="chevron-down" size={18} color={colors.white65} />
          </Pressable>
        </View>

        <View style={styles.sectionCard}>
          <View style={[styles.row, stackDateField && styles.rowStack]}>
            <View style={[styles.rowItem, stackDateField && styles.rowItemStack]}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t("expenseForm.amount")}</Text>
                <View style={styles.labelSpacer} />
              </View>

              <Animated.View
                style={[
                  styles.field,
                  { borderColor: amountBorderColor },
                  showAmountError && styles.fieldError,
                ]}
              >
                <Ionicons name="cash-outline" size={18} color={iconColor} />
                <TextInput
                  ref={amountRef}
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={inputs.amount}
                  onChangeText={(t) => inputChangedHandler("amount", t)}
                  editable={!disabled}
                  placeholder={t("expenseForm.amountPlaceholder")}
                  placeholderTextColor={placeholder}
                  onFocus={() => {
                    Animated.timing(amountFocus, {
                      toValue: 1,
                      duration: 160,
                      useNativeDriver: false,
                    }).start();
                  }}
                  onBlur={() => {
                    Animated.timing(amountFocus, {
                      toValue: 0,
                      duration: 160,
                      useNativeDriver: false,
                    }).start();
                    markTouched("amount");
                  }}
                  returnKeyType="done"
                />
                <Text style={styles.suffix}>{t("common.currencyCode")}</Text>
              </Animated.View>

              {showAmountError ? (
                <Text style={styles.errorText}>{t("expenseForm.invalidAmount")}</Text>
              ) : null}
            </View>

            <View style={[styles.rowItem, stackDateField && styles.rowItemStack]}>
              <CustomDatePicker
                label={t("datePicker.label")}
                value={inputs.date}
                onChange={(date) => inputChangedHandler("date", date)}
                disabled={disabled}
              />
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.label}>{t("expenseForm.expenseTitle")}</Text>
          <View style={[styles.fieldTextArea, showDescriptionError && styles.fieldError]}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={18}
              color={iconColor}
              style={{ marginTop: 2 }}
            />
            <TextInput
              style={styles.textArea}
              multiline
              value={inputs.description}
              onChangeText={(t) => inputChangedHandler("description", t)}
              editable={!disabled}
              placeholder={t("expenseForm.expenseTitlePlaceholder")}
              placeholderTextColor={placeholder}
              onBlur={() => markTouched("description")}
            />
          </View>
          {showDescriptionError ? (
            <Text style={styles.hintText}>{t("expenseForm.descriptionHint")}</Text>
          ) : null}
        </View>

        <View style={styles.buttons}>
          <View style={{ flex: 1 }}>
            <Button mode="flat" onPress={onCancel} disabled={disabled}>
              {t("common.cancel")}
            </Button>
          </View>
          <View style={{ flex: 1 }}>
            <Button onPress={submitHandler} disabled={disabled}>
              {submitButtonLabel}
            </Button>
          </View>
        </View>
      </View>

      <Modal visible={payModalOpen} transparent animationType="fade" onRequestClose={() => setPayModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t("expenseForm.paymentHow")}</Text>

            <View style={styles.catGrid}>
              <Pressable
                onPress={() => {
                  inputChangedHandler("payMethod", PAYMENT_METHOD.CASH);
                  inputChangedHandler(
                    "methodId",
                    resolveCashMethodId(
                      inputs.methodId,
                      cashWallets,
                      defaultCashWalletId,
                    ),
                  );
                }}
                style={[
                  styles.catCell,
                  inputs.payMethod === PAYMENT_METHOD.CASH && styles.cellActive,
                ]}
              >
                <Text style={styles.catText}>{t("expensesOutput.cash")}</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  inputChangedHandler("payMethod", PAYMENT_METHOD.CARD);
                  inputChangedHandler("methodId", resolveCardMethodId(inputs.methodId, cards));
                }}
                style={[
                  styles.catCell,
                  inputs.payMethod === PAYMENT_METHOD.CARD && styles.cellActive,
                ]}
              >
                <Text style={styles.catText}>{t("expensesOutput.card")}</Text>
              </Pressable>
            </View>

            {inputs.payMethod === PAYMENT_METHOD.CARD ? (
              <>
                <Text style={[styles.label, { marginTop: 6 }]}>{t("expenseForm.selectCard")}</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.catGrid}>
                    {(cards || []).length ? (
                      (cards || []).map((c) => {
                        const id = String(c.id);
                        const name = String(c.name || t("expensesOutput.card"));
                        const active = id === String(inputs.methodId);
                        return (
                          <Pressable
                            key={id}
                            onPress={() => {
                              inputChangedHandler("methodId", id);
                              setPayModalOpen(false);
                            }}
                            style={[styles.catCell, active && styles.cellActive]}
                          >
                            <Text style={styles.catText}>{name}</Text>
                          </Pressable>
                        );
                      })
                    ) : (
                      <View style={{ paddingVertical: 6 }}>
                        <Text style={styles.hintText}>{t("expenseForm.noCardsSaved")}</Text>
                      </View>
                    )}
                  </View>
                </ScrollView>
              </>
            ) : (
              <>
                <Text style={[styles.label, { marginTop: 6 }]}>{t("expenseForm.cashWallet")}</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.catGrid}>
                    {(cashWallets || []).length ? (
                      (cashWallets || []).map((w) => {
                        const id = String(w.id);
                        const name = String(w.name || t("expensesOutput.cash"));
                        const active = id === String(inputs.methodId);
                        return (
                          <Pressable
                            key={id}
                            onPress={() => {
                              inputChangedHandler("methodId", id);
                              setPayModalOpen(false);
                            }}
                            style={[styles.catCell, active && styles.cellActive]}
                          >
                            <Text style={styles.catText}>{name}</Text>
                          </Pressable>
                        );
                      })
                    ) : (
                      <View style={{ paddingVertical: 6 }}>
                        <Text style={styles.hintText}>{t("expenseForm.noCashWalletsSaved")}</Text>
                      </View>
                    )}
                  </View>
                </ScrollView>
              </>
            )}

            <Pressable style={styles.modalClose} onPress={() => setPayModalOpen(false)}>
              <Text style={styles.modalCloseText}>{t("common.close")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={iconModalOpen} transparent animationType="fade" onRequestClose={() => setIconModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {activeTab === "CATEGORY" ? t("expenseForm.selectCategory") : t("expenseForm.selectIcon")}
            </Text>

            <View style={styles.tabsRow}>
              <Pressable
                onPress={() => setActiveTab("CATEGORY")}
                style={[styles.tabBtn, activeTab === "CATEGORY" && styles.tabBtnActive]}
              >
                <Text style={[styles.tabText, activeTab === "CATEGORY" && styles.tabTextActive]}>
                  {t("expenseForm.categoriesTab")}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveTab("ICONS")}
                style={[styles.tabBtn, activeTab === "ICONS" && styles.tabBtnActive]}
              >
                <Text style={[styles.tabText, activeTab === "ICONS" && styles.tabTextActive]}>
                  {t("expenseForm.iconsTab")}
                </Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {activeTab === "CATEGORY" ? (
                <>
                  <View style={styles.addCategoryRow}>
                    <TextInput
                      value={newCategory}
                      onChangeText={setNewCategory}
                      placeholder={t("expenseForm.newCategoryPlaceholder")}
                      placeholderTextColor={colors.white45}
                      style={styles.addCategoryInput}
                      maxLength={24}
                      returnKeyType="done"
                      onSubmitEditing={addCustomCategory}
                    />
                    <Pressable
                      onPress={addCustomCategory}
                      style={({ pressed }) => [
                        styles.addCategoryBtn,
                        pressed && { opacity: 0.88 },
                      ]}
                    >
                      <Ionicons name="add" size={18} color={colors.textOnAccentStrong} />
                    </Pressable>
                  </View>

                  <View style={styles.catGrid}>
                    {categoryItems.map((cat) => {
                      const active = cat === inputs.category;
                      return (
                        <Pressable
                          key={cat}
                          onPress={() => {
                            inputChangedHandler("category", cat);
                            setIconModalOpen(false);
                          }}
                          style={[styles.catCell, active && styles.cellActive]}
                        >
                          <Text style={styles.catText}>{cat}</Text>
                        </Pressable>
                      );
                    })}

                    <Pressable
                      onPress={() => {
                        inputChangedHandler("category", "");
                        setIconModalOpen(false);
                      }}
                      style={[styles.catCell, !inputs.category && styles.cellActive]}
                    >
                      <Text style={styles.catText}>{t("common.none")}</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <View style={styles.grid}>
                  {iconItems.map((it) => {
                    const active = it === inputs.icon;
                    return (
                      <Pressable
                        key={it}
                        onPress={() => {
                          inputChangedHandler("icon", it);
                          setIconModalOpen(false);
                        }}
                        style={[styles.cell, active && styles.cellActive]}
                      >
                        <Ionicons name={it} size={22} color={colors.textTitle} />
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            <Pressable style={styles.modalClose} onPress={() => setIconModalOpen(false)}>
              <Text style={styles.modalCloseText}>{t("common.close")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
});

export default ExpenseForm;

function makeStyles(colors) {
  return StyleSheet.create({
    wrapper: { marginTop: 2, gap: 10 },
    brandBar: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      paddingVertical: 9,
      paddingHorizontal: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    brandLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    brandTitle: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 13,
    },
    brandSub: {
      marginTop: 1,
      color: colors.textMuted,
      fontWeight: "700",
      fontSize: 11,
    },
    brandBadge: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.accent30,
      backgroundColor: colors.accent500,
      paddingVertical: 4,
      paddingHorizontal: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    brandBadgeText: {
      color: colors.textOnAccentStrong,
      fontWeight: "900",
      fontSize: 10,
      letterSpacing: 0.3,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
    },
    headerIcon: {
      width: 44,
      height: 44,
      borderRadius: 15,
      backgroundColor: colors.accent500,
      alignItems: "center",
      justifyContent: "center",
    },
    headerEmoji: { fontSize: 22 },
    title: { fontSize: 17, fontWeight: "900", color: colors.textTitle },
    subtitle: {
      marginTop: 2,
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: "700",
    },
    previewRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    previewChip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.white12,
      backgroundColor: colors.white06,
      paddingVertical: 6,
      paddingHorizontal: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    previewText: {
      color: colors.textMuted,
      fontWeight: "800",
      fontSize: 11,
    },

    card: {
      backgroundColor: colors.surface,
      borderRadius: 22,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.white10,
    },
    sectionCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      paddingVertical: 10,
      paddingHorizontal: 10,
      marginBottom: 10,
    },

    row: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
    rowStack: { flexDirection: "column", gap: 14 },
    rowItem: { flex: 1 },
    rowItemStack: { width: "100%" },
    labelRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
      minHeight: 26,
    },
    label: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: "800",
      letterSpacing: 0.2,
    },
    sectionControl: { marginTop: 6 },
    labelSpacer: { width: 86, height: 22, opacity: 0 },

    field: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: colors.surface2,
      borderWidth: 1.5,
      borderColor: colors.white22,
    },
    fieldTextArea: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: colors.surface2,
      borderWidth: 1.5,
      borderColor: colors.white22,
    },
    fieldError: { borderColor: colors.error500 },

    input: { flex: 1, fontSize: 16, fontWeight: "800", color: colors.textTitle },
    suffix: {
      fontSize: 14,
      fontWeight: "900",
      color: colors.textBody,
      opacity: 0.9,
    },

    textArea: {
      flex: 1,
      minHeight: 96,
      fontSize: 16,
      fontWeight: "700",
      color: colors.textTitle,
      textAlignVertical: "top",
    },

    errorText: {
      marginTop: 6,
      color: colors.error500,
      fontWeight: "800",
      fontSize: 12,
    },
    hintText: {
      marginTop: 6,
      marginHorizontal: 2,
      color: colors.textMuted,
      fontWeight: "700",
      fontSize: 12,
    },

    buttons: { marginTop: 4, flexDirection: "row", gap: 10 },

    iconPreview: {
      width: 34,
      height: 34,
      borderRadius: 14,
      backgroundColor: colors.white10,
      borderWidth: 1,
      borderColor: colors.white12,
      alignItems: "center",
      justifyContent: "center",
    },
    previewEmoji: { fontSize: 18 },
    iconPickerText: {
      flex: 1,
      color: colors.textBody,
      fontWeight: "800",
    },

    modalBackdrop: {
      flex: 1,
      backgroundColor: colors.overlay60,
      padding: 16,
      justifyContent: "center",
    },
    modalCard: {
      backgroundColor: colors.primary800,
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.white10,
      maxHeight: "82%",
    },
    modalTitle: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 16,
      textAlign: "center",
      marginBottom: 12,
    },

    tabsRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
    tabBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: colors.white06,
      borderWidth: 1,
      borderColor: colors.white10,
      alignItems: "center",
    },
    tabBtnActive: {
      backgroundColor: colors.accent18,
      borderColor: colors.accent35,
    },
    tabText: { color: colors.textMuted, fontWeight: "900", fontSize: 12 },
    tabTextActive: { color: colors.textTitle },

    catGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      justifyContent: "center",
      paddingBottom: 10,
    },
    addCategoryRow: {
      flexDirection: "row",
      gap: 10,
      alignItems: "center",
      marginBottom: 10,
    },
    addCategoryInput: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      color: colors.textTitle,
      fontWeight: "800",
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    addCategoryBtn: {
      width: 44,
      height: 44,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.accent30,
      backgroundColor: colors.accent500,
      alignItems: "center",
      justifyContent: "center",
    },
    catCell: {
      width: "46%",
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor: colors.white06,
      borderWidth: 1,
      borderColor: colors.white10,
      alignItems: "center",
      justifyContent: "center",
    },
    catText: { color: colors.textTitle, fontWeight: "900" },

    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      justifyContent: "center",
      paddingBottom: 10,
    },
    cell: {
      width: 46,
      height: 46,
      borderRadius: 16,
      backgroundColor: colors.white06,
      borderWidth: 1,
      borderColor: colors.white10,
      alignItems: "center",
      justifyContent: "center",
    },
    cellActive: {
      backgroundColor: colors.accent18,
      borderColor: colors.accent35,
    },

    modalClose: {
      marginTop: 12,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: colors.primary700,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.white10,
    },
    modalCloseText: { color: colors.textTitle, fontWeight: "900" },
  });
}
