import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { GlobalStyles } from "../../constants/styles";
import { endOfDay, formatDate, formatTime, startOfDay, toDate } from "../../utils/dates";
import Button from "../ui/Button";
import Card from "../ui/Card";
import DateTimePickerModal from "../ui/DateTimePickerModal";
import TextField from "../ui/TextField";

const CATEGORIES = ["Work", "Personal", "Study", "Health", "Other"];

function mergeDatePart(baseDate, selectedDate) {
  const base = toDate(baseDate);
  const selected = toDate(selectedDate, base);

  const next = new Date(base);
  next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
  return next;
}

function mergeTimePart(baseDate, selectedTime) {
  const base = toDate(baseDate);
  const selected = toDate(selectedTime, base);

  const next = new Date(base);
  next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
  return next;
}

function buildDefaultRange(selectedDate) {
  const baseDate = toDate(selectedDate);

  const startAt = new Date(baseDate);
  startAt.setHours(9, 0, 0, 0);

  const endAt = new Date(baseDate);
  endAt.setHours(10, 0, 0, 0);

  return { startAt, endAt };
}

export default function EventQuickAddModal({
  visible,
  selectedDate,
  onClose,
  onSave,
  isSaving = false,
}) {
  const colors = GlobalStyles.colors;

  const [title, setTitle] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("");
  const [startAt, setStartAt] = useState(new Date());
  const [endAt, setEndAt] = useState(new Date());

  const [formError, setFormError] = useState(null);
  const [pickerState, setPickerState] = useState(null);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const range = buildDefaultRange(selectedDate);
    setTitle("");
    setAllDay(false);
    setCategory(CATEGORIES[0]);
    setNotes("");
    setLocation("");
    setStartAt(range.startAt);
    setEndAt(range.endAt);
    setFormError(null);
    setPickerState(null);
  }, [selectedDate, visible]);

  const toggleAllDay = (value) => {
    setAllDay(value);
    if (value) {
      setStartAt(startOfDay(startAt));
      setEndAt(endOfDay(startAt));
      return;
    }

    const nextRange = buildDefaultRange(startAt);
    setStartAt(nextRange.startAt);
    setEndAt(nextRange.endAt);
  };

  const openPicker = (field, mode) => {
    setPickerState({ field, mode });
  };

  const onPickerConfirm = (value) => {
    if (!pickerState || !value) {
      setPickerState(null);
      return;
    }

    const isStartField = pickerState.field === "start";
    const mode = pickerState.mode;

    const currentValue = isStartField ? startAt : endAt;
    const mergedValue = mode === "date" ? mergeDatePart(currentValue, value) : mergeTimePart(currentValue, value);

    if (isStartField) {
      setStartAt(mergedValue);
      if (endAt < mergedValue) {
        setEndAt(new Date(mergedValue));
      }
    } else {
      setEndAt(mergedValue);
    }

    setPickerState(null);
  };

  const saveHandler = async () => {
    const normalizedTitle = String(title || "").trim();

    if (!normalizedTitle) {
      setFormError("Title is required.");
      return;
    }

    if (endAt < startAt) {
      setFormError("End date/time must be after start date/time.");
      return;
    }

    setFormError(null);

    try {
      await onSave({
        title: normalizedTitle,
        allDay,
        startAt,
        endAt,
        category,
        notes,
        location,
      });
    } catch (error) {
      setFormError(error?.message || "Unable to save event.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable
          style={[styles.backdropTap, { backgroundColor: colors.overlay60 }]}
          onPress={onClose}
        />

        <Card style={[styles.sheet, { backgroundColor: colors.surface2 }]}> 
          <Text style={[styles.title, { color: colors.textTitle }]}>Create event</Text>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <TextField
              label="Title"
              value={title}
              onChangeText={(value) => {
                setTitle(value);
                if (formError) {
                  setFormError(null);
                }
              }}
              placeholder="Event title"
              leftIcon="create-outline"
            />

            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.textBody }]}>All day</Text>
              <Switch
                value={allDay}
                onValueChange={toggleAllDay}
                trackColor={{ false: colors.white20, true: colors.accent35 }}
                thumbColor={allDay ? colors.accent500 : colors.white88}
              />
            </View>

            <View style={styles.datetimeBlock}>
              <Text style={[styles.blockLabel, { color: colors.textBody }]}>Start</Text>
              <View style={styles.datetimeRow}>
                <Pressable
                  onPress={() => openPicker("start", "date")}
                  style={[styles.datetimeButton, { borderColor: colors.white12, backgroundColor: colors.white08 }]}
                >
                  <Text style={[styles.datetimeText, { color: colors.textTitle }]}> 
                    {formatDate(startAt, "dd MMM yyyy")}
                  </Text>
                </Pressable>

                {!allDay && (
                  <Pressable
                    onPress={() => openPicker("start", "time")}
                    style={[styles.datetimeButton, { borderColor: colors.white12, backgroundColor: colors.white08 }]}
                  >
                    <Text style={[styles.datetimeText, { color: colors.textTitle }]}> 
                      {formatTime(startAt)}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>

            <View style={styles.datetimeBlock}>
              <Text style={[styles.blockLabel, { color: colors.textBody }]}>End</Text>
              <View style={styles.datetimeRow}>
                <Pressable
                  onPress={() => openPicker("end", "date")}
                  style={[styles.datetimeButton, { borderColor: colors.white12, backgroundColor: colors.white08 }]}
                >
                  <Text style={[styles.datetimeText, { color: colors.textTitle }]}> 
                    {formatDate(endAt, "dd MMM yyyy")}
                  </Text>
                </Pressable>

                {!allDay && (
                  <Pressable
                    onPress={() => openPicker("end", "time")}
                    style={[styles.datetimeButton, { borderColor: colors.white12, backgroundColor: colors.white08 }]}
                  >
                    <Text style={[styles.datetimeText, { color: colors.textTitle }]}> 
                      {formatTime(endAt)}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>

            <View style={styles.categoryWrap}>
              <Text style={[styles.blockLabel, { color: colors.textBody }]}>Category</Text>
              <View style={styles.categoryRow}>
                {CATEGORIES.map((item) => {
                  const selected = category === item;
                  return (
                    <Pressable
                      key={item}
                      onPress={() => setCategory(item)}
                      style={[
                        styles.categoryButton,
                        selected
                          ? { backgroundColor: colors.accent500, borderColor: colors.accent30 }
                          : { backgroundColor: colors.white08, borderColor: colors.white12 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryLabel,
                          {
                            color: selected ? colors.textOnAccentStrong : colors.textBody,
                          },
                        ]}
                      >
                        {item}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <TextField
              label="Location (optional)"
              value={location}
              onChangeText={setLocation}
              placeholder="Office, home, online..."
              leftIcon="location-outline"
            />

            <TextField
              label="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              placeholder="Add details"
              leftIcon="document-text-outline"
              multiline
              numberOfLines={4}
            />

            {!!formError && <Text style={[styles.errorText, { color: colors.error500 }]}>{formError}</Text>}

            <View style={styles.actionRow}>
              <Button variant="secondary" onPress={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button onPress={saveHandler} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </View>
          </ScrollView>
        </Card>

        <DateTimePickerModal
          visible={!!pickerState}
          mode={pickerState?.mode || "date"}
          value={pickerState?.field === "start" ? startAt : endAt}
          title={pickerState?.field === "start" ? "Start" : "End"}
          onCancel={() => setPickerState(null)}
          onConfirm={onPickerConfirm}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdropTap: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: 18,
    maxHeight: "92%",
  },
  title: {
    fontSize: 19,
    fontWeight: "900",
    marginBottom: 10,
  },
  switchRow: {
    marginTop: 8,
    marginBottom: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "800",
  },
  datetimeBlock: {
    marginTop: 10,
  },
  blockLabel: {
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 6,
  },
  datetimeRow: {
    flexDirection: "row",
    gap: 8,
  },
  datetimeButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  datetimeText: {
    fontSize: 13,
    fontWeight: "800",
  },
  categoryWrap: {
    marginTop: 12,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: "900",
  },
  errorText: {
    marginTop: 10,
    fontWeight: "800",
    fontSize: 12,
  },
  actionRow: {
    marginTop: 14,
    marginBottom: 10,
    flexDirection: "row",
    gap: 10,
  },
});
