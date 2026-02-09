import React, { useMemo, useRef, useState, useEffect, useContext } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  Animated,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { GlobalStyles } from "../../constants/styles";
import { CustomizationContext } from "../../store/customization-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "../../store/language-context";

function formatDatePretty(d) {
  if (!d) return "";
  const months = [
    "Gen",
    "Feb",
    "Mar",
    "Apr",
    "Mag",
    "Giu",
    "Lug",
    "Ago",
    "Set",
    "Ott",
    "Nov",
    "Dic",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function CustomDatePicker({
  value,
  onChange,
  disabled = false,
  label,
}) {
  const colors = GlobalStyles.colors;
  const { compactMode, highContrast } = useContext(CustomizationContext);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const labelText = label || t("datePicker.label");

  const [open, setOpen] = useState(false);
  const [tempDate, setTempDate] = useState(value ?? new Date());
  const displayText = useMemo(() => formatDatePretty(value), [value]);

  const focusAnim = useRef(new Animated.Value(0)).current;

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      highContrast ? colors.borderStrong : colors.border,
      colors.accent500,
    ],
  });

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: open ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [open]);

  const openPicker = () => {
    if (disabled) return;
    setTempDate(value ?? new Date());
    setOpen(true);
  };
  const close = () => setOpen(false);

  const confirmIOS = () => {
    onChange?.(tempDate);
    close();
  };

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isToday = value ? sameDay(value, today) : false;
  const isYesterday = value ? sameDay(value, yesterday) : false;
  const pickerThemeVariant = colors.textTitle === "#ffffff" ? "dark" : "light";
  const modalCardMaxHeight = Math.max(
    320,
    windowHeight - insets.top - insets.bottom - 40,
  );

  const setQuickDate = (d) => {
    if (disabled) return;
    onChange?.(d);
  };

  return (
    <View>
      <View style={[styles.labelRow, { minHeight: compactMode ? 22 : 26 }]}>
        <Text style={[styles.label, { color: colors.textMuted }]}>{labelText}</Text>

        <View style={styles.quickRow}>
          <Pressable
            onPress={() => setQuickDate(new Date())}
            style={({ pressed }) => [
              styles.quickChip,
              {
                backgroundColor: colors.surface,
                borderColor: highContrast ? colors.borderStrong : colors.border,
              },
              isToday && { borderColor: colors.accent500 },
              pressed && !disabled && styles.pressed,
              disabled && styles.disabled,
            ]}
          >
            <Text
              style={[
                styles.quickText,
                { color: isToday ? colors.textTitle : colors.textBody },
              ]}
            >
              {t("common.today")}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              const d = new Date();
              d.setDate(d.getDate() - 1);
              setQuickDate(d);
            }}
            style={({ pressed }) => [
              styles.quickChip,
              {
                backgroundColor: colors.surface,
                borderColor: highContrast ? colors.borderStrong : colors.border,
              },
              isYesterday && { borderColor: colors.accent500 },
              pressed && !disabled && styles.pressed,
              disabled && styles.disabled,
            ]}
          >
            <Text
              style={[
                styles.quickText,
                { color: isYesterday ? colors.textTitle : colors.textBody },
              ]}
            >
              {t("common.yesterday")}
            </Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        onPress={openPicker}
        disabled={disabled}
        style={({ pressed }) =>
          pressed && !disabled ? { opacity: 0.92 } : null
        }
      >
        <Animated.View
          style={[
            styles.field,
            {
              borderColor,
              backgroundColor: colors.surface2,
              paddingVertical: compactMode ? 10 : 12,
            },
          ]}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color={colors.accent500}
          />
          <Text style={[styles.value, { color: colors.textTitle }]}>
            {displayText}
          </Text>
        </Animated.View>
      </Pressable>

      <Modal
        transparent
        animationType="fade"
        visible={open}
        onRequestClose={close}
      >
        <View
          style={[styles.modalBackdrop, { backgroundColor: colors.overlay60 }]}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.bg,
                borderColor: highContrast ? colors.borderStrong : colors.border,
                maxHeight: modalCardMaxHeight,
              },
            ]}
          >
            <ScrollView
              style={{ width: "100%" }}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.modalTitle, { color: colors.textTitle }]}>
                {t("datePicker.selectDate")}
              </Text>

              <View style={styles.pickerWrap}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  {...(Platform.OS === "ios"
                    ? { textColor: colors.textTitle, themeVariant: pickerThemeVariant }
                    : {})}
                  onChange={(event, selectedDate) => {
                    if (selectedDate) setTempDate(selectedDate);
                    if (Platform.OS !== "ios") {
                      if (selectedDate) onChange?.(selectedDate);
                      close();
                    }
                  }}
                />
              </View>

              {Platform.OS === "ios" && (
                <View style={styles.actionsRow}>
                  <Pressable
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: colors.surface2,
                        borderColor: highContrast
                          ? colors.borderStrong
                          : colors.border,
                      },
                    ]}
                    onPress={close}
                  >
                    <Text
                      style={[styles.actionText, { color: colors.textTitle }]}
                    >
                      {t("common.cancel")}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: colors.accent18,
                        borderColor: colors.accent35,
                      },
                    ]}
                    onPress={confirmIOS}
                  >
                    <Text
                      style={[styles.actionText, { color: colors.textOnAccent }]}
                    >
                      {t("common.confirm")}
                    </Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: { fontSize: 12, fontWeight: "800", letterSpacing: 0.2 },

  quickRow: { flexDirection: "row", gap: 8 },
  quickChip: {
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  quickText: { fontWeight: "800", fontSize: 12 },

  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },

  value: { fontSize: 16, fontWeight: "800" },

  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.55 },

  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  modalCard: {
    width: "100%",
    alignSelf: "center",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  modalContent: { paddingBottom: 4 },
  modalTitle: { fontSize: 16, fontWeight: "800", marginBottom: 10 },
  pickerWrap: { width: "100%", alignItems: "center" },
  actionsRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionText: { fontWeight: "800", fontSize: 15 },
});
