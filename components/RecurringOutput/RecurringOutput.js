import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { GlobalStyles } from "../../constants/styles";
import { useTranslation } from "../../store/language-context";
import RecurringTimeline from "./RecurringTimeline";

function ActionCard({ title, subtitle, icon, onPress, styles, colors }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={17} color={colors.textTitle} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.actionTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.actionSub} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
    </Pressable>
  );
}

export default function RecurringOutputHeader({
  items,
  onCreateHabit,
  onCreateSubscription,
  onAddAllDue,
  dueCount,
  showPaidSubscriptions = false,
  onToggleShowPaid,
  hiddenPaidCount = 0,
}) {
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);
  const { t } = useTranslation();
  const totalItems = Array.isArray(items) ? items.length : 0;
  const subscriptions = (items || []).filter((x) => x?.type === "SUBSCRIPTION").length;
  const habits = Math.max(0, totalItems - subscriptions);

  const hiddenPaidText =
    hiddenPaidCount === 1
      ? t("recurring.hiddenPaidOne")
      : t("recurring.hiddenPaidMany", { count: hiddenPaidCount });

  return (
    <View style={styles.wrap}>
      <View style={styles.heroCard}>
        <View style={[styles.heroBubble, styles.heroBubbleTop]} />
        <View style={[styles.heroBubble, styles.heroBubbleBottom]} />
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Ionicons name="repeat-outline" size={18} color={colors.textTitle} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{t("recurring.heroTitle")}</Text>
            <Text style={styles.heroSub}>
              {dueCount > 0
                ? t("recurring.heroDueCount", { count: dueCount })
                : t("recurring.heroNoUrgent")}
            </Text>
          </View>
        </View>

        <View style={styles.heroStats}>
          <View style={styles.heroStatChip}>
            <Ionicons name="repeat-outline" size={13} color={colors.textTitle} />
            <Text style={styles.heroStatText}>
              {t("recurring.subscriptionsCount", { count: subscriptions })}
            </Text>
          </View>
          <View style={styles.heroStatChip}>
            <Ionicons name="flash-outline" size={13} color={colors.textTitle} />
            <Text style={styles.heroStatText}>
              {t("recurring.habitsCount", { count: habits })}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <ActionCard
          title={t("recurring.newHabitTitle")}
          subtitle={t("recurring.newHabitSubtitle")}
          icon="flash-outline"
          onPress={onCreateHabit}
          styles={styles}
          colors={colors}
        />
        <ActionCard
          title={t("recurring.newSubscriptionTitle")}
          subtitle={t("recurring.newSubscriptionSubtitle")}
          icon="repeat-outline"
          onPress={onCreateSubscription}
          styles={styles}
          colors={colors}
        />
      </View>

      {!!dueCount ? (
        <Pressable
          onPress={onAddAllDue}
          style={({ pressed }) => [styles.addAllBtn, pressed && { opacity: 0.9 }]}
        >
          <Ionicons name="checkmark-done-outline" size={18} color={colors.textOnAccentStrong} />
          <Text style={styles.addAllText}>{t("recurring.addAll", { count: dueCount })}</Text>
        </Pressable>
      ) : null}

      <RecurringTimeline items={items} />

      <View style={styles.sectionHead}>
        <View style={styles.sectionIcon}>
          <Ionicons name="list-outline" size={16} color={colors.textTitle} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{t("recurring.sectionTitle")}</Text>
          <Text style={styles.sectionSub}>{t("recurring.sectionSub")}</Text>
        </View>
        <Pressable
          onPress={onToggleShowPaid}
          style={({ pressed }) => [
            styles.togglePaidBtn,
            showPaidSubscriptions && styles.togglePaidBtnActive,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Ionicons
            name={showPaidSubscriptions ? "eye-outline" : "eye-off-outline"}
            size={16}
            color={colors.textTitle}
          />
          <Text style={styles.togglePaidText} numberOfLines={1}>
            {showPaidSubscriptions ? t("recurring.showAll") : t("recurring.hidePaid")}
          </Text>
        </Pressable>
      </View>

      {!showPaidSubscriptions && hiddenPaidCount > 0 ? (
        <View style={styles.hiddenHint}>
          <Ionicons name="checkmark-circle-outline" size={16} color={colors.textMuted} />
          <Text style={styles.hiddenHintText}>{hiddenPaidText}</Text>
        </View>
      ) : null}

      {!items?.length ? (
        <View style={styles.empty}>
          <Ionicons name="sparkles-outline" size={18} color={colors.textMuted} />
          <Text style={styles.emptyText}>{t("recurring.empty")}</Text>
        </View>
      ) : null}
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    wrap: { gap: 12 },
    heroCard: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      padding: 12,
      overflow: "hidden",
      gap: 10,
      position: "relative",
    },
    heroBubble: {
      position: "absolute",
      borderRadius: 999,
      backgroundColor: colors.accent16,
      borderWidth: 1,
      borderColor: colors.accent30,
    },
    heroBubbleTop: { width: 112, height: 112, right: -30, top: -30 },
    heroBubbleBottom: { width: 68, height: 68, right: 32, bottom: -28 },
    heroTop: { flexDirection: "row", alignItems: "center", gap: 10 },
    heroIcon: {
      width: 38,
      height: 38,
      borderRadius: 14,
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.white10,
      alignItems: "center",
      justifyContent: "center",
    },
    heroTitle: { color: colors.textTitle, fontWeight: "900", fontSize: 15 },
    heroSub: { marginTop: 2, color: colors.textMuted, fontWeight: "800", fontSize: 12 },
    heroStats: { flexDirection: "row", gap: 8 },
    heroStatChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    heroStatText: { color: colors.textBody, fontWeight: "800", fontSize: 11 },

    actionsRow: { gap: 9 },
    actionCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      paddingVertical: 10,
      paddingHorizontal: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      minHeight: 58,
    },
    actionIcon: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: colors.accent18,
      borderWidth: 1,
      borderColor: colors.accent35,
      alignItems: "center",
      justifyContent: "center",
    },
    actionTitle: { color: colors.textTitle, fontWeight: "900", fontSize: 13 },
    actionSub: { marginTop: 2, color: colors.textMuted, fontWeight: "700", fontSize: 11 },

    addAllBtn: {
      height: 48,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      backgroundColor: colors.accent500,
      borderWidth: 1,
      borderColor: colors.accent30,
    },
    addAllText: { color: colors.textOnAccentStrong, fontWeight: "900", fontSize: 13 },

    sectionHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 2,
      marginBottom: 8,
    },
    sectionIcon: {
      width: 34,
      height: 34,
      borderRadius: 14,
      backgroundColor: colors.white08,
      borderWidth: 1,
      borderColor: colors.white10,
      alignItems: "center",
      justifyContent: "center",
    },
    sectionTitle: { color: colors.textTitle, fontWeight: "900", fontSize: 13 },
    sectionSub: {
      marginTop: 2,
      color: colors.textMuted,
      fontWeight: "700",
      fontSize: 12,
    },
    togglePaidBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      maxWidth: 160,
    },
    togglePaidBtnActive: {
      borderColor: colors.accent35,
      backgroundColor: colors.accent18,
    },
    togglePaidText: { color: colors.textTitle, fontWeight: "900", fontSize: 11, flexShrink: 1 },
    hiddenHint: {
      padding: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    hiddenHintText: { color: colors.textMuted, fontWeight: "800", fontSize: 12, flex: 1 },
    empty: {
      padding: 14,
      borderRadius: 18,
      backgroundColor: colors.white06,
      borderWidth: 1,
      borderColor: colors.white10,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    emptyText: { color: colors.textBody, fontWeight: "800", flex: 1 },
  });
}
