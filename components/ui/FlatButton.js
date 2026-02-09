import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { GlobalStyles } from "../../constants/styles";

export default function FlatButton({
  children,
  onPress,
  mode = "ghost", // primary | ghost | danger
  disabled = false,
}) {
  const colors = GlobalStyles.colors;

  const isPrimary = mode === "primary";
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
  const pressAnim = useRef(new Animated.Value(0)).current;
  const scale = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.975],
  });

  const animateTo = (value) => {
    Animated.spring(pressAnim, {
      toValue: value,
      speed: 22,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => animateTo(1)}
      onPressOut={() => animateTo(0)}
      style={styles.outer}
    >
      <Animated.View
        style={[
          styles.base,
          { backgroundColor: bg, borderColor: border, transform: [{ scale }] },
          disabled && styles.disabled,
        ]}
      >
        <View style={styles.inner}>
          <Text style={[styles.text, { color: textColor }]}>{children}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: { borderRadius: 16 },
  base: { borderRadius: 16, overflow: "hidden", borderWidth: 1 },
  inner: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { fontWeight: "900", fontSize: 13, letterSpacing: 0.2 },
  disabled: { opacity: 0.55 },
});
