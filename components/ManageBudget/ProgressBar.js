import React from "react";
import { View, StyleSheet } from "react-native";
import { GlobalStyles } from "../../constants/styles";

export default function ProgressBar({ value, color }) {
  const colors = GlobalStyles.colors;
  const safe = Math.max(0, Math.min(1, Number(value || 0)));

  return (
    <View
      style={[
        styles.track,
        { backgroundColor: colors.surface2, borderColor: colors.border },
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${safe * 100}%`,
            backgroundColor: color || colors.accent500,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 10, borderRadius: 999, overflow: "hidden", borderWidth: 1 },
  fill: { height: "100%", borderRadius: 999 },
});
