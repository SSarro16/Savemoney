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
import CustomDatePicker from "../ui/DatePicker";
import { GlobalStyles } from "../../constants/styles";
import { EXPENSE_ICONS } from "../../constants/expense-icons";
import { PAYMENT_METHOD } from "../../util/expenses/expense-presets";
import { ExpenseCategoriesContext } from "../../store/expense-categories-context";

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
    methodId:
      initialMethodId ||
      (initialPayMethod === PAYMENT_METHOD.CASH
        ? String(defaultCashWalletId || "")
        : ""),
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

  function inputChangedHandler(key, value) {
    setInputs((cur) => ({ ...cur, [key]: value }));
  }

  function submitHandler() {
    const payMethod = safePayMethod(inputs.payMethod);
    const methodId =
      payMethod === PAYMENT_METHOD.CARD
        ? String(inputs.methodId || "").trim()
        : String(inputs.methodId || defaultCashWalletId || "").trim();

    if (payMethod === PAYMENT_METHOD.CARD && !methodId) {
      Alert.alert("Carta mancante", "Se hai pagato con carta, seleziona quale.");
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
      Alert.alert("Input non valido", "Controlla descrizione, importo e data.");
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
          ? String(inputs.methodId || "").trim()
          : String(inputs.methodId || defaultCashWalletId || "").trim();

      return {
        title: (desc || category || "Preferito").slice(0, 22),
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
    inputs.payMethod === PAYMENT_METHOD.CARD ? "Carta" : "Contanti";

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
      Alert.alert("Categoria mancante", "Inserisci un nome categoria.");
      return;
    }

    const added = await categoriesCtx?.addCategory?.(clean);
    if (!added) {
      Alert.alert("Categoria non valida", "Usa almeno 1 carattere valido.");
      return;
    }

    inputChangedHandler("category", added);
    setNewCategory("");
    setIconModalOpen(false);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          {isEmoji(inputs.icon) ? (
            <Text style={styles.headerEmoji}>{inputs.icon}</Text>
          ) : (
            <Ionicons name={inputs.icon} size={22} color={colors.primary50} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Cosa hai comprato?</Text>
          <Text style={styles.subtitle}>Compila i campi e salva.</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.section}>
          <Text style={styles.label}>Come hai pagato</Text>

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
            <Text style={styles.hintText}>Seleziona una carta prima di salvare.</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Categoria</Text>

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
              {inputs.category ? inputs.category : "Seleziona categoria"}
            </Text>

            <Ionicons name="chevron-down" size={18} color={colors.white65} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Icona</Text>

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
              Seleziona icona
            </Text>

            <Ionicons name="chevron-down" size={18} color={colors.white65} />
          </Pressable>
        </View>

        <View style={[styles.row, stackDateField && styles.rowStack]}>
          <View style={[styles.rowItem, stackDateField && styles.rowItemStack]}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Importo EUR</Text>
              <View style={styles.labelSpacer} />
            </View>

            <Animated.View
              style={[
                styles.field,
                { borderColor: amountBorderColor },
                !amountOk && styles.fieldError,
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
                placeholder="12,50"
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
                }}
                returnKeyType="done"
              />
              <Text style={styles.suffix}>EUR</Text>
            </Animated.View>

            {!amountOk && <Text style={styles.errorText}>Inserisci un importo valido.</Text>}
          </View>

          <View style={[styles.rowItem, stackDateField && styles.rowItemStack]}>
            <CustomDatePicker
              label="Data"
              value={inputs.date}
              onChange={(date) => inputChangedHandler("date", date)}
              disabled={disabled}
            />
          </View>
        </View>

        <View style={styles.sectionLast}>
          <Text style={styles.label}>Descrizione</Text>
          <View style={[styles.fieldTextArea, !descOk && styles.fieldError]}>
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
              placeholder="Es. spesa supermercato"
              placeholderTextColor={placeholder}
            />
          </View>
          {!descOk && <Text style={styles.hintText}>Aggiungi una descrizione breve.</Text>}
        </View>

        <View style={styles.buttons}>
          <View style={{ flex: 1 }}>
            <Button mode="flat" onPress={onCancel} disabled={disabled}>
              Annulla
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
            <Text style={styles.modalTitle}>Come hai pagato?</Text>

            <View style={styles.catGrid}>
              <Pressable
                onPress={() => {
                  inputChangedHandler("payMethod", PAYMENT_METHOD.CASH);
                  if (!String(inputs.methodId || "").trim()) {
                    inputChangedHandler("methodId", String(defaultCashWalletId || ""));
                  }
                }}
                style={[
                  styles.catCell,
                  inputs.payMethod === PAYMENT_METHOD.CASH && styles.cellActive,
                ]}
              >
                <Text style={styles.catText}>Contanti</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  inputChangedHandler("payMethod", PAYMENT_METHOD.CARD);
                  if (inputs.payMethod !== PAYMENT_METHOD.CARD) {
                    inputChangedHandler("methodId", "");
                  }
                }}
                style={[
                  styles.catCell,
                  inputs.payMethod === PAYMENT_METHOD.CARD && styles.cellActive,
                ]}
              >
                <Text style={styles.catText}>Carta</Text>
              </Pressable>
            </View>

            {inputs.payMethod === PAYMENT_METHOD.CARD ? (
              <>
                <Text style={[styles.label, { marginTop: 6 }]}>Seleziona carta</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.catGrid}>
                    {(cards || []).length ? (
                      (cards || []).map((c) => {
                        const id = String(c.id);
                        const name = String(c.name || "Carta");
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
                        <Text style={styles.hintText}>Nessuna carta salvata in Carte/Contanti.</Text>
                      </View>
                    )}
                  </View>
                </ScrollView>
              </>
            ) : (
              <>
                <Text style={[styles.label, { marginTop: 6 }]}>Wallet contanti</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.catGrid}>
                    {(cashWallets || []).length ? (
                      (cashWallets || []).map((w) => {
                        const id = String(w.id);
                        const name = String(w.name || "Contanti");
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
                        <Text style={styles.hintText}>Nessun wallet contanti salvato.</Text>
                      </View>
                    )}
                  </View>
                </ScrollView>
              </>
            )}

            <Pressable style={styles.modalClose} onPress={() => setPayModalOpen(false)}>
              <Text style={styles.modalCloseText}>Chiudi</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={iconModalOpen} transparent animationType="fade" onRequestClose={() => setIconModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {activeTab === "CATEGORY" ? "Scegli una categoria" : "Scegli un'icona"}
            </Text>

            <View style={styles.tabsRow}>
              <Pressable
                onPress={() => setActiveTab("CATEGORY")}
                style={[styles.tabBtn, activeTab === "CATEGORY" && styles.tabBtnActive]}
              >
                <Text style={[styles.tabText, activeTab === "CATEGORY" && styles.tabTextActive]}>
                  Categorie
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveTab("ICONS")}
                style={[styles.tabBtn, activeTab === "ICONS" && styles.tabBtnActive]}
              >
                <Text style={[styles.tabText, activeTab === "ICONS" && styles.tabTextActive]}>
                  Icone
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
                      placeholder="Nuova categoria (es. Casa)"
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
                      <Text style={styles.catText}>Nessuna</Text>
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
              <Text style={styles.modalCloseText}>Chiudi</Text>
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
    wrapper: { marginTop: 2, gap: 12 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 2,
      paddingVertical: 2,
    },
    headerIcon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: colors.accent500,
      alignItems: "center",
      justifyContent: "center",
    },
    headerEmoji: { fontSize: 22 },
    title: { fontSize: 18, fontWeight: "900", color: colors.textTitle },
    subtitle: {
      marginTop: 2,
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: "700",
    },

    card: {
      backgroundColor: colors.primary700,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: colors.white08,
    },
    section: { marginBottom: 14 },
    sectionLast: { marginTop: 14 },

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
    sectionControl: { marginTop: 8 },
    labelSpacer: { width: 86, height: 22, opacity: 0 },

    field: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: colors.primary800,
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
      backgroundColor: colors.primary800,
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
      margin: 6,
      color: colors.textMuted,
      fontWeight: "700",
      fontSize: 12,
    },

    buttons: { marginTop: 18, flexDirection: "row", gap: 10 },

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
