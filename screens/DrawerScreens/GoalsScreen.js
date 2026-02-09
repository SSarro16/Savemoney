import React, { useContext, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { GlobalStyles } from "../../constants/styles";
import { GoalsContext } from "../../store/goals-context";
import { CustomizationContext } from "../../store/customization-context";
import LoadingOverlay from "../../components/ui/LoadingOverlay";
import { useTranslation } from "../../store/language-context";

function formatMoney(value, currencyCode) {
  return `${Number(value || 0).toFixed(2)} ${currencyCode}`;
}

function toPercent(goal) {
  const target = Number(goal?.targetAmount || 0);
  const current = Number(goal?.currentAmount || 0);
  if (target <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((current / target) * 100)));
}

function StatTile({ icon, label, value, styles, colors }) {
  return (
    <View style={styles.statTile}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={14} color={colors.textTitle} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export default function GoalsScreen() {
  const goalsCtx = useContext(GoalsContext);
  const { compactMode } = useContext(CustomizationContext);
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors, compactMode);
  const { t } = useTranslation();
  const currencyCode = t("common.currencyCode");

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    id: "",
    title: "",
    targetAmount: "",
    currentAmount: "",
    notes: "",
  });

  const completion = useMemo(() => {
    if (goalsCtx.totalTarget <= 0) return 0;
    return Math.min(100, Math.round((goalsCtx.totalSaved / goalsCtx.totalTarget) * 100));
  }, [goalsCtx.totalSaved, goalsCtx.totalTarget]);

  const averageProgress = useMemo(() => {
    if (!goalsCtx.goals?.length) return 0;
    const total = (goalsCtx.goals || []).reduce((sum, goal) => sum + toPercent(goal), 0);
    return Math.round(total / goalsCtx.goals.length);
  }, [goalsCtx.goals]);

  const remaining = Math.max(0, Number(goalsCtx.totalTarget || 0) - Number(goalsCtx.totalSaved || 0));

  const openCreate = () => {
    setDraft({
      id: "",
      title: "",
      targetAmount: "",
      currentAmount: "",
      notes: "",
    });
    setModalOpen(true);
  };

  const openEdit = (goal) => {
    setDraft({
      id: String(goal?.id || ""),
      title: String(goal?.title || ""),
      targetAmount: String(Number(goal?.targetAmount || 0)),
      currentAmount: String(Number(goal?.currentAmount || 0)),
      notes: String(goal?.notes || ""),
    });
    setModalOpen(true);
  };

  const submitGoal = async () => {
    const title = String(draft.title || "").trim();
    const targetAmount = Number(draft.targetAmount || 0);
    const currentAmount = Number(draft.currentAmount || 0);
    const notes = String(draft.notes || "").trim();

    if (!title) {
      Alert.alert(t("goals.missingTitle"), t("goals.missingTitleMessage"));
      return;
    }
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      Alert.alert(t("goals.invalidTarget"), t("goals.invalidTargetMessage"));
      return;
    }

    setSaving(true);
    try {
      await goalsCtx.saveGoal({
        id: draft.id || undefined,
        title,
        targetAmount,
        currentAmount: Number.isFinite(currentAmount) ? Math.max(0, currentAmount) : 0,
        notes,
      });
      setModalOpen(false);
    } catch {
      Alert.alert(t("common.error"), t("goals.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const deleteGoal = (goal) => {
    Alert.alert(t("goals.deleteTitle"), goal?.title || t("goals.goalFallback"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await goalsCtx.deleteGoal(goal?.id);
          } catch {
            Alert.alert(t("common.error"), t("goals.deleteFailed"));
          }
        },
      },
    ]);
  };

  if (!goalsCtx.initialized && goalsCtx.loading) {
    return <LoadingOverlay message={t("goals.loading")} />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={[styles.heroBubble, styles.heroBubbleTop]} />
          <View style={[styles.heroBubble, styles.heroBubbleBottom]} />

          <View style={styles.heroTopRow}>
            <View style={styles.heroIcon}>
              <Ionicons name="rocket-outline" size={17} color={colors.textTitle} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>{t("goals.heroTitle")}</Text>
              <Text style={styles.heroSub}>
                {t("goals.savedOnTarget", {
                  saved: formatMoney(goalsCtx.totalSaved, currencyCode),
                  target: formatMoney(goalsCtx.totalTarget, currencyCode),
                })}
              </Text>
            </View>
            <Pressable
              onPress={openCreate}
              style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.88 }]}
            >
              <Ionicons name="add" size={16} color={colors.textOnAccentStrong} />
              <Text style={styles.addBtnText}>{t("goals.newAction")}</Text>
            </Pressable>
          </View>

          <View style={styles.mainProgressTrack}>
            <View
              style={[
                styles.mainProgressFill,
                {
                  width: `${Math.max(4, completion)}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.mainProgressText}>
            {t("goals.totalCompletion", { percent: completion })}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <StatTile
            icon="albums-outline"
            label={t("goals.goalsCount")}
            value={String((goalsCtx.goals || []).length)}
            styles={styles}
            colors={colors}
          />
          <StatTile
            icon="pulse-outline"
            label={t("goals.averageProgress")}
            value={`${averageProgress}%`}
            styles={styles}
            colors={colors}
          />
          <StatTile
            icon="hourglass-outline"
            label={t("goals.remainingToSave")}
            value={formatMoney(remaining, currencyCode)}
            styles={styles}
            colors={colors}
          />
        </View>

        {(goalsCtx.goals || []).length === 0 ? (
          <View style={styles.emptyStateCard}>
            <View style={styles.emptyStateIcon}>
              <Ionicons name="flag-outline" size={20} color={colors.textTitle} />
            </View>
            <Text style={styles.emptyStateTitle}>{t("goals.noGoalsTitle")}</Text>
            <Text style={styles.emptyStateSub}>
              {t("goals.noGoalsSub")}
            </Text>
            <Pressable
              onPress={openCreate}
              style={({ pressed }) => [styles.emptyStateCta, pressed && { opacity: 0.88 }]}
            >
              <Text style={styles.emptyStateCtaText}>{t("goals.createFirstGoal")}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.goalList}>
            {(goalsCtx.goals || []).map((goal) => {
              const pct = toPercent(goal);
              const remainingGoal = Math.max(
                0,
                Number(goal?.targetAmount || 0) - Number(goal?.currentAmount || 0),
              );

              return (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.goalTitle}>{goal.title}</Text>
                      <Text style={styles.goalAmounts}>
                        {formatMoney(goal.currentAmount, currencyCode)} / {formatMoney(goal.targetAmount, currencyCode)}
                      </Text>
                    </View>
                    <View style={styles.goalBadge}>
                      <Text style={styles.goalBadgeText}>{pct}%</Text>
                    </View>
                  </View>

                  <View style={styles.goalProgressTrack}>
                    <View
                      style={[
                        styles.goalProgressFill,
                        { width: `${Math.max(3, pct)}%` },
                      ]}
                    />
                  </View>

                  <View style={styles.goalMetaRow}>
                    <Text style={styles.goalMetaText}>
                      {t("goals.remainingAmount", { amount: formatMoney(remainingGoal, currencyCode) })}
                    </Text>
                    {!!goal.notes ? (
                      <Text style={styles.goalMetaText} numberOfLines={1}>
                        {goal.notes}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.quickRow}>
                    {[-10, 10, 50].map((value) => (
                      <Pressable
                        key={`${goal.id}-${value}`}
                        onPress={() => goalsCtx.addProgress(goal.id, value)}
                        style={({ pressed }) => [
                          styles.quickBtn,
                          pressed && { opacity: 0.9 },
                        ]}
                      >
                        <Text style={styles.quickBtnText}>
                          {value > 0 ? `+${value}` : value} {t("common.currencyCode")}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <View style={styles.goalActions}>
                    <Pressable
                      onPress={() => openEdit(goal)}
                      style={({ pressed }) => [styles.goalActionBtn, pressed && { opacity: 0.9 }]}
                    >
                      <Ionicons name="create-outline" size={14} color={colors.textTitle} />
                      <Text style={styles.goalActionText}>{t("common.edit")}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => deleteGoal(goal)}
                      style={({ pressed }) => [styles.goalActionBtn, pressed && { opacity: 0.9 }]}
                    >
                      <Ionicons name="trash-outline" size={14} color={colors.error500} />
                      <Text style={[styles.goalActionText, { color: colors.error500 }]}>
                        {t("common.delete")}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal transparent visible={modalOpen} animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {draft.id ? t("goals.editGoalTitle") : t("goals.newGoalTitle")}
            </Text>

            <TextInput
              value={draft.title}
              onChangeText={(value) => setDraft((prev) => ({ ...prev, title: value }))}
              style={styles.input}
              placeholder={t("goals.titlePlaceholder")}
              placeholderTextColor={colors.textFaint}
            />
            <TextInput
              value={draft.targetAmount}
              onChangeText={(value) => setDraft((prev) => ({ ...prev, targetAmount: value }))}
              keyboardType="decimal-pad"
              style={styles.input}
              placeholder={t("goals.targetPlaceholder")}
              placeholderTextColor={colors.textFaint}
            />
            <TextInput
              value={draft.currentAmount}
              onChangeText={(value) => setDraft((prev) => ({ ...prev, currentAmount: value }))}
              keyboardType="decimal-pad"
              style={styles.input}
              placeholder={t("goals.savedAmountPlaceholder")}
              placeholderTextColor={colors.textFaint}
            />
            <TextInput
              value={draft.notes}
              onChangeText={(value) => setDraft((prev) => ({ ...prev, notes: value }))}
              style={[styles.input, { minHeight: 64 }]}
              placeholder={t("goals.notesPlaceholder")}
              placeholderTextColor={colors.textFaint}
              multiline
            />

            <View style={styles.modalActions}>
              <Pressable onPress={() => setModalOpen(false)} style={styles.modalSecondaryBtn}>
                <Text style={styles.modalSecondaryText}>{t("common.cancel")}</Text>
              </Pressable>
              <Pressable onPress={submitGoal} style={styles.modalPrimaryBtn} disabled={saving}>
                <Text style={styles.modalPrimaryText}>
                  {saving ? t("profile.saving") : t("goals.saveGoal")}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(colors, compactMode) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    content: {
      paddingHorizontal: compactMode ? 12 : 16,
      paddingTop: compactMode ? 10 : 14,
      paddingBottom: 30,
      gap: 12,
    },
    heroCard: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      padding: 13,
      overflow: "hidden",
      position: "relative",
    },
    heroBubble: {
      position: "absolute",
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.accent18,
      backgroundColor: colors.accent12,
    },
    heroBubbleTop: { width: 120, height: 120, top: -34, right: -34 },
    heroBubbleBottom: { width: 68, height: 68, right: 46, bottom: -30 },
    heroTopRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    heroIcon: {
      width: 38,
      height: 38,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.accent35,
      backgroundColor: colors.accent18,
      alignItems: "center",
      justifyContent: "center",
    },
    heroTitle: { color: colors.textTitle, fontWeight: "900", fontSize: 18 },
    heroSub: { marginTop: 2, color: colors.textMuted, fontWeight: "700", fontSize: 12 },
    addBtn: {
      borderWidth: 1,
      borderColor: colors.accent30,
      backgroundColor: colors.accent500,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    addBtnText: { color: colors.textOnAccentStrong, fontWeight: "900", fontSize: 12 },
    mainProgressTrack: {
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.white10,
      borderRadius: 999,
      overflow: "hidden",
      height: 10,
      backgroundColor: colors.surface2,
    },
    mainProgressFill: {
      height: "100%",
      borderRadius: 999,
      backgroundColor: colors.accent500,
    },
    mainProgressText: { marginTop: 6, color: colors.textMuted, fontWeight: "800", fontSize: 12 },

    statsRow: { flexDirection: "row", gap: 9 },
    statTile: {
      flex: 1,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      paddingVertical: 10,
      paddingHorizontal: 9,
    },
    statIcon: {
      width: 28,
      height: 28,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    statLabel: { color: colors.textMuted, fontWeight: "800", fontSize: 11 },
    statValue: { marginTop: 2, color: colors.textTitle, fontWeight: "900", fontSize: 13 },

    emptyStateCard: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      alignItems: "center",
      paddingVertical: 18,
      paddingHorizontal: 14,
    },
    emptyStateIcon: {
      width: 44,
      height: 44,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    emptyStateTitle: { color: colors.textTitle, fontWeight: "900", fontSize: 15 },
    emptyStateSub: {
      marginTop: 4,
      color: colors.textMuted,
      fontWeight: "700",
      textAlign: "center",
      lineHeight: 18,
      fontSize: 12,
    },
    emptyStateCta: {
      marginTop: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.accent30,
      backgroundColor: colors.accent500,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    emptyStateCtaText: { color: colors.textOnAccentStrong, fontWeight: "900", fontSize: 12 },

    goalList: { gap: 10 },
    goalCard: {
      borderWidth: 1,
      borderColor: colors.white10,
      borderRadius: 18,
      backgroundColor: colors.surface,
      paddingVertical: 11,
      paddingHorizontal: 11,
    },
    goalHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
    goalTitle: { color: colors.textTitle, fontWeight: "900", fontSize: 15 },
    goalAmounts: { marginTop: 2, color: colors.textBody, fontWeight: "800", fontSize: 12 },
    goalBadge: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.accent35,
      backgroundColor: colors.accent18,
      minWidth: 50,
      paddingVertical: 5,
      paddingHorizontal: 10,
      alignItems: "center",
    },
    goalBadgeText: { color: colors.textTitle, fontWeight: "900", fontSize: 11 },
    goalProgressTrack: {
      marginTop: 10,
      borderWidth: 1,
      borderColor: colors.white10,
      borderRadius: 999,
      overflow: "hidden",
      height: 9,
      backgroundColor: colors.surface2,
    },
    goalProgressFill: {
      height: "100%",
      borderRadius: 999,
      backgroundColor: colors.accent500,
    },
    goalMetaRow: {
      marginTop: 6,
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
    },
    goalMetaText: { color: colors.textMuted, fontWeight: "700", fontSize: 11, flex: 1 },
    quickRow: { marginTop: 10, flexDirection: "row", gap: 8 },
    quickBtn: {
      borderWidth: 1,
      borderColor: colors.white12,
      backgroundColor: colors.surface2,
      borderRadius: 10,
      paddingVertical: 7,
      paddingHorizontal: 10,
    },
    quickBtnText: { color: colors.textTitle, fontWeight: "900", fontSize: 11 },
    goalActions: { marginTop: 10, flexDirection: "row", gap: 8 },
    goalActionBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      borderRadius: 10,
      paddingVertical: 8,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 5,
    },
    goalActionText: { color: colors.textTitle, fontWeight: "900", fontSize: 11 },

    modalBackdrop: {
      flex: 1,
      padding: 18,
      backgroundColor: colors.overlay72,
      justifyContent: "center",
    },
    modalCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      padding: 12,
    },
    modalTitle: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 15,
      marginBottom: 10,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.white10,
      borderRadius: 12,
      backgroundColor: colors.surface2,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontWeight: "700",
      color: colors.textTitle,
      marginBottom: 8,
    },
    modalActions: { marginTop: 4, flexDirection: "row", gap: 8 },
    modalSecondaryBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white08,
      borderRadius: 12,
      paddingVertical: 10,
      alignItems: "center",
    },
    modalSecondaryText: { color: colors.textTitle, fontWeight: "900", fontSize: 12 },
    modalPrimaryBtn: {
      flex: 1.2,
      borderWidth: 1,
      borderColor: colors.accent30,
      backgroundColor: colors.accent500,
      borderRadius: 12,
      paddingVertical: 10,
      alignItems: "center",
    },
    modalPrimaryText: { color: colors.textOnAccentStrong, fontWeight: "900", fontSize: 12 },
  });
}
