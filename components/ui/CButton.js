import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { GlobalStyles } from "../../constants/styles";

export default function CButton({
  children,
  label,
  onPress,
  type = "primary",
  mode,
  disabled = false,
}) {
  const colors = GlobalStyles.colors;

  const variant =
    mode === "flat" || mode === "secondary"
      ? "secondary"
      : mode === "danger" || type === "danger"
        ? "danger"
        : type;

  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";

  const text = label ?? children;

  const bg = isPrimary
    ? colors.accent500
    : isDanger
      ? colors.danger20
      : colors.white08;
  const border = isPrimary
    ? colors.accent30
    : isDanger
      ? colors.danger30
      : colors.white12;

  const textColor = isPrimary ? colors.textOnAccentStrong : colors.textTitle;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, borderColor: border },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.text, { color: textColor }]}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  text: { fontWeight: "900", fontSize: 13, letterSpacing: 0.2 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.55 },
});
