import { useContext, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";

import { GlobalStyles } from "../../constants/styles";
import { CustomizationContext } from "../../context/CustomizationContext";

export default function Button({
  children,
  label,
  onPress,
  variant = "primary",
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
}) {
  const colors = GlobalStyles.colors;
  const { reduceMotion, textScale } = useContext(CustomizationContext);
  const text = label ?? children;

  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";

  const backgroundColor = isPrimary
    ? colors.accent500
    : isDanger
      ? colors.danger20
      : colors.white08;
  const borderColor = isPrimary
    ? colors.accent30
    : isDanger
      ? colors.danger30
      : colors.white12;
  const textColor = isPrimary ? colors.textOnAccentStrong : colors.textTitle;

  const pressAnim = useRef(new Animated.Value(0)).current;
  const scale = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.975],
  });

  const animateTo = (value) => {
    if (reduceMotion) {
      pressAnim.setValue(value);
      return;
    }
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
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || String(text || "")}
      accessibilityHint={accessibilityHint}
      onPressIn={() => animateTo(1)}
      onPressOut={() => animateTo(0)}
      style={styles.outer}
    >
      <Animated.View
        style={[
          styles.button,
          {
            backgroundColor,
            borderColor,
            transform: [{ scale }],
          },
          disabled && styles.disabled,
        ]}
      >
        <Text style={[styles.label, { color: textColor, fontSize: 14 * textScale }]}>{text}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  label: {
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 0.2,
  },
  disabled: {
    opacity: 0.55,
  },
});
