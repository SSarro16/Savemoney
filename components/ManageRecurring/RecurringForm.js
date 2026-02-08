// components/ManageRecurring/RecurringForm.js
import React, { useContext, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { GlobalStyles } from "../../constants/styles";
import CustomDatePicker from "../ui/DatePicker";
import IconPicker from "../ManageExpense/IconPicker";
import { ExpenseCategoriesContext } from "../../store/expense-categories-context";

import {
  Cadence as CadenceImport,
  RecurringType,
} from "../../util/recurring/recurring-utils";

const CadenceSafe = CadenceImport || {
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
  YEARLY: "YEARLY",
};

const CADENCE_OPTIONS = [
  { key: CadenceSafe.DAILY, label: "Giornaliera" },
  { key: CadenceSafe.WEEKLY, label: "Settimanale" },
  { key: CadenceSafe.MONTHLY, label: "Mensile" },
  { key: CadenceSafe.YEARLY, label: "Annuale" },
];

function toNumber(text) {
  const cleaned = String(text ?? "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export default function RecurringForm({ defaultValues, onSubmit, onCancel }) {
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);
  const categoriesCtx = useContext(ExpenseCategoriesContext);

  const isEditing = !!defaultValues?.id;

  const [type, setType] = useState(defaultValues?.type || RecurringType.HABIT);
  const [title, setTitle] = useState(String(defaultValues?.title || ""));
  const [description, setDescription] = useState(String(defaultValues?.description || ""));
  const [amountText, setAmountText] = useState(
    defaultValues?.amount != null && defaultValues?.amount !== ""
      ? String(defaultValues.amount)
      : "",
  );
  const [category, setCategory] = useState(defaultValues?.category || "Spese");
  const [newCategory, setNewCategory] = useState("");
  const [icon, setIcon] = useState(
    defaultValues?.icon ||
      (type === RecurringType.SUBSCRIPTION ? "repeat-outline" : "flash-outline"),
  );
  const [cadence, setCadence] = useState(
    defaultValues?.cadence ||
      (type === RecurringType.SUBSCRIPTION ? CadenceSafe.MONTHLY : CadenceSafe.DAILY),
  );
  const [nextDue, setNextDue] = useState(
    defaultValues?.nextDue ? new Date(defaultValues.nextDue) : new Date(),
  );

  const amount = useMemo(() => toNumber(amountText), [amountText]);

  const categoryItems = useMemo(() => {
    const base = Array.isArray(categoriesCtx?.categories)
      ? categoriesCtx.categories
      : [];
    const selected = String(category || "").trim();
    if (!selected) return base;
    const exists = base.some(
      (x) => String(x).toLowerCase() === selected.toLowerCase(),
    );
    return exists ? base : [...base, selected];
  }, [categoriesCtx?.categories, category]);

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
    setCategory(added);
    setNewCategory("");
  };

  const submit = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      Alert.alert("Titolo mancante", "Inserisci un titolo.");
      return;
    }
    if (amount <= 0) {
      Alert.alert("Importo non valido", "Inserisci un importo > 0.");
      return;
    }
    if (!(nextDue instanceof Date) || Number.isNaN(nextDue.getTime())) {
      Alert.alert("Data non valida", "Seleziona una data valida.");
      return;
    }

    onSubmit?.({
      ...defaultValues,
      type,
      title: cleanTitle,
      description: description.trim(),
      amount,
      category: category?.trim() || "Spese",
      icon: icon || "repeat-outline",
      cadence: cadence || CadenceSafe.MONTHLY,
      nextDue: nextDue.toISOString(),
    });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{isEditing ? "Modifica" : "Nuova ricorrenza"}</Text>

      <View style={[styles.row, styles.typeRow]}>
        <Pressable
          onPress={() => {
            setType(RecurringType.HABIT);
            setCadence((cur) => cur || CadenceSafe.DAILY);
            if (!icon || icon === "repeat-outline") setIcon("flash-outline");
          }}
          style={({ pressed }) => [
            styles.pill,
            type === RecurringType.HABIT && styles.pillActive,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Ionicons name="flash-outline" size={16} color={colors.textTitle} />
          <Text style={styles.pillText}>Abitudine</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setType(RecurringType.SUBSCRIPTION);
            setCadence((cur) => cur || CadenceSafe.MONTHLY);
            if (!icon || icon === "flash-outline") setIcon("repeat-outline");
          }}
          style={({ pressed }) => [
            styles.pill,
            type === RecurringType.SUBSCRIPTION && styles.pillActive,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Ionicons name="repeat-outline" size={16} color={colors.textTitle} />
          <Text style={styles.pillText}>Abbonamento</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Titolo</Text>
      <View style={styles.field}>
        <Ionicons name="text-outline" size={18} color={colors.white75} />
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Es. Netflix, Palestra"
          placeholderTextColor={colors.white40}
        />
      </View>

      <Text style={[styles.label, { marginTop: 12 }]}>Importo</Text>
      <View style={styles.field}>
        <Ionicons name="cash-outline" size={18} color={colors.white75} />
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={amountText}
          onChangeText={setAmountText}
          placeholder="0"
          placeholderTextColor={colors.white40}
        />
        <Text style={styles.suffix}>EUR</Text>
      </View>

      <Text style={[styles.label, { marginTop: 12 }]}>Categoria</Text>
      <View style={styles.addCategoryRow}>
        <TextInput
          style={styles.addCategoryInput}
          value={newCategory}
          onChangeText={setNewCategory}
          placeholder="Nuova categoria (es. Casa)"
          placeholderTextColor={colors.white40}
          maxLength={24}
          returnKeyType="done"
          onSubmitEditing={addCustomCategory}
        />
        <Pressable
          onPress={addCustomCategory}
          style={({ pressed }) => [
            styles.addCategoryBtn,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Ionicons name="add" size={18} color={colors.textOnAccentStrong} />
        </Pressable>
      </View>
      <View style={styles.rowWrap}>
        {categoryItems.map((c) => {
          const active = c === category;
          return (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={styles.chipText}>{c}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.label, { marginTop: 12 }]}>Icona</Text>
      <IconPicker value={icon} onChange={setIcon} title="Scegli icona ricorrenza" />

      <Text style={[styles.label, { marginTop: 12 }]}>Frequenza</Text>
      <View style={styles.rowWrap}>
        {CADENCE_OPTIONS.map((opt) => {
          const active = opt.key === cadence;
          return (
            <Pressable
              key={opt.key}
              onPress={() => setCadence(opt.key)}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={styles.chipText}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: 10 }}>
        <CustomDatePicker
          label="Prossima scadenza"
          value={nextDue}
          onChange={setNextDue}
        />
      </View>

      <Text style={[styles.label, { marginTop: 12 }]}>Note (opzionale)</Text>
      <View style={[styles.field, { alignItems: "flex-start" }]}>
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={18}
          color={colors.white75}
          style={{ marginTop: 2 }}
        />
        <TextInput
          style={[styles.input, { minHeight: 72 }]}
          multiline
          value={description}
          onChangeText={setDescription}
          placeholder="Es. ogni 1 del mese"
          placeholderTextColor={colors.white40}
        />
      </View>

      <View style={[styles.row, { marginTop: 18 }]}> 
        <Pressable
          onPress={onCancel}
          style={({ pressed }) => [styles.btnGhost, pressed && styles.pressed]}
        >
          <Text style={styles.btnGhostText}>Annulla</Text>
        </Pressable>

        <Pressable
          onPress={submit}
          style={({ pressed }) => [styles.btnPrimary, pressed && styles.pressed]}
        >
          <Ionicons name="save-outline" size={18} color={colors.textOnAccentStrong} />
          <Text style={styles.btnPrimaryText}>Salva</Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.primary700,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.white08,
    },
    title: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 16,
      marginBottom: 12,
    },
    label: {
      color: colors.white75,
      fontWeight: "900",
      fontSize: 12,
      marginBottom: 8,
    },

    row: { flexDirection: "row", gap: 10, alignItems: "center" },
    typeRow: { marginBottom: 10 },
    rowWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 10,
      columnGap: 10,
    },
    addCategoryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 10,
    },
    addCategoryInput: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.primary800,
      color: colors.textTitle,
      fontWeight: "900",
      paddingHorizontal: 12,
      paddingVertical: 11,
    },
    addCategoryBtn: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.accent500,
      borderWidth: 1,
      borderColor: colors.accent30,
      alignItems: "center",
      justifyContent: "center",
    },

    pill: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 16,
      backgroundColor: colors.white06,
      borderWidth: 1,
      borderColor: colors.white10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    pillActive: {
      backgroundColor: colors.accent18,
      borderColor: colors.accent35,
    },
    pillText: { color: colors.textTitle, fontWeight: "900" },

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
    input: { flex: 1, fontSize: 16, fontWeight: "900", color: colors.textTitle },
    suffix: { color: colors.textBody, fontWeight: "900" },

    chip: {
      width: "48%",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: colors.white06,
      borderWidth: 1,
      borderColor: colors.white10,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 44,
    },
    chipActive: {
      backgroundColor: colors.accent18,
      borderColor: colors.accent35,
    },
    chipText: { color: colors.textTitle, fontWeight: "900", fontSize: 12 },

    btnGhost: {
      flex: 1,
      height: 48,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.white06,
      borderWidth: 1,
      borderColor: colors.white12,
    },
    btnGhostText: { color: colors.textTitle, fontWeight: "900" },

    btnPrimary: {
      flex: 1,
      height: 48,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      backgroundColor: colors.accent500,
      borderWidth: 1,
      borderColor: colors.accent30,
    },
    btnPrimaryText: { color: colors.textOnAccentStrong, fontWeight: "900" },
    pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  });
}
