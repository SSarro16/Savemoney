import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { GlobalStyles } from "../../constants/styles";
import {
  RecurringType,
  isDueTodayOrPast,
  formatDateShortIT,
} from "../../util/recurring/recurring-utils";

export default function RecurringTimeline({ items }) {
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);

  const nextEvents = useMemo(() => {
    return (items || [])
      .filter((x) => x.type === RecurringType.SUBSCRIPTION)
      .map((x) => {
        const due = isDueTodayOrPast(x.nextDue);
        const next = x.nextDue ? new Date(x.nextDue) : null;
        const t = next ? next.getTime() : Number.MAX_SAFE_INTEGER;
        return { ...x, _due: due, _t: t };
      })
      .sort((a, b) => {
        if (a._due !== b._due) return a._due ? -1 : 1;
        return a._t - b._t;
      })
      .slice(0, 5);
  }, [items]);

  if (!nextEvents.length) return null;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.icon}>
          <Ionicons name="time-outline" size={16} color={colors.textTitle} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Prossime scadenze</Text>
          <Text style={styles.sub}>Solo abbonamenti</Text>
        </View>
      </View>

      <View style={{ marginTop: 10 }}>
        {nextEvents.map((x) => (
          <View key={String(x.id)} style={styles.row}>
            <View style={[styles.dotWrap, x._due ? styles.dotDueWrap : styles.dotPaidWrap]}>
              <Ionicons
                name={x._due ? "alert-circle-outline" : "checkmark-outline"}
                size={12}
                color={x._due ? colors.textOnAccentStrong : colors.textTitle}
              />
            </View>

            <Text style={styles.rowTitle} numberOfLines={1}>
              {x.title}
            </Text>

            <View style={styles.rowRight}>
              <Text style={[styles.rowDate, x._due && styles.rowDue]}>
                {x._due ? "Oggi" : formatDateShortIT(x.nextDue)}
              </Text>
              {!x._due ? (
                <View style={styles.paidPill}>
                  <Ionicons name="checkmark" size={11} color={colors.textTitle} />
                  <Text style={styles.paidPillText}>Pagato</Text>
                </View>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </View>
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
    },
    head: { flexDirection: "row", alignItems: "center", gap: 10 },
    icon: {
      width: 34,
      height: 34,
      borderRadius: 14,
      backgroundColor: colors.accent18,
      borderWidth: 1,
      borderColor: colors.accent35,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { color: colors.textTitle, fontWeight: "900" },
    sub: { marginTop: 2, color: colors.textMuted, fontWeight: "700", fontSize: 12 },

    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: colors.white10,
    },
    dotWrap: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },
    dotDueWrap: {
      backgroundColor: colors.accent500,
      borderColor: colors.accent30,
    },
    dotPaidWrap: {
      backgroundColor: colors.white08,
      borderColor: colors.white10,
    },

    rowTitle: { flex: 1, color: colors.textTitle, fontWeight: "800" },
    rowRight: { flexDirection: "row", alignItems: "center", gap: 6 },
    rowDate: { color: colors.textMuted, fontWeight: "900", fontSize: 12 },
    rowDue: { color: colors.accent500 },
    paidPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      paddingVertical: 2,
      paddingHorizontal: 6,
    },
    paidPillText: { color: colors.textTitle, fontWeight: "900", fontSize: 10 },
  });
}
