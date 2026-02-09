import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
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
  const pressAnim = useRef(new Animated.Value(0)).current;
  const scale = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.97],
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
      hitSlop={10}
    >
      <Animated.View
        style={[
          styles.base,
          variant === "soft" && {
            backgroundColor: colors.white08,
            borderWidth: 1,
            borderColor: colors.white10,
          },
          { transform: [{ scale }] },
          disabled && styles.disabled,
        ]}
      >
        <View style={styles.inner}>
          <Ionicons name={icon} size={size} color={color} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: { borderRadius: 14 },
  base: { borderRadius: 14, overflow: "hidden", backgroundColor: "transparent" },
  inner: { padding: 8, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.55 },
});
