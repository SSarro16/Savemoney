import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { BudgetContext } from "../../store/budget-context";
import { ExpenseCategoriesContext } from "../../store/expense-categories-context";
import { GlobalStyles } from "../../constants/styles";
import ProgressBar from "./ProgressBar";

const toNumber = (s) => {
  const cleaned = String(s ?? "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
};

const categoryIcons = {
  Spese: "cart-outline",
  Risparmio: "wallet-outline",
  Svago: "game-controller-outline",
  Altro: "ellipsis-horizontal",
};

const STICKY_H = 76;

function normalizeBudgetCategoryName(value) {
  const cleaned = String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^A-Za-z0-9' \-/]/g, "")
    .slice(0, 24);
  if (!cleaned) return "";
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((x) => `${x.charAt(0).toUpperCase()}${x.slice(1)}`)
    .join(" ");
}

// --------------------
// ✅ Mini Toast (no libs)
// --------------------
function Toast({ visible, type = "success", text = "", colors, styles }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, anim]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-16, 0],
  });

  const bg = type === "error" ? colors.danger20 : colors.accent16;
  const border = type === "error" ? colors.danger30 : colors.accent28;
  const icon =
    type === "error" ? "close-circle-outline" : "checkmark-circle-outline";

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.toastWrap, { opacity: anim, transform: [{ translateY }] }]}
    >
      <View
        style={[styles.toastCard, { backgroundColor: bg, borderColor: border }]}
      >
        <Ionicons name={icon} size={18} color="white" />
        <Text style={styles.toastText} numberOfLines={2}>
          {text}
        </Text>
      </View>
    </Animated.View>
  );
}

// --------------------
// ✅ Mini Spinner (no libs)
// --------------------
function MiniSpinner({ size = 16, color }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 650,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Ionicons name="sync-outline" size={size} color={color} />
    </Animated.View>
  );
}

