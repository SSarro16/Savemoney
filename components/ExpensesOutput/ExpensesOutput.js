import React, { useMemo, useState, useContext } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
  Platform,
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
}) {
  const colors = GlobalStyles.colors;
  const { compactMode, highContrast } = useContext(CustomizationContext);
  const expensesCtx = useContext(ExpensesContext);
  const tabBarHeight = useBottomTabBarHeight();

  const [modalOpen, setModalOpen] = useState(false);
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

  const rangeLabel = useMemo(() => {
    if (rangeFrom && rangeTo)
      return `${formatDate(rangeFrom)} - ${formatDate(rangeTo)}`;
    if (rangeFrom && !rangeTo) return `Da ${formatDate(rangeFrom)}`;
    if (!rangeFrom && rangeTo) return `Fino a ${formatDate(rangeTo)}`;
    return "Oggi";
  }, [rangeFrom, rangeTo]);

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
              Filtra e analizza rapidamente il periodo.
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
              Periodo
            </Text>
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
        message="Spesa eliminata"
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
                Seleziona periodo
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
              Preset rapidi
            </Text>
            <View style={styles.chipsGrid}>
              <View style={styles.chipGridItem}>
                <Chip
                  label="Oggi"
                  active={activePreset === presets?.TODAY}
                  onPress={() => {
                    onSelectPreset?.(presets?.TODAY);
                    setModalOpen(false);
                  }}
                />
              </View>
              <View style={styles.chipGridItem}>
                <Chip
                  label="Ieri"
                  active={activePreset === presets?.YESTERDAY}
                  onPress={() => {
                    onSelectPreset?.(presets?.YESTERDAY);
                    setModalOpen(false);
                  }}
                />
              </View>
              <View style={styles.chipGridItem}>
                <Chip
                  label="7 Giorni"
                  active={activePreset === presets?.DAYS_7}
                  onPress={() => {
                    onSelectPreset?.(presets?.DAYS_7);
                    setModalOpen(false);
                  }}
                />
              </View>
              <View style={styles.chipGridItem}>
                <Chip
                  label="1 Mese"
                  active={activePreset === presets?.MONTH_1}
                  onPress={() => {
                    onSelectPreset?.(presets?.MONTH_1);
                    setModalOpen(false);
                  }}
                />
              </View>
              <View style={styles.chipGridItem}>
                <Chip
                  label="1 Anno"
                  active={activePreset === presets?.YEAR_1}
                  onPress={() => {
                    onSelectPreset?.(presets?.YEAR_1);
                    setModalOpen(false);
                  }}
                />
              </View>
              <View style={styles.chipGridItem}>
                <Chip
                  label="Totale"
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
              Intervallo personalizzato
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
                  Da
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
                  A
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
                  Annulla
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
                  Applica
                </Text>
              </Pressable>
            </View>
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
  modalCard: { borderRadius: 18, padding: 16, borderWidth: 1 },
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
});
