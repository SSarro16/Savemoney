import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlobalStyles } from "../../constants/styles";

export default function IconButton({
  icon,
  size,
  color,
  onPress,
  variant = "plain", // plain | soft
  disabled = false,
}) {
  const colors = GlobalStyles.colors;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === "soft" && {
          backgroundColor: colors.white08,
          borderWidth: 1,
          borderColor: colors.white10,
        },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
      hitSlop={10}
    >
      <View style={styles.inner}>
        <Ionicons name={icon} size={size} color={color} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 14, overflow: "hidden", backgroundColor: "transparent" },
  inner: { padding: 8, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.86, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.55 },
});
