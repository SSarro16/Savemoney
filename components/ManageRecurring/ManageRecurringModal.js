import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { GlobalStyles } from "../../constants/styles";
import RecurringForm from "./RecurringForm";

export default function ManageRecurringModal({
  visible,
  onClose,
  onSubmit,
  defaultValues,
}) {
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);
  const translateY = useRef(new Animated.Value(420)).current;

  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const showEvt =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const subShow = Keyboard.addListener(showEvt, () => setKeyboardOpen(true));
    const subHide = Keyboard.addListener(hideEvt, () => setKeyboardOpen(false));

    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  useEffect(() => {
    if (!visible) return;

    translateY.setValue(420);
    Animated.timing(translateY, {
      toValue: 0,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, [visible, translateY]);

  const close = () => {
    Keyboard.dismiss();
    Animated.timing(translateY, {
      toValue: 420,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onClose?.());
  };

  const Wrapper = Platform.OS === "ios" ? KeyboardAvoidingView : View;
  const behavior = Platform.OS === "ios" ? "padding" : undefined;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={close} />

        <Wrapper style={styles.wrap} behavior={behavior}>
          <Animated.View
            style={[styles.sheet, { transform: [{ translateY }] }]}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              <RecurringForm
                defaultValues={defaultValues}
                onCancel={close}
                onSubmit={onSubmit}
              />
            </ScrollView>

            {keyboardOpen && (
              <Pressable
                onPress={() => Keyboard.dismiss()}
                style={({ pressed }) => [
                  styles.keyboardCloseBtn,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Ionicons name="keypad-outline" size={18} color={colors.textTitle} />
                <Ionicons name="chevron-down" size={18} color={colors.textTitle} />
              </Pressable>
            )}
          </Animated.View>
        </Wrapper>
      </View>
    </Modal>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    root: { flex: 1 },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlay60,
    },
    wrap: {
      flex: 1,
      justifyContent: "flex-end",
      padding: 12,
    },
    sheet: {
      maxHeight: "88%",
      backgroundColor: colors.primary800,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.white10,
      padding: 12,
      overflow: "hidden",
    },

    keyboardCloseBtn: {
      position: "absolute",
      right: 14,
      bottom: 14,
      width: 52,
      height: 52,
      borderRadius: 18,
      backgroundColor: colors.white12,
      borderWidth: 1,
      borderColor: colors.white14,
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
    },
  });
}
