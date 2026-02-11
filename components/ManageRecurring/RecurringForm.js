import React, { useContext, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { GlobalStyles } from "../../constants/styles";
import CustomDatePicker from "../ui/DatePicker";
import IconPicker from "../ManageExpense/IconPicker";
import { ExpenseCategoriesContext } from "../../store/expense-categories-context";
import { useTranslation } from "../../store/language-context";
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

function toNumber(text) {
  const cleaned = String(text ?? "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function formatCompactDate(value, localeTag) {
  const date = value instanceof Date ? value : new Date(value);
  if (!date || Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(localeTag || "it-IT", {
    day: "2-digit",
    month: "short",
  });
}

export default function RecurringForm({ defaultValues, onSubmit, onCancel }) {
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);
  const categoriesCtx = useContext(ExpenseCategoriesContext);
  const { t, localeTag } = useTranslation();

  const isEditing = !!defaultValues?.id;

  const [type, setType] = useState(defaultValues?.type || RecurringType.HABIT);
  const [title, setTitle] = useState(String(defaultValues?.title || ""));
  const [description, setDescription] = useState(
    String(defaultValues?.description || ""),
  );
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
  const isHabit = type === RecurringType.HABIT;
  const isSubscription = type === RecurringType.SUBSCRIPTION;

  const cadenceOptions = useMemo(
    () => [
      { key: CadenceSafe.DAILY, label: t("recurringForm.cadenceDaily") },
      { key: CadenceSafe.WEEKLY, label: t("recurringForm.cadenceWeekly") },
      { key: CadenceSafe.MONTHLY, label: t("recurringForm.cadenceMonthly") },
      { key: CadenceSafe.YEARLY, label: t("recurringForm.cadenceYearly") },
    ],
    [t],
  );

  const categoryItems = useMemo(() => {
    const base = Array.isArray(categoriesCtx?.categories)
      ? categoriesCtx.categories
      : [];
    const selected = String(category || "").trim();
    if (!selected) return base;
    const exists = base.some(
      (item) => String(item).toLowerCase() === selected.toLowerCase(),
    );
    return exists ? base : [...base, selected];
  }, [categoriesCtx?.categories, category]);

  const recurrenceTone = useMemo(() => {
    if (isHabit) {
      return {
        icon: "flash-outline",
        subtitle: t("recurring.newHabitSubtitle"),
        badgeBg: colors.accent500,
        badgeBorder: colors.accent30,
        badgeText: colors.textOnAccentStrong,
        heroBg: colors.accent12,
        heroBorder: colors.accent30,
      };
    }
    return {
      icon: "repeat-outline",
      subtitle: t("recurring.newSubscriptionSubtitle"),
      badgeBg: colors.white08,
      badgeBorder: colors.white16,
      badgeText: colors.textTitle,
      heroBg: colors.white06,
      heroBorder: colors.white12,
    };
  }, [isHabit, t, colors]);

  const addCustomCategory = async () => {
    const clean = String(newCategory || "").trim();
    if (!clean) {
      Alert.alert(
        t("recurringForm.categoryMissingTitle"),
        t("recurringForm.categoryMissingMessage"),
      );
      return;
    }
    const added = await categoriesCtx?.addCategory?.(clean);
    if (!added) {
      Alert.alert(
        t("recurringForm.categoryInvalidTitle"),
        t("recurringForm.categoryInvalidMessage"),
      );
      return;
    }
    setCategory(added);
    setNewCategory("");
  };

  const selectHabit = () => {
    setType(RecurringType.HABIT);
    setCadence(CadenceSafe.DAILY);
    setNextDue(new Date());
    if (!icon || icon === "repeat-outline") setIcon("flash-outline");
  };

  const selectSubscription = () => {
    setType(RecurringType.SUBSCRIPTION);
    setCadence(CadenceSafe.MONTHLY);
    if (!icon || icon === "flash-outline") setIcon("repeat-outline");
  };

  const submit = () => {
    const cleanTitle = title.trim();
    const effectiveNextDue = isHabit ? new Date() : nextDue;
    if (!cleanTitle) {
      Alert.alert(
        t("recurringForm.titleMissingTitle"),
        t("recurringForm.titleMissingMessage"),
      );
      return;
    }
    if (amount <= 0) {
      Alert.alert(
        t("recurringForm.invalidAmountTitle"),
        t("recurringForm.invalidAmountMessage"),
      );
      return;
    }
    if (
      isSubscription &&
      (!(effectiveNextDue instanceof Date) ||
        Number.isNaN(effectiveNextDue.getTime()))
    ) {
      Alert.alert(
        t("recurringForm.invalidDateTitle"),
        t("recurringForm.invalidDateMessage"),
      );
      return;
    }

    onSubmit?.({
      ...defaultValues,
      type,
      title: cleanTitle,
      description: description.trim(),
      amount,
      category: category?.trim() || "Spese",
      icon: icon || (isHabit ? "flash-outline" : "repeat-outline"),
      cadence: cadence || (isHabit ? CadenceSafe.DAILY : CadenceSafe.MONTHLY),
      nextDue: effectiveNextDue.toISOString(),
    });
  };

  const amountPreview =
    amount > 0
      ? `${amount.toFixed(2)} ${t("common.currencyCode")}`
      : `0.00 ${t("common.currencyCode")}`;

  return (
    <View style={styles.card}>
      <View
        style={[
          styles.hero,
          {
            backgroundColor: recurrenceTone.heroBg,
            borderColor: recurrenceTone.heroBorder,
          },
        ]}
      >
        <View
          style={[
            styles.heroBadge,
            {
              backgroundColor: recurrenceTone.badgeBg,
              borderColor: recurrenceTone.badgeBorder,
            },
          ]}
        >
          <Ionicons name={recurrenceTone.icon} size={14} color={recurrenceTone.badgeText} />
          <Text style={[styles.heroBadgeText, { color: recurrenceTone.badgeText }]}>
            {isHabit ? t("recurring.typeHabit") : t("recurring.typeSubscription")}
          </Text>
        </View>
        <Text style={styles.title}>
          {isEditing ? t("recurringForm.editTitle") : t("recurringForm.newTitle")}
        </Text>
        <Text style={styles.heroSubtitle}>{recurrenceTone.subtitle}</Text>

        <View style={styles.heroMetaRow}>
          <View style={styles.heroMetaChip}>
            <Ionicons name="time-outline" size={13} color={colors.textMuted} />
            <Text style={styles.heroMetaText}>
              {cadenceOptions.find((option) => option.key === cadence)?.label ||
                t("recurringForm.cadenceMonthly")}
            </Text>
          </View>
          <View style={styles.heroMetaChip}>
            <Ionicons
              name={isSubscription ? "calendar-outline" : "infinite-outline"}
              size={13}
              color={colors.textMuted}
            />
            <Text style={styles.heroMetaText}>
              {isSubscription
                ? formatCompactDate(nextDue, localeTag)
                : t("recurringForm.noDueForHabit")}
            </Text>
          </View>
          <View style={styles.heroMetaChip}>
            <Ionicons name="cash-outline" size={13} color={colors.textMuted} />
            <Text style={styles.heroMetaText}>{amountPreview}</Text>
          </View>
        </View>
      </View>

      <View style={styles.typeSwitchRow}>
        <Pressable
          onPress={selectHabit}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.typeSwitchBtn,
            type === RecurringType.HABIT && styles.typeSwitchBtnHabitActive,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Ionicons name="flash-outline" size={16} color={colors.textTitle} />
          <Text style={styles.typeSwitchText}>{t("recurring.typeHabit")}</Text>
        </Pressable>

        <Pressable
          onPress={selectSubscription}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.typeSwitchBtn,
            type === RecurringType.SUBSCRIPTION &&
              styles.typeSwitchBtnSubscriptionActive,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Ionicons name="repeat-outline" size={16} color={colors.textTitle} />
          <Text style={styles.typeSwitchText}>{t("recurring.typeSubscription")}</Text>
        </Pressable>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.label}>{t("recurringForm.titleLabel")}</Text>
        <View style={styles.field}>
          <Ionicons name="text-outline" size={18} color={colors.white75} />
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={t("recurringForm.titlePlaceholder")}
            placeholderTextColor={colors.white40}
          />
        </View>

        <Text style={[styles.label, styles.labelSpacing]}>
          {t("recurringForm.amountLabel")}
        </Text>
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
          <Text style={styles.suffix}>{t("common.currencyCode")}</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.label}>{t("recurringForm.categoryLabel")}</Text>
        <View style={styles.addCategoryRow}>
          <TextInput
            style={styles.addCategoryInput}
            value={newCategory}
            onChangeText={setNewCategory}
            placeholder={t("recurringForm.newCategoryPlaceholder")}
            placeholderTextColor={colors.white40}
            maxLength={24}
            returnKeyType="done"
            onSubmitEditing={addCustomCategory}
          />
          <Pressable
            onPress={addCustomCategory}
            accessibilityRole="button"
            style={({ pressed }) => [styles.addCategoryBtn, pressed && { opacity: 0.9 }]}
          >
            <Ionicons name="add" size={18} color={colors.textOnAccentStrong} />
          </Pressable>
        </View>

        <View style={styles.rowWrap}>
          {categoryItems.map((item) => {
            const active = item === category;
            return (
              <Pressable
                key={item}
                onPress={() => setCategory(item)}
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Text style={styles.chipText}>{item}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.label}>{t("recurringForm.frequencyLabel")}</Text>
        <View style={styles.rowWrap}>
          {cadenceOptions.map((option) => {
            const active = option.key === cadence;
            return (
              <Pressable
                key={option.key}
                onPress={() => setCadence(option.key)}
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Text style={styles.chipText}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {isSubscription ? (
          <View style={styles.dateWrap}>
            <CustomDatePicker
              label={t("recurringForm.nextDueLabel")}
              value={nextDue}
              onChange={setNextDue}
            />
          </View>
        ) : (
          <View style={styles.habitHint}>
            <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
            <Text style={styles.habitHintText}>{t("recurringForm.noDueHabitHint")}</Text>
          </View>
        )}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.label}>{t("expenseForm.icon")}</Text>
        <IconPicker
          value={icon}
          onChange={setIcon}
          title={t("recurringForm.selectIconTitle")}
        />

        <Text style={[styles.label, styles.labelSpacing]}>
          {t("recurringForm.notesLabel")}
        </Text>
        <View style={[styles.field, styles.notesField]}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={18}
            color={colors.white75}
            style={{ marginTop: 2 }}
          />
          <TextInput
            style={[styles.input, styles.notesInput]}
            multiline
            value={description}
            onChangeText={setDescription}
            placeholder={t("recurringForm.notesPlaceholder")}
            placeholderTextColor={colors.white40}
          />
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={onCancel}
          accessibilityRole="button"
          style={({ pressed }) => [styles.btnGhost, pressed && styles.pressed]}
        >
          <Text style={styles.btnGhostText}>{t("common.cancel")}</Text>
        </Pressable>

        <Pressable
          onPress={submit}
          accessibilityRole="button"
          style={({ pressed }) => [styles.btnPrimary, pressed && styles.pressed]}
        >
          <Ionicons name="save-outline" size={18} color={colors.textOnAccentStrong} />
          <Text style={styles.btnPrimaryText}>{t("common.save")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.primary700,
      borderRadius: 20,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.white10,
      gap: 10,
    },
    hero: {
      borderRadius: 18,
      borderWidth: 1,
      padding: 12,
      gap: 6,
    },
    heroBadge: {
      alignSelf: "flex-start",
      borderRadius: 999,
      borderWidth: 1,
      paddingVertical: 5,
      paddingHorizontal: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    heroBadgeText: {
      fontWeight: "900",
      fontSize: 11,
      letterSpacing: 0.25,
    },
    title: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 17,
    },
    heroSubtitle: {
      color: colors.textMuted,
      fontWeight: "800",
      fontSize: 12,
    },
    heroMetaRow: {
      marginTop: 4,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    heroMetaChip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.white12,
      backgroundColor: colors.white06,
      paddingVertical: 5,
      paddingHorizontal: 9,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    heroMetaText: {
      color: colors.textBody,
      fontWeight: "800",
      fontSize: 11,
    },

    typeSwitchRow: {
      flexDirection: "row",
      gap: 8,
    },
    typeSwitchBtn: {
      flex: 1,
      minHeight: 46,
      borderRadius: 14,
      backgroundColor: colors.white06,
      borderWidth: 1,
      borderColor: colors.white10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    typeSwitchBtnHabitActive: {
      backgroundColor: colors.accent18,
      borderColor: colors.accent35,
    },
    typeSwitchBtnSubscriptionActive: {
      backgroundColor: colors.white12,
      borderColor: colors.white20,
    },
    typeSwitchText: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 12,
    },

    sectionCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      padding: 10,
    },
    label: {
      color: colors.textMuted,
      fontWeight: "900",
      fontSize: 11,
      marginBottom: 7,
      letterSpacing: 0.2,
      textTransform: "uppercase",
    },
    labelSpacing: {
      marginTop: 10,
    },

    field: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 11,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: colors.primary800,
      borderWidth: 1.5,
      borderColor: colors.white22,
    },
    input: {
      flex: 1,
      fontSize: 16,
      fontWeight: "900",
      color: colors.textTitle,
    },
    suffix: {
      color: colors.textBody,
      fontWeight: "900",
      fontSize: 12,
    },
    notesField: { alignItems: "flex-start" },
    notesInput: { minHeight: 72, textAlignVertical: "top" },

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

    rowWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 10,
      columnGap: 10,
    },
    chip: {
      width: "48%",
      minHeight: 44,
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRadius: 14,
      backgroundColor: colors.white06,
      borderWidth: 1,
      borderColor: colors.white10,
      alignItems: "center",
      justifyContent: "center",
    },
    chipActive: {
      backgroundColor: colors.accent18,
      borderColor: colors.accent35,
    },
    chipText: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 12,
      textAlign: "center",
    },
    dateWrap: { marginTop: 10 },
    habitHint: {
      marginTop: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.white12,
      backgroundColor: colors.white06,
      paddingVertical: 9,
      paddingHorizontal: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    habitHintText: {
      flex: 1,
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: "700",
    },

    actionsRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 2,
    },
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
    btnGhostText: {
      color: colors.textTitle,
      fontWeight: "900",
    },
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
    btnPrimaryText: {
      color: colors.textOnAccentStrong,
      fontWeight: "900",
    },
    pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  });
}
