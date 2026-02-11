import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { GlobalStyles } from "../../constants/styles";
import { useTranslation } from "../../store/language-context";
import { RecurringType } from "../../util/recurring/recurring-utils";

function isEmoji(value) {
  return typeof value === "string" && !value.includes("-");
}

export default function RecurringItem({ item, isDue, onPress, onQuickAction }) {
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);
  const { t } = useTranslation();

  const icon = item?.icon || "repeat-outline";
  const title = String(item?.title || "");
  const amount = Number(item?.amount || 0);
  const isSub = item?.type === RecurringType.SUBSCRIPTION;
  const isPaidSubscription = isSub && !isDue;
  const typeLabel = isSub ? t("recurring.typeSubscription") : t("recurring.typeHabit");
  const typeIcon = isSub ? "repeat-outline" : "flash-outline";
  const quickLabel = isSub
    ? isPaidSubscription
      ? t("recurring.quickPaid")
      : t("recurring.quickPay")
    : t("recurring.quickAdd");
  const quickIcon =
    isSub && isPaidSubscription ? "checkmark-circle" : "add-circle-outline";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isSub ? styles.cardSubscription : styles.cardHabit,
        isDue && isSub && styles.cardDue,
        pressed && { opacity: 0.92, transform: [{ scale: 0.995 }] },
      ]}
    >
      <View
        style={[
          styles.typeRail,
          isSub ? styles.typeRailSubscription : styles.typeRailHabit,
          isDue && isSub && styles.typeRailDue,
        ]}
      />
      <View style={styles.left}>
        <View style={[styles.iconWrap, isDue && styles.iconWrapDue]}>
          {isEmoji(icon) ? (
            <Text style={styles.emoji}>{icon}</Text>
          ) : (
            <Ionicons name={icon} size={18} color={colors.textTitle} />
          )}
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.metaRow}>
            <View
              style={[
                styles.typeChip,
                isSub ? styles.typeChipSubscription : styles.typeChipHabit,
                isDue && isSub && styles.typeChipDue,
              ]}
            >
              <Ionicons name={typeIcon} size={12} color={colors.textTitle} />
              <Text style={styles.typeChipText}>{typeLabel}</Text>
            </View>
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {amount.toFixed(2)} {t("common.currencyCode")}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={(e) => {
          e.stopPropagation?.();
          if (isPaidSubscription) return;
          onQuickAction?.();
        }}
        disabled={isPaidSubscription}
        accessibilityRole="button"
        accessibilityLabel={
          isSub
            ? `${t("accessibility.quickPay")} ${title}`
            : `${t("accessibility.quickAdd")} ${title}`
        }
        style={({ pressed }) => [
          styles.quickBtn,
          !isSub && styles.quickBtnHabit,
          isSub && !isDue && !isPaidSubscription && styles.quickBtnSubscription,
          pressed && { opacity: 0.9 },
          isSub && isDue && styles.quickBtnDue,
          isPaidSubscription && styles.quickBtnDisabled,
        ]}
      >
        <Ionicons
          name={quickIcon}
          size={18}
          color={
            isDue
              ? colors.textOnAccentStrong
              : isPaidSubscription
                ? colors.textMuted
                : colors.textTitle
          }
        />
        <Text
          style={[
            styles.quickText,
            {
              color: isDue
                ? colors.textOnAccentStrong
                : isPaidSubscription
                  ? colors.textMuted
                  : colors.textTitle,
            },
          ]}
        >
          {quickLabel}
        </Text>
      </Pressable>
    </Pressable>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    card: {
      position: "relative",
      padding: 12,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 10,
    },
    cardHabit: { borderColor: colors.accent30, backgroundColor: colors.accent12 },
    cardSubscription: { borderColor: colors.white12, backgroundColor: colors.white06 },
    cardDue: { borderColor: colors.accent35, backgroundColor: colors.accent16 },

    typeRail: {
      position: "absolute",
      left: 0,
      top: 10,
      bottom: 10,
      width: 4,
      borderTopRightRadius: 8,
      borderBottomRightRadius: 8,
    },
    typeRailHabit: { backgroundColor: colors.accent500 },
    typeRailSubscription: { backgroundColor: colors.white35 },
    typeRailDue: { backgroundColor: colors.accent500 },

    left: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },

    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: colors.white10,
      borderWidth: 1,
      borderColor: colors.white12,
      alignItems: "center",
      justifyContent: "center",
    },
    iconWrapDue: {
      backgroundColor: colors.accent18,
      borderColor: colors.accent35,
    },
    emoji: { fontSize: 18 },

    metaRow: { marginBottom: 4 },
    typeChip: {
      alignSelf: "flex-start",
      borderRadius: 999,
      borderWidth: 1,
      paddingVertical: 3,
      paddingHorizontal: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    typeChipHabit: {
      backgroundColor: colors.accent18,
      borderColor: colors.accent35,
    },
    typeChipSubscription: {
      backgroundColor: colors.white08,
      borderColor: colors.white16,
    },
    typeChipDue: {
      backgroundColor: colors.accent18,
      borderColor: colors.accent35,
    },
    typeChipText: { color: colors.textTitle, fontWeight: "900", fontSize: 10 },
    title: { color: colors.textTitle, fontWeight: "900" },
    sub: { marginTop: 2, color: colors.textMuted, fontWeight: "700", fontSize: 12 },

    quickBtn: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 14,
      borderWidth: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    quickBtnHabit: {
      backgroundColor: colors.white08,
      borderColor: colors.white12,
    },
    quickBtnSubscription: {
      backgroundColor: colors.accent18,
      borderColor: colors.accent35,
    },
    quickBtnDue: {
      backgroundColor: colors.accent500,
      borderColor: colors.accent30,
    },
    quickBtnDisabled: {
      backgroundColor: colors.white08,
      borderColor: colors.white10,
    },
    quickText: { fontWeight: "900", fontSize: 12 },
  });
}
