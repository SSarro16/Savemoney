import { useEffect, useMemo, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlobalStyles } from "../../constants/styles";
import { useTranslation } from "../../context/LanguageContext";

export default function DateTimePickerModal({
  visible,
  mode,
  value,
  title,
  onCancel,
  onConfirm,
}) {
  const colors = GlobalStyles.colors;
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [tempValue, setTempValue] = useState(value || new Date());

  useEffect(() => {
    if (visible) {
      setTempValue(value || new Date());
    }
  }, [visible, value]);

  const pickerThemeVariant = useMemo(
    () => (colors.textTitle === "#ffffff" ? "dark" : "light"),
    [colors.textTitle],
  );

  const onPickerChange = (_event, selected) => {
    if (!selected) {
      return;
    }
    setTempValue(selected);
  };

  const confirm = () => {
    onConfirm?.(tempValue);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay60 }]}> 
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface2,
              borderColor: colors.white12,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.textTitle }]}>{title}</Text>

          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={tempValue}
              mode={mode}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              {...(Platform.OS === "ios"
                ? { textColor: colors.textTitle, themeVariant: pickerThemeVariant }
                : {})}
              onChange={onPickerChange}
            />
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={[styles.actionBtn, { backgroundColor: colors.white08, borderColor: colors.white12 }]}
            >
              <Text style={[styles.actionText, { color: colors.textBody }]}>{t("common.cancel")}</Text>
            </Pressable>
            <Pressable
              onPress={confirm}
              style={[styles.actionBtn, { backgroundColor: colors.accent18, borderColor: colors.accent35 }]}
            >
              <Text style={[styles.actionText, { color: colors.textOnAccent }]}>{t("common.save")}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  sheet: {
    width: "100%",
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 6,
  },
  pickerWrap: {
    alignItems: "center",
  },
  actions: {
    marginTop: 8,
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "900",
  },
});
