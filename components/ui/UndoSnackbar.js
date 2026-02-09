import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlobalStyles } from "../../constants/styles";
import { useTranslation } from "../../store/language-context";

export default function UndoSnackbar({
  visible,
  message,
  onUndo,
  onDismiss = () => {},
  bottomOffset = 0,
}) {
  const colors = GlobalStyles.colors;
  const { t } = useTranslation();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 180 : 160,
      useNativeDriver: true,
    }).start();
  }, [visible, anim]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  if (!visible) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onDismiss}>
      <View style={styles.portal} pointerEvents="box-none">
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />

        <Animated.View
          style={[
            styles.wrap,
            {
              opacity: anim,
              transform: [{ translateY }],
              paddingBottom:
                (Platform.OS === "ios" ? 16 : 12) + Math.max(0, bottomOffset),
            },
          ]}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.primary800,
                borderColor: colors.white12,
              },
            ]}
          >
            <View style={styles.left}>
              <Ionicons
                name="trash-outline"
                size={18}
                color={colors.textTitle}
              />
              <Text
                style={[styles.text, { color: colors.textBody }]}
                numberOfLines={2}
              >
                {message || t("expenses.expenseDeleted")}
              </Text>
            </View>

            <Pressable
              onPress={onUndo}
              style={({ pressed }) => [
                styles.btn,
                {
                  backgroundColor: colors.accent18,
                  borderColor: colors.accent35,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.btnText, { color: colors.textTitle }]}>
                {t("common.undo").toUpperCase()}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  portal: { flex: 1, justifyContent: "flex-end" },
  wrap: {
    paddingHorizontal: 14,
  },
  card: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  text: { fontWeight: "900", fontSize: 13, flex: 1 },
  btn: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  btnText: { fontWeight: "900", fontSize: 12, letterSpacing: 0.2 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});
