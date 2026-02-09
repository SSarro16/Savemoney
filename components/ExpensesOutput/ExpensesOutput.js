import React, { useMemo, useState, useContext } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
  Platform,
  ScrollView,
  TextInput,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import ExpensesSummary from "./ExpensesSummary";
import ExpensesList from "./ExpensesList";
import { GlobalStyles } from "../../constants/styles";
import { ExpensesContext } from "../../store/expenses-context";
import { CustomizationContext } from "../../store/customization-context";
import UndoSnackbar from "../ui/UndoSnackbar";
import QuickAddLauncherCard from "../ManageExpense/QuickAddLauncherCard";
import { useTranslation } from "../../store/language-context";

function formatDate(d, localeTag) {
  if (!d) return "";
  return d
    .toLocaleDateString(localeTag || "it-IT", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    .replace(/,/g, "");
}

function Chip({ active, label, onPress }) {
  const colors = GlobalStyles.colors;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: colors.surface2, borderColor: colors.border },
        active && {
          backgroundColor: colors.accent18,
          borderColor: colors.accent35,
        },
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? colors.textTitle : colors.textBody },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ExpensesOutput({
  expenses,
  expensesPeriod,
  welcomeText,
  fallbackText,
  rangeFrom,
  rangeTo,
  onChangeRange,
  onResetRange,
  onSelectPreset,
  activePreset,
  presets,
  searchQuery,
  onChangeSearchQuery,
  selectedCategory,
  onSelectCategory,
  categoryOptions,
  selectedMethod,
  onSelectMethod,
  isAdvancedFilterActive,
  onResetAdvancedFilters,
}) {
  const colors = GlobalStyles.colors;
  const { compactMode, highContrast } = useContext(CustomizationContext);
  const expensesCtx = useContext(ExpensesContext);
  const tabBarHeight = useBottomTabBarHeight();
  const { t, localeTag } = useTranslation();

  const [modalOpen, setModalOpen] = useState(false);
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(rangeFrom ?? new Date());
  const [draftTo, setDraftTo] = useState(rangeTo ?? new Date());
  const pickerThemeVariant = colors.textTitle === "#ffffff" ? "dark" : "light";

  const openModal = () => {
    setDraftFrom(rangeFrom ?? new Date());
    setDraftTo(rangeTo ?? new Date());
    setModalOpen(true);
  };

  const applyRange = () => {
    let from = draftFrom;
    let to = draftTo;
    if (from && to && from > to) [from, to] = [to, from];
    onChangeRange?.(from, to);
    setModalOpen(false);
  };

  const openFilters = () => {
    setFiltersModalOpen(true);
  };

  const rangeLabel = useMemo(() => {
    if (rangeFrom && rangeTo)
      return `${formatDate(rangeFrom, localeTag)} - ${formatDate(rangeTo, localeTag)}`;
    if (rangeFrom && !rangeTo) {
      return t("expenses.fromDate", { date: formatDate(rangeFrom, localeTag) });
    }
    if (!rangeFrom && rangeTo) {
      return t("expenses.toDate", { date: formatDate(rangeTo, localeTag) });
    }
    return t("common.today");
  }, [rangeFrom, rangeTo, localeTag, t]);

  const content =
    expenses.length > 0 ? (
      <ExpensesList expenses={expenses} />
    ) : (
      <View
        style={[
          styles.emptyWrap,
          {
            backgroundColor: colors.surface,
            borderColor: highContrast ? colors.borderStrong : colors.border,
            padding: compactMode ? 14 : 18,
          },
        ]}
      >
        <Ionicons name="receipt-outline" size={26} color={colors.textMuted} />
        <Text style={[styles.infoText, { color: colors.textBody }]}>
          {fallbackText}
        </Text>
      </View>
    );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
          paddingHorizontal: compactMode ? 12 : 16,
        },
      ]}
    >
      <View
        style={[
          styles.toolbarCard,
          {
            backgroundColor: colors.surface,
            borderColor: highContrast ? colors.borderStrong : colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.toolbarBlob,
            styles.toolbarBlobTop,
            { backgroundColor: colors.accent12, borderColor: colors.accent18 },
          ]}
        />
        <View
          style={[
            styles.toolbarBlob,
            styles.toolbarBlobBottom,
            { backgroundColor: colors.accent12, borderColor: colors.accent18 },
          ]}
        />

        <View style={styles.toolbarTop}>
          <View
            style={[
              styles.toolbarBadge,
              {
                backgroundColor: colors.accent18,
                borderColor: colors.accent35,
              },
            ]}
          >
            <Ionicons name="sparkles-outline" size={16} color={colors.textTitle} />
          </View>
          <View style={{ flex: 1 }}>
            {!!welcomeText && (
              <Text style={[styles.welcomeText, { color: colors.textTitle }]}>
                {welcomeText}
              </Text>
            )}
            <Text style={[styles.toolbarHint, { color: colors.textMuted }]}>
              {t("expensesOutput.filterAnalyzeHint")}
            </Text>
          </View>
        </View>

        <View style={styles.toolbarActions}>
          <Pressable
            style={({ pressed }) => [
              styles.toolbarBtn,
              {
                backgroundColor: colors.surface2,
                borderColor: highContrast ? colors.borderStrong : colors.border,
                paddingVertical: compactMode ? 10 : 12,
              },
              pressed && styles.pressed,
            ]}
            onPress={openModal}
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color={colors.textTitle}
            />
            <Text style={[styles.toolbarBtnText, { color: colors.textTitle }]}>
              {t("expensesOutput.period")}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.toolbarBtn,
              {
                backgroundColor: isAdvancedFilterActive
                  ? colors.accent18
                  : colors.surface2,
                borderColor: isAdvancedFilterActive
                  ? colors.accent35
                  : highContrast
                    ? colors.borderStrong
                    : colors.border,
                paddingVertical: compactMode ? 10 : 12,
              },
              pressed && styles.pressed,
            ]}
            onPress={openFilters}
          >
            <Ionicons name="options-outline" size={18} color={colors.textTitle} />
            <Text style={[styles.toolbarBtnText, { color: colors.textTitle }]}>
              {t("expensesOutput.filters")}
            </Text>
            {isAdvancedFilterActive ? (
              <View style={[styles.filterDot, { backgroundColor: colors.accent500 }]} />
            ) : null}
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: colors.surface2,
                borderColor: highContrast ? colors.borderStrong : colors.border,
              },
              pressed && styles.pressed,
            ]}
            onPress={onResetRange}
          >
            <Ionicons
              name="refresh-outline"
              size={18}
              color={colors.textTitle}
            />
          </Pressable>
        </View>
      </View>

      <ExpensesSummary
        expenses={expenses}
        periodName={expensesPeriod ?? rangeLabel}
      />

      <QuickAddLauncherCard />

      {content}

      <UndoSnackbar
        visible={expensesCtx.canUndo}
        message={t("expenses.expenseDeleted")}
        onUndo={expensesCtx.undoDelete}
        bottomOffset={tabBarHeight + 6}
      />

      <Modal visible={modalOpen} transparent animationType="fade">
        <View
          style={[styles.modalBackdrop, { backgroundColor: colors.overlay60 }]}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.bg,
                borderColor: highContrast ? colors.borderStrong : colors.border,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textTitle }]}>
                {t("expensesOutput.selectPeriod")}
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.closeBtn,
                  {
                    backgroundColor: colors.surface2,
                    borderColor: colors.border,
                  },
                  pressed && styles.pressed,
                ]}
                onPress={() => setModalOpen(false)}
              >
                <Ionicons name="close" size={18} color={colors.textTitle} />
              </Pressable>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              {t("expensesOutput.quickPresets")}
            </Text>
            <View style={styles.chipsGrid}>
              <View style={styles.chipGridItem}>
                <Chip
                  label={t("common.today")}
                  active={activePreset === presets?.TODAY}
                  onPress={() => {
                    onSelectPreset?.(presets?.TODAY);
                    setModalOpen(false);
                  }}
                />
              </View>
              <View style={styles.chipGridItem}>
                <Chip
                  label={t("common.yesterday")}
                  active={activePreset === presets?.YESTERDAY}
                  onPress={() => {
                    onSelectPreset?.(presets?.YESTERDAY);
                    setModalOpen(false);
                  }}
                />
              </View>
              <View style={styles.chipGridItem}>
                <Chip
                  label={t("expensesOutput.days7")}
                  active={activePreset === presets?.DAYS_7}
                  onPress={() => {
                    onSelectPreset?.(presets?.DAYS_7);
                    setModalOpen(false);
                  }}
                />
              </View>
              <View style={styles.chipGridItem}>
                <Chip
                  label={t("expensesOutput.month1")}
                  active={activePreset === presets?.MONTH_1}
                  onPress={() => {
                    onSelectPreset?.(presets?.MONTH_1);
                    setModalOpen(false);
                  }}
                />
              </View>
              <View style={styles.chipGridItem}>
                <Chip
                  label={t("expensesOutput.year1")}
                  active={activePreset === presets?.YEAR_1}
                  onPress={() => {
                    onSelectPreset?.(presets?.YEAR_1);
                    setModalOpen(false);
                  }}
                />
              </View>
              <View style={styles.chipGridItem}>
                <Chip
                  label={t("expensesOutput.total")}
                  active={activePreset === presets?.TOTAL}
                  onPress={() => {
                    onSelectPreset?.(presets?.TOTAL);
                    setModalOpen(false);
                  }}
                />
              </View>
            </View>

            <View
              style={[
                styles.divider,
                {
                  backgroundColor: highContrast
                    ? colors.borderStrong
                    : colors.border,
                },
              ]}
            />

            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              {t("expensesOutput.customRange")}
            </Text>

            <View
              style={[
                styles.pickerCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: highContrast
                    ? colors.borderStrong
                    : colors.border,
                },
              ]}
            >
              <View style={styles.pickerRow}>
                <Text style={[styles.modalLabel, { color: colors.textBody }]}>
                  {t("expensesOutput.from")}
                </Text>
                <DateTimePicker
                  value={draftFrom ?? new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  {...(Platform.OS === "ios"
                    ? { textColor: colors.textTitle, themeVariant: pickerThemeVariant }
                    : {})}
                  onChange={(e, d) => d && setDraftFrom(d)}
                />
              </View>

              <View style={styles.pickerRow}>
                <Text style={[styles.modalLabel, { color: colors.textBody }]}>
                  {t("expensesOutput.to")}
                </Text>
                <DateTimePicker
                  value={draftTo ?? new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  {...(Platform.OS === "ios"
                    ? { textColor: colors.textTitle, themeVariant: pickerThemeVariant }
                    : {})}
                  onChange={(e, d) => d && setDraftTo(d)}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.actionBtn,
                  {
                    backgroundColor: colors.surface2,
                    borderColor: highContrast
                      ? colors.borderStrong
                      : colors.border,
                  },
                  pressed && styles.pressed,
                ]}
                onPress={() => setModalOpen(false)}
              >
                <Text style={[styles.actionText, { color: colors.textTitle }]}>
                  {t("common.cancel")}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.actionBtn,
                  {
                    backgroundColor: colors.accent18,
                    borderColor: colors.accent35,
                  },
                  pressed && styles.pressed,
                ]}
                onPress={applyRange}
              >
                <Text
                  style={[styles.actionText, { color: colors.textOnAccent }]}
                >
                  {t("expensesOutput.apply")}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={filtersModalOpen} transparent animationType="slide">
        <View
          style={[styles.modalBackdropBottom, { backgroundColor: colors.overlay60 }]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setFiltersModalOpen(false)}
          />

          <View
            style={[
              styles.filtersSheet,
              {
                backgroundColor: colors.bg,
                borderColor: highContrast ? colors.borderStrong : colors.border,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textTitle }]}>
                {t("expensesOutput.searchFiltersTitle")}
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.closeBtn,
                  {
                    backgroundColor: colors.surface2,
                    borderColor: colors.border,
                  },
                  pressed && styles.pressed,
                ]}
                onPress={() => setFiltersModalOpen(false)}
              >
                <Ionicons name="close" size={18} color={colors.textTitle} />
              </Pressable>
            </View>

            <View style={styles.filtersTopRow}>
              <Text style={[styles.filtersTitle, { color: colors.textMuted }]}>
                {t("expensesOutput.customizeResults")}
              </Text>
              {isAdvancedFilterActive ? (
                <Pressable
                  onPress={onResetAdvancedFilters}
                  style={({ pressed }) => [
                    styles.clearFiltersBtn,
                    { borderColor: colors.border, backgroundColor: colors.surface2 },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.clearFiltersText, { color: colors.textBody }]}>
                    {t("expensesOutput.reset")}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            <TextInput
              value={searchQuery}
              onChangeText={onChangeSearchQuery}
              placeholder={t("expensesOutput.searchPlaceholder")}
              placeholderTextColor={colors.textFaint}
              style={[
                styles.searchInput,
                {
                  borderColor: highContrast ? colors.borderStrong : colors.border,
                  backgroundColor: colors.surface2,
                  color: colors.textTitle,
                },
              ]}
            />

            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              {t("expensesOutput.paymentMethod")}
            </Text>
            <View style={styles.methodRow}>
              <Chip
                label={t("expensesOutput.allMethods")}
                active={selectedMethod === "ALL"}
                onPress={() => onSelectMethod?.("ALL")}
              />
              <Chip
                label={t("expensesOutput.cash")}
                active={selectedMethod === "CASH"}
                onPress={() => onSelectMethod?.("CASH")}
              />
              <Chip
                label={t("expensesOutput.card")}
                active={selectedMethod === "CARD"}
                onPress={() => onSelectMethod?.("CARD")}
              />
            </View>

            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              {t("expensesOutput.category")}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesRow}
            >
              <Chip
                label={t("expensesOutput.allCategories")}
                active={selectedCategory === "ALL"}
                onPress={() => onSelectCategory?.("ALL")}
              />
              {(categoryOptions || []).map((category) => (
                <Chip
                  key={category}
                  label={category}
                  active={selectedCategory === category}
                  onPress={() => onSelectCategory?.(category)}
                />
              ))}
            </ScrollView>

            <Pressable
              style={({ pressed }) => [
                styles.applyFiltersBtn,
                {
                  backgroundColor: colors.accent18,
                  borderColor: colors.accent35,
                },
                pressed && styles.pressed,
              ]}
              onPress={() => setFiltersModalOpen(false)}
            >
              <Text style={[styles.actionText, { color: colors.textOnAccent }]}>
                {t("expensesOutput.closeFilters")}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default ExpensesOutput;

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 16 },

  toolbarCard: {
    gap: 10,
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    padding: 12,
    position: "relative",
  },
  toolbarBlob: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
  },
  toolbarBlobTop: {
    width: 98,
    height: 98,
    right: -26,
    top: -24,
  },
  toolbarBlobBottom: {
    width: 60,
    height: 60,
    right: 24,
    bottom: -22,
  },
  toolbarTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toolbarBadge: {
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeText: {
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 0.2,
  },
  toolbarHint: {
    marginTop: 2,
    fontWeight: "700",
    fontSize: 12,
  },
  toolbarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toolbarBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  toolbarBtnText: { fontWeight: "800", letterSpacing: 0.2 },
  iconBtn: { padding: 12, borderRadius: 14, borderWidth: 1 },
  filterDot: { width: 7, height: 7, borderRadius: 99 },

  filtersTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  filtersTitle: {
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  clearFiltersBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  clearFiltersText: {
    fontWeight: "900",
    fontSize: 11,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 9,
    fontWeight: "700",
  },
  methodRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoriesRow: {
    gap: 8,
    paddingRight: 12,
  },

  emptyWrap: {
    marginTop: 20,
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },

  pressed: { opacity: 0.85 },

  modalBackdrop: { flex: 1, justifyContent: "center", padding: 18 },
  modalBackdropBottom: { flex: 1, justifyContent: "flex-end", padding: 0 },
  modalCard: { borderRadius: 18, padding: 16, borderWidth: 1 },
  filtersSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: "900" },
  closeBtn: { padding: 10, borderRadius: 12, borderWidth: 1 },

  sectionTitle: {
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.3,
    marginBottom: 8,
    marginTop: 6,
    textTransform: "uppercase",
  },

  chipsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
  },
  chipGridItem: { width: "32%" },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  chipText: { fontWeight: "800", fontSize: 12 },

  divider: { height: 1, marginVertical: 12 },

  pickerCard: { borderRadius: 14, padding: 12, borderWidth: 1 },
  pickerRow: { marginBottom: 8 },
  modalLabel: { marginBottom: 6, fontWeight: "800" },

  modalActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  actionText: { fontWeight: "900", letterSpacing: 0.2 },
  applyFiltersBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
  },
});
