import React from "react";
import { StyleSheet, View } from "react-native";

import { GlobalStyles } from "../../constants/styles";

function SkeletonBlock({ style }) {
  return <View style={style} />;
}

export default function DataScreenSkeleton({ sections = 3, compact = false }) {
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors, compact);

  return (
    <View style={styles.screen}>
      <View style={styles.hero} />
      <View style={styles.pillsRow}>
        <View style={styles.pill} />
        <View style={styles.pill} />
        <View style={styles.pill} />
      </View>

      {Array.from({ length: sections }).map((_, index) => (
        <View key={`skeleton-${index}`} style={styles.card}>
          <SkeletonBlock style={styles.title} />
          <SkeletonBlock style={styles.row} />
          <SkeletonBlock style={styles.rowShort} />
          <SkeletonBlock style={styles.row} />
        </View>
      ))}
    </View>
  );
}

function makeStyles(colors, compact) {
  const pad = compact ? 12 : 14;
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bg,
      paddingHorizontal: pad,
      paddingTop: pad,
      gap: 10,
    },
    hero: {
      height: compact ? 88 : 102,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
    },
    pillsRow: {
      flexDirection: "row",
      gap: 8,
    },
    pill: {
      flex: 1,
      height: 32,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
    },
    card: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      padding: 10,
      gap: 8,
    },
    title: {
      width: "46%",
      height: 14,
      borderRadius: 8,
      backgroundColor: colors.white10,
    },
    row: {
      width: "100%",
      height: 30,
      borderRadius: 12,
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.white10,
    },
    rowShort: {
      width: "72%",
      height: 12,
      borderRadius: 8,
      backgroundColor: colors.white10,
    },
  });
}
