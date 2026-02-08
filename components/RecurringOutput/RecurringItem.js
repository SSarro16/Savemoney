import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlobalStyles } from "../../constants/styles";
import { RecurringType } from "../../util/recurring/recurring-utils";

function isEmoji(value) {
  return typeof value === "string" && !value.includes("-");
}

export default function RecurringItem({ item, isDue, onPress, onQuickAction }) {
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);

  const icon = item?.icon || "repeat-outline";
  const title = String(item?.title || "");
  const amount = Number(item?.amount || 0);
  const isSub = item?.type === RecurringType.SUBSCRIPTION;
  const isPaidSubscription = isSub && !isDue;
  const quickLabel = isSub ? (isPaidSubscription ? "Pagato" : "Paga") : "Aggiungi";
  const quickIcon =
    isSub && isPaidSubscription ? "checkmark-circle" : "add-circle-outline";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && { opacity: 0.92, transform: [{ scale: 0.995 }] },
        isDue && styles.cardDue,
      ]}
    >
      <View style={styles.left}>
        <View style={[styles.iconWrap, isDue && styles.iconWrapDue]}>
          {isEmoji(icon) ? (
            <Text style={styles.emoji}>{icon}</Text>
          ) : (
            <Ionicons name={icon} size={18} color={colors.textTitle} />
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {isSub ? "Abbonamento" : "Abitudine"} - {amount.toFixed(2)} EUR
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
        style={({ pressed }) => [
          styles.quickBtn,
          pressed && { opacity: 0.9 },
          isDue && styles.quickBtnDue,
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
      padding: 12,
      borderRadius: 18,
      backgroundColor: colors.white06,
      borderWidth: 1,
      borderColor: colors.white10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 10,
    },
    cardDue: { borderColor: colors.accent35, backgroundColor: colors.accent12 },

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

    title: { color: colors.textTitle, fontWeight: "900" },
    sub: { marginTop: 2, color: colors.textMuted, fontWeight: "700", fontSize: 12 },

    quickBtn: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: colors.accent18,
      borderWidth: 1,
      borderColor: colors.accent35,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
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