export default function ManageBudget({ onSave }) {
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);
  const budgetCtx = useContext(BudgetContext);
  const categoriesCtx = useContext(ExpenseCategoriesContext);
  const scrollRef = useRef(null);
  const currentTitle = String(
    budgetCtx.activeBudgetMeta?.title ||
      budgetCtx.activeBudgetMeta?.name ||
      "Nuovo budget",
  );

  const [localTitleText, setLocalTitleText] = useState(currentTitle);

  const [localTotalText, setLocalTotalText] = useState(
    String(budgetCtx.total ?? 0),
  );
  const [localCategoriesText, setLocalCategoriesText] = useState(() => {
    const obj = {};
    Object.entries(budgetCtx.categories || {}).forEach(([k, v]) => {
      obj[k] = String(v ?? 0);
    });
    return obj;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [newCategoryText, setNewCategoryText] = useState("");

  // ✅ toast
  const [toast, setToast] = useState({
    visible: false,
    type: "success",
    text: "",
  });
  const toastTimer = useRef(null);

  const showToast = (type, text) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, type, text });
    toastTimer.current = setTimeout(() => {
      setToast((t) => ({ ...t, visible: false }));
    }, 1400);
  };

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const totalNumber = useMemo(() => toNumber(localTotalText), [localTotalText]);

  const categoriesNumbers = useMemo(() => {
    return Object.fromEntries(
      Object.entries(localCategoriesText).map(([k, v]) => [k, toNumber(v)]),
    );
  }, [localCategoriesText]);

  const used = useMemo(
    () =>
      Object.values(categoriesNumbers).reduce(
        (s, v) => s + (Number(v) || 0),
        0,
      ),
    [categoriesNumbers],
  );

  const remaining = useMemo(
    () => (Number(totalNumber) || 0) - used,
    [totalNumber, used],
  );
  const isOver = remaining < 0;

  // ✅ valore progress (0..1) basato su used/total
  const progressValue = useMemo(() => {
    const t = Number(totalNumber) || 0;
    if (t <= 0) return 0;
    const v = used / t;
    return Math.max(0, Math.min(1, v));
  }, [totalNumber, used]);

  // ✅ warning haptic quando vai over (solo al cambio)
  const prevOverRef = useRef(isOver);
  useEffect(() => {
    if (!prevOverRef.current && isOver) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
        () => {},
      );
    }
    prevOverRef.current = isOver;
  }, [isOver]);

  // ✅ dirty
  const isDirty = useMemo(() => {
    const ctxTotal = Number(budgetCtx.total) || 0;
    const ctxCats = budgetCtx.categories || {};
    const cleanLocalTitle = String(localTitleText || "").trim();
    const cleanCtxTitle = String(currentTitle || "").trim();
    if (cleanLocalTitle && cleanLocalTitle !== cleanCtxTitle) return true;
    if (toNumber(localTotalText) !== ctxTotal) return true;

    for (const k of Object.keys(localCategoriesText)) {
      if ((Number(ctxCats[k]) || 0) !== toNumber(localCategoriesText[k]))
        return true;
    }
    return false;
  }, [
    budgetCtx.total,
    budgetCtx.categories,
    localTotalText,
    localCategoriesText,
    localTitleText,
    currentTitle,
  ]);

  const handleUpdateContext = () => {
    budgetCtx.setTotal(totalNumber);
    Object.entries(categoriesNumbers).forEach(([cat, val]) => {
      budgetCtx.updateCategory(cat, val);
    });
  };

  const handleChangeCategory = (cat, text) => {
    setLocalCategoriesText((prev) => ({ ...prev, [cat]: text }));
  };

  async function addCategoryHandler() {
    const clean = normalizeBudgetCategoryName(newCategoryText);
    if (!clean) {
      Alert.alert("Categoria mancante", "Inserisci un nome categoria valido.");
      return;
    }

    const exists = Object.keys(localCategoriesText || {}).some(
      (x) => String(x).toLowerCase() === clean.toLowerCase(),
    );
    if (exists) {
      Alert.alert("Gia presente", "Questa categoria esiste gia nel budget.");
      return;
    }

    const added = await categoriesCtx?.addCategory?.(clean).catch(() => "");
    const finalName = String(added || clean);

    setLocalCategoriesText((prev) => ({
      ...prev,
      [finalName]: "0",
    }));
    budgetCtx.updateCategory(finalName, 0);
    setNewCategoryText("");
    showToast("success", `Categoria "${finalName}" aggiunta`);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }

  useEffect(() => {
    setLocalTitleText(currentTitle);
  }, [currentTitle]);

  useEffect(() => {
    setLocalTotalText(String(budgetCtx.total ?? 0));
    const obj = {};
    Object.entries(budgetCtx.categories || {}).forEach(([k, v]) => {
      obj[k] = String(v ?? 0);
    });
    setLocalCategoriesText(obj);
  }, [budgetCtx.total, budgetCtx.categories]);

  const scrollToBottomSoon = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  async function saveHandler() {
    if (!isDirty || isSaving) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    try {
      setIsSaving(true);

      await budgetCtx.saveBudget({
        title: String(localTitleText || "").trim() || currentTitle,
        total: totalNumber,
        categories: categoriesNumbers,
        cashBalance: budgetCtx.cashBalance,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      showToast("success", "Budget salvato ✓");
      setTimeout(() => onSave?.(), 250);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {},
      );
      showToast("error", "Errore nel salvataggio");
      Alert.alert("Errore", err?.message || "Impossibile salvare il budget!");
    } finally {
      setIsSaving(false);
    }
  }

  function doReset() {
    budgetCtx.resetBudget();
    setLocalTotalText("0");
    setLocalCategoriesText((prev) =>
      Object.fromEntries(Object.keys(prev || {}).map((k) => [k, "0"])),
    );
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ y: 0, animated: true }),
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
    showToast("success", "Budget resettato");
  }

  function resetHandlerLongPress() {
    if (isSaving) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
      () => {},
    );

    Alert.alert("Azzera budget", "Vuoi azzerare totale e categorie?", [
      { text: "Annulla", style: "cancel" },
      { text: "Azzera", style: "destructive", onPress: doReset },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 110 : 0}
    >
      <View style={{ flex: 1 }}>
        <Toast
          visible={toast.visible}
          type={toast.type}
          text={toast.text}
          colors={colors}
          styles={styles}
        />

        <ScrollView
          ref={scrollRef}
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* SUMMARY */}
          <View style={[styles.summaryCard, isOver && styles.summaryCardOver]}>
            <View style={styles.summaryTop}>
              <View style={styles.summaryIcon}>
                <Ionicons
                  name={isOver ? "warning-outline" : "cash-outline"}
                  size={18}
                  color="white"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.summaryTitle}>Rimanenti</Text>
                <Text style={styles.summarySub}>
                  {budgetCtx.formatEuro(used)} allocati •{" "}
                  {budgetCtx.formatEuro(totalNumber)} totali
                </Text>
              </View>

              <View style={[styles.pill, isOver && styles.pillOver]}>
                <Text style={styles.pillText}>{isOver ? "SFORATO" : "OK"}</Text>
              </View>
            </View>

            <Text style={[styles.remainingValue, isOver && styles.overText]}>
              {budgetCtx.formatEuro(remaining)}
            </Text>

            {/* ✅ FIX ProgressBar (value/color) */}
            <ProgressBar
              value={progressValue}
              color={isOver ? colors.error500 : colors.accent500}
            />

            <View style={styles.summaryRow}>
              <View style={styles.smallBox}>
                <Text style={styles.smallLabel}>Allocati</Text>
                <Text style={styles.smallValue}>
                  {budgetCtx.formatEuro(used)}
                </Text>
              </View>
              <View style={styles.smallBox}>
                <Text style={styles.smallLabel}>Totale</Text>
                <Text style={styles.smallValue}>
                  {budgetCtx.formatEuro(totalNumber)}
                </Text>
              </View>
            </View>
          </View>

          {/* FORM */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Modifica Budget</Text>
            <Text style={styles.formSub}>
              Aggiorna totale e importi per categoria.
            </Text>

            <View style={{ marginTop: 14 }}>
              <Text style={styles.label}>Nome budget</Text>
              <View style={styles.field}>
                <Ionicons
                  name="pencil-outline"
                  size={18}
                  color={colors.white75}
                />
                <TextInput
                  style={styles.input}
                  value={localTitleText}
                  onChangeText={setLocalTitleText}
                  placeholder="Es. Casa, Viaggi, Universita"
                  placeholderTextColor={colors.white40}
                  returnKeyType="done"
                  maxLength={36}
                />
              </View>
            </View>

            <View style={{ marginTop: 14 }}>
              <Text style={styles.label}>Budget Totale</Text>
              <View style={styles.field}>
                <Ionicons
                  name="cash-outline"
                  size={18}
                  color={colors.white75}
                />
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={localTotalText}
                  onChangeText={setLocalTotalText}
                  onEndEditing={handleUpdateContext}
                  placeholder="0"
                  placeholderTextColor={colors.white40}
                  returnKeyType="done"
                />
                <Text style={styles.suffix}>€</Text>
              </View>
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={styles.label}>Categorie</Text>

              {Object.entries(localCategoriesText).map(([cat, val]) => (
                <View key={cat} style={styles.categoryRow}>
                  <View style={styles.iconBadge}>
                    <Ionicons
                      name={categoryIcons[cat] ?? "pricetag-outline"}
                      size={18}
                      color="white"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.categoryLabel}>{cat}</Text>
                    <Text style={styles.categoryHint}>
                      {Number(totalNumber) > 0
                        ? `${((toNumber(val) / totalNumber) * 100 || 0).toFixed(0)}% del totale`
                        : "Imposta un totale"}
                    </Text>
                  </View>

                  <View style={styles.fieldSmall}>
                    <TextInput
                      style={styles.inputSmall}
                      keyboardType="numeric"
                      value={val}
                      onChangeText={(text) => handleChangeCategory(cat, text)}
                      onEndEditing={handleUpdateContext}
                      onFocus={scrollToBottomSoon}
                      placeholder="0"
                      placeholderTextColor={colors.white40}
                      returnKeyType="done"
                    />
                    <Text style={styles.suffix}>€</Text>
                  </View>
                </View>
              ))}

              <View style={styles.addCategoryRow}>
                <View style={[styles.field, styles.addCategoryInputWrap]}>
                  <Ionicons name="add-circle-outline" size={18} color={colors.white75} />
                  <TextInput
                    style={styles.input}
                    value={newCategoryText}
                    onChangeText={setNewCategoryText}
                    placeholder="Nuova categoria budget"
                    placeholderTextColor={colors.white40}
                    returnKeyType="done"
                    maxLength={24}
                    onSubmitEditing={addCategoryHandler}
                  />
                </View>
                <Pressable
                  onPress={addCategoryHandler}
                  style={({ pressed }) => [
                    styles.addCategoryBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons name="add" size={20} color={colors.textOnAccentStrong} />
                </Pressable>
              </View>
            </View>

            <Text style={styles.resetHint}>
              Suggerimento: tieni premuto "Azzera" per azzerare.
            </Text>
          </View>

          <View style={{ height: STICKY_H + 26 }} />
        </ScrollView>

        {/* STICKY BAR */}
        <View style={styles.stickyWrap} pointerEvents="box-none">
          <View style={styles.stickyBar}>
            <Pressable
              onLongPress={resetHandlerLongPress}
              delayLongPress={380}
              disabled={isSaving}
              style={({ pressed }) => [
                styles.btn,
                styles.btnGhost,
                pressed && styles.pressed,
                isSaving && styles.btnDisabled,
              ]}
            >
              <Ionicons name="refresh-outline" size={18} color="white" />
              <Text style={styles.btnText}>Azzera</Text>
            </Pressable>

            <Pressable
              onPress={saveHandler}
              disabled={!isDirty || isSaving}
              style={({ pressed }) => [
                styles.btn,
                styles.btnPrimary,
                (pressed || !isDirty || isSaving) && styles.pressed,
                (!isDirty || isSaving) && styles.btnDisabled,
              ]}
            >
              {isSaving ? (
                <>
                  <MiniSpinner size={18} color={colors.textOnAccentStrong} />
                  <Text style={[styles.btnText, { color: colors.textOnAccentStrong }]}>
                    Salvataggio...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="save-outline"
                    size={18}
                    color={colors.textOnAccentStrong}
                  />
                  <Text style={[styles.btnText, { color: colors.textOnAccentStrong }]}>
                    Salva
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary800 },
  contentContainer: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },

  toastWrap: {
    position: "absolute",
    top: 10,
    left: 14,
    right: 14,
    zIndex: 999,
  },
  toastCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  toastText: { flex: 1, color: "white", fontWeight: "900", fontSize: 13 },

  summaryCard: {
    backgroundColor: colors.primary700,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.white08,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  summaryCardOver: { borderColor: colors.danger20 },
  summaryTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  summaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.white10,
    borderWidth: 1,
    borderColor: colors.white12,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryTitle: { color: "white", fontWeight: "900", fontSize: 14 },
  summarySub: {
    marginTop: 2,
    color: colors.white65,
    fontWeight: "700",
    fontSize: 12,
  },

  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: colors.accent16,
    borderWidth: 1,
    borderColor: colors.accent28,
  },
  pillOver: { backgroundColor: colors.danger12, borderColor: colors.danger22 },
  pillText: { color: "white", fontWeight: "900", fontSize: 12 },

  remainingValue: {
    marginTop: 12,
    fontSize: 32,
    fontWeight: "900",
    color: colors.accent500,
  },
  overText: { color: colors.error500 },

  summaryRow: { marginTop: 12, flexDirection: "row", gap: 10 },
  smallBox: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.primary800,
    borderWidth: 1,
    borderColor: colors.white10,
  },
  smallLabel: { color: colors.white60, fontWeight: "800", fontSize: 12 },
  smallValue: { marginTop: 6, color: "white", fontWeight: "900", fontSize: 14 },

  formCard: {
    backgroundColor: colors.primary700,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.white08,
  },
  formTitle: { color: "white", fontWeight: "900", fontSize: 16 },
  formSub: {
    marginTop: 4,
    color: colors.white65,
    fontWeight: "700",
    fontSize: 12,
  },

  label: {
    color: colors.white75,
    fontWeight: "900",
    fontSize: 12,
    marginBottom: 8,
  },

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
  input: { flex: 1, fontSize: 16, fontWeight: "900", color: "white" },
  suffix: { color: colors.white85, fontWeight: "900" },

  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.primary800,
    borderWidth: 1,
    borderColor: colors.white10,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: colors.white10,
    borderWidth: 1,
    borderColor: colors.white12,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryLabel: { color: colors.white92, fontWeight: "900", fontSize: 14 },
  categoryHint: {
    marginTop: 2,
    color: colors.white55,
    fontWeight: "700",
    fontSize: 12,
  },

  fieldSmall: {
    width: 120,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: colors.white06,
    borderWidth: 1,
    borderColor: colors.white10,
    justifyContent: "space-between",
  },
  inputSmall: {
    flex: 1,
    fontSize: 14,
    fontWeight: "900",
    color: "white",
    textAlign: "right",
  },
  addCategoryRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  addCategoryInputWrap: { flex: 1 },
  addCategoryBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.accent30,
    backgroundColor: colors.accent500,
  },

  resetHint: {
    marginTop: 2,
    color: colors.white55,
    fontWeight: "800",
    fontSize: 12,
  },

  stickyWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingBottom: Platform.OS === "ios" ? 14 : 12,
  },
  stickyBar: {
    height: 76,
    borderRadius: 18,
    backgroundColor: colors.primary700,
    borderWidth: 1,
    borderColor: colors.white10,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },

  btn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
  },
  btnGhost: { backgroundColor: colors.white06, borderColor: colors.white12 },
  btnPrimary: {
    backgroundColor: colors.accent500,
    borderColor: colors.accent30,
  },
  btnDisabled: { opacity: 0.55 },

  btnText: { color: "white", fontWeight: "900" },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  });
}


