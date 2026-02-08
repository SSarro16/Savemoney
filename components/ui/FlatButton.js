import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { GlobalStyles } from "../../constants/styles";

export default function FlatButton({
  children,
  onPress,
  mode = "ghost", // primary | ghost | danger
  disabled = false,
}) {
  const colors = GlobalStyles.colors;

  const isPrimary = mode === "primary";
  const isGhost = mode === "ghost";
  const isDanger = mode === "danger";

  const bg = isPrimary
    ? colors.accent18
    : isDanger
      ? colors.danger20
      : colors.white08;
  const border = isPrimary
    ? colors.accent35
    : isDanger
      ? colors.danger30
      : colors.white12;

  const textColor = isDanger ? colors.textTitle : colors.textBody;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, borderColor: border },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.inner}>
        <Text style={[styles.text, { color: textColor }]}>{children}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 16, overflow: "hidden", borderWidth: 1 },
  inner: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { fontWeight: "900", fontSize: 13, letterSpacing: 0.2 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.55 },
});
