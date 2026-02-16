import { useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import DateTimePickerModal from "../../components/ui/DateTimePickerModal";
import LoadingOverlay from "../../components/ui/LoadingOverlay";
import TextField from "../../components/ui/TextField";
import { GlobalStyles } from "../../constants/styles";
import { AuthContext } from "../../context/AuthContext";
import { useTranslation } from "../../context/LanguageContext";
import {
  createEvent,
  deleteEvent,
  getEventById,
  startEventTimer,
  stopEventTimer,
  updateEvent,
} from "../../services/eventsService";
import { endOfDay, formatDate, formatTime, startOfDay, toDate } from "../../utils/dates";

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

function buildDefaultRange(dateLike) {
  const baseDate = toDate(dateLike);

  const startAt = new Date(baseDate);
  startAt.setHours(9, 0, 0, 0);

  const endAt = new Date(baseDate);
  endAt.setHours(10, 0, 0, 0);

  return { startAt, endAt };
}

function toNullableDate(value) {
  if (!value) {
    return null;
  }
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function parseInitialEvent(initialEvent, fallbackDate) {
  const defaultRange = buildDefaultRange(fallbackDate);

  if (!initialEvent) {
    return {
      title: "",
      allDay: false,
      category: CATEGORIES[0],
      expectedDurationMinutes: "",
      notes: "",
      location: "",
      startAt: defaultRange.startAt,
      endAt: defaultRange.endAt,
      trackedDurationSeconds: 0,
      timerStartedAt: null,
      isTimerRunning: false,
    };
  }

  const startAt = toDate(initialEvent.startAt, defaultRange.startAt);
  const endAt = toDate(initialEvent.endAt, defaultRange.endAt);

  return {
    title: String(initialEvent.title || ""),
    allDay: Boolean(initialEvent.allDay),
    category: String(initialEvent.category || CATEGORIES[0]),
    expectedDurationMinutes:
      initialEvent.expectedDurationMinutes === null ||
      initialEvent.expectedDurationMinutes === undefined
        ? ""
        : String(initialEvent.expectedDurationMinutes),
    notes: String(initialEvent.notes || ""),
    location: String(initialEvent.location || ""),
    startAt,
    endAt,
    trackedDurationSeconds: Number(initialEvent.trackedDurationSeconds) || 0,
    timerStartedAt: toNullableDate(initialEvent.timerStartedAt),
    isTimerRunning: Boolean(initialEvent.isTimerRunning),
  };
}

export default function EventEditorScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const colors = GlobalStyles.colors;
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();

  const { mode = "create", eventId, initialDate, initialEvent } = route.params || {};
  const isEditMode = mode === "edit" && !!eventId;

  const [title, setTitle] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [expectedDurationMinutes, setExpectedDurationMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("");
  const [startAt, setStartAt] = useState(new Date());
  const [endAt, setEndAt] = useState(new Date());
  const [trackedDurationSeconds, setTrackedDurationSeconds] = useState(0);
  const [timerStartedAt, setTimerStartedAt] = useState(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [pickerState, setPickerState] = useState(null);
  const [formError, setFormError] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(isEditMode && !initialEvent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTimerUpdating, setIsTimerUpdating] = useState(false);
  const [liveTick, setLiveTick] = useState(Date.now());

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditMode ? t("eventEditor.editTitle") : t("eventEditor.newTitle"),
    });
  }, [isEditMode, navigation, t]);

  useEffect(() => {
    const fallbackDate = toDate(initialDate, new Date());

    const applyState = (eventData) => {
      const parsed = parseInitialEvent(eventData, fallbackDate);
      setTitle(parsed.title);
      setAllDay(parsed.allDay);
      setCategory(parsed.category);
      setExpectedDurationMinutes(parsed.expectedDurationMinutes);
      setNotes(parsed.notes);
      setLocation(parsed.location);
      setStartAt(parsed.startAt);
      setEndAt(parsed.endAt);
      setTrackedDurationSeconds(parsed.trackedDurationSeconds);
      setTimerStartedAt(parsed.timerStartedAt);
      setIsTimerRunning(parsed.isTimerRunning);
      setFormError(null);
    };

    if (initialEvent) {
      applyState(initialEvent);
      setIsBootstrapping(false);
      return;
    }

    if (!isEditMode) {
      applyState(null);
      setIsBootstrapping(false);
      return;
    }

    let isMounted = true;

    const bootstrap = async () => {
      try {
        const remoteEvent = await getEventById(user?.uid, eventId);
        if (!isMounted) {
          return;
        }
        applyState(remoteEvent);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setFormError(error?.message || t("eventEditor.loadError"));
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [eventId, initialDate, initialEvent, isEditMode, user?.uid]);

  useEffect(() => {
    if (!isTimerRunning || !timerStartedAt) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setLiveTick(Date.now());
    }, 15000);

    return () => clearInterval(intervalId);
  }, [isTimerRunning, timerStartedAt]);

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

  const toggleAllDay = (value) => {
    setAllDay(value);

    if (value) {
      setStartAt(startOfDay(startAt));
      setEndAt(endOfDay(startAt));
      return;
    }

    const range = buildDefaultRange(startAt);
    setStartAt(range.startAt);
    setEndAt(range.endAt);
  };

  const payload = useMemo(
    () => ({
      title: String(title || "").trim(),
      startAt,
      endAt,
      expectedDurationMinutes:
        String(expectedDurationMinutes || "").trim().length > 0
          ? Number(expectedDurationMinutes)
          : null,
      allDay,
      category,
      notes,
      location,
    }),
    [title, startAt, endAt, expectedDurationMinutes, allDay, category, notes, location],
  );

  const expectedPreview = useMemo(() => {
    const scheduledMinutes = Math.max(
      0,
      Math.round((endAt.getTime() - startAt.getTime()) / (1000 * 60)),
    );
    const expectedMinutes = Number(expectedDurationMinutes);

    if (!Number.isFinite(expectedMinutes) || expectedMinutes <= 0) {
      return {
        scheduledMinutes,
        expectedMinutes: null,
        expectedEndAt: null,
        timeLostMinutes: null,
      };
    }

    const safeExpectedMinutes = Math.round(expectedMinutes);
    const expectedEndAt = new Date(startAt.getTime() + safeExpectedMinutes * 60 * 1000);
    return {
      scheduledMinutes,
      expectedMinutes: safeExpectedMinutes,
      expectedEndAt,
      timeLostMinutes: scheduledMinutes - safeExpectedMinutes,
    };
  }, [startAt, endAt, expectedDurationMinutes]);

  const scheduleWindowLabel = `${formatDate(startAt, "dd MMM")} ${formatTime(startAt)} - ${formatDate(endAt, "dd MMM")} ${formatTime(endAt)}`;
  const actualTracking = useMemo(() => {
    const runningSeconds = timerStartedAt
      ? Math.max(0, Math.floor((liveTick - timerStartedAt.getTime()) / 1000))
      : 0;
    const totalSeconds = Math.max(0, Number(trackedDurationSeconds) || 0) + runningSeconds;
    const actualMinutes = Math.round(totalSeconds / 60);
    const plannedMinutes = Number(expectedDurationMinutes) > 0
      ? Number(expectedDurationMinutes)
      : Math.max(0, Math.round((endAt.getTime() - startAt.getTime()) / (1000 * 60)));

    return {
      actualMinutes,
      plannedMinutes,
      diffMinutes: actualMinutes - plannedMinutes,
    };
  }, [endAt, expectedDurationMinutes, liveTick, startAt, timerStartedAt, trackedDurationSeconds]);

  const syncTimerFromEvent = (eventData) => {
    const nextTracked = Number(eventData?.trackedDurationSeconds) || 0;
    const nextStartedAt = toNullableDate(eventData?.timerStartedAt);
    setTrackedDurationSeconds(nextTracked);
    setTimerStartedAt(nextStartedAt);
    setIsTimerRunning(Boolean(eventData?.isTimerRunning));
  };

  const handleStartTimer = async () => {
    if (!isEditMode || !user?.uid || !eventId || isTimerUpdating) {
      return;
    }
    setIsTimerUpdating(true);
    setFormError(null);
    try {
      const updatedEvent = await startEventTimer(user.uid, eventId);
      syncTimerFromEvent(updatedEvent);
    } catch (error) {
      setFormError(error?.message || "Unable to start timer.");
    } finally {
      setIsTimerUpdating(false);
    }
  };

  const handleStopTimer = async () => {
    if (!isEditMode || !user?.uid || !eventId || isTimerUpdating) {
      return;
    }
    setIsTimerUpdating(true);
    setFormError(null);
    try {
      const updatedEvent = await stopEventTimer(user.uid, eventId);
      syncTimerFromEvent(updatedEvent);
    } catch (error) {
      setFormError(error?.message || "Unable to stop timer.");
    } finally {
      setIsTimerUpdating(false);
    }
  };

  const saveHandler = async () => {
    if (!payload.title) {
      setFormError(t("eventEditor.titleRequired"));
      return;
    }

    if (payload.endAt < payload.startAt) {
      setFormError(t("eventEditor.invalidRange"));
      return;
    }

    if (
      payload.expectedDurationMinutes !== null &&
      (!Number.isFinite(payload.expectedDurationMinutes) || payload.expectedDurationMinutes <= 0)
    ) {
      setFormError(t("eventEditor.invalidExpected"));
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (isEditMode) {
        await updateEvent(user?.uid, eventId, payload);
      } else {
        await createEvent(user?.uid, payload);
      }

      navigation.goBack();
    } catch (error) {
      setFormError(error?.message || t("eventEditor.saveError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteHandler = async () => {
    if (!isEditMode) {
      return;
    }

    setIsDeleting(true);
    setFormError(null);

    try {
      await deleteEvent(user?.uid, eventId);
      navigation.goBack();
    } catch (error) {
      setFormError(error?.message || t("eventEditor.deleteError"));
      setIsDeleting(false);
    }
  };

  if (isBootstrapping) {
    return <LoadingOverlay message={t("eventEditor.loadError")} />;
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={["left", "right"]}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: Math.max(insets.top, 8),
              paddingBottom: Math.max(insets.bottom, 18),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Card style={[styles.card, { backgroundColor: colors.surface2 }]}> 
          <View style={[styles.editorHero, { borderColor: colors.white10, backgroundColor: colors.white08 }]}>
            <View style={[styles.editorHeroIcon, { borderColor: colors.white10, backgroundColor: colors.surface }]}>
              <Ionicons name="time-outline" size={16} color={colors.accent500} />
            </View>
            <View style={styles.editorHeroTextWrap}>
              <Text style={[styles.editorHeroTitle, { color: colors.textTitle }]}>{t("eventEditor.planningHint")}</Text>
              <Text style={[styles.editorHeroSub, { color: colors.textMuted }]} numberOfLines={1}>
                {scheduleWindowLabel}
              </Text>
            </View>
          </View>

          <TextField
            label={t("eventEditor.title")}
            value={title}
            onChangeText={(value) => {
              setTitle(value);
              if (formError) {
                setFormError(null);
              }
            }}
            placeholder={t("eventEditor.title")}
            leftIcon="create-outline"
          />

          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: colors.textBody }]}>{t("eventEditor.allDay")}</Text>
            <Switch
              value={allDay}
              onValueChange={toggleAllDay}
              trackColor={{ false: colors.white20, true: colors.accent35 }}
              thumbColor={allDay ? colors.accent500 : colors.white88}
            />
          </View>

          <View style={styles.datetimeBlock}>
            <Text style={[styles.blockLabel, { color: colors.textBody }]}>{t("eventEditor.start")}</Text>
            <View style={styles.datetimeRow}>
              <Pressable
                onPress={() => setPickerState({ field: "start", mode: "date" })}
                style={[styles.datetimeButton, { borderColor: colors.white12, backgroundColor: colors.white08 }]}
              >
                <Text style={[styles.datetimeText, { color: colors.textTitle }]}> 
                  {formatDate(startAt, "dd MMM yyyy")}
                </Text>
              </Pressable>

              {!allDay && (
                <Pressable
                  onPress={() => setPickerState({ field: "start", mode: "time" })}
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
            <Text style={[styles.blockLabel, { color: colors.textBody }]}>{t("eventEditor.end")}</Text>
            <View style={styles.datetimeRow}>
              <Pressable
                onPress={() => setPickerState({ field: "end", mode: "date" })}
                style={[styles.datetimeButton, { borderColor: colors.white12, backgroundColor: colors.white08 }]}
              >
                <Text style={[styles.datetimeText, { color: colors.textTitle }]}> 
                  {formatDate(endAt, "dd MMM yyyy")}
                </Text>
              </Pressable>

              {!allDay && (
                <Pressable
                  onPress={() => setPickerState({ field: "end", mode: "time" })}
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
            <Text style={[styles.blockLabel, { color: colors.textBody }]}>{t("eventEditor.category")}</Text>
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

          {!allDay && (
            <View style={styles.expectedWrap}>
              <TextField
                label={t("eventEditor.expectedDuration")}
                value={expectedDurationMinutes}
                onChangeText={(value) => {
                  const sanitized = String(value || "").replace(/[^0-9]/g, "");
                  setExpectedDurationMinutes(sanitized);
                }}
                keyboardType="number-pad"
                placeholder={t("eventEditor.expectedDurationHint")}
                leftIcon="timer-outline"
              />

              <View style={[styles.expectedSummary, { borderColor: colors.white12, backgroundColor: colors.white08 }]}>
                <Text style={[styles.expectedSummaryText, { color: colors.textBody }]}>
                  {t("eventEditor.scheduledSummary", {
                    minutes: expectedPreview.scheduledMinutes,
                  })}
                </Text>
                {expectedPreview.expectedMinutes !== null && (
                  <>
                    <Text style={[styles.expectedSummaryText, { color: colors.textBody }]}>
                      {t("eventEditor.expectedEndSummary", {
                        time: formatTime(expectedPreview.expectedEndAt),
                      })}
                    </Text>
                    <Text style={[styles.expectedSummaryText, { color: colors.textBody }]}>
                      {t("eventEditor.timeLostSummary", {
                        minutes: expectedPreview.timeLostMinutes,
                      })}
                    </Text>
                  </>
                )}
              </View>
            </View>
          )}

          {isEditMode && (
            <View style={[styles.trackingCard, { borderColor: colors.white12, backgroundColor: colors.white08 }]}>
              <View style={styles.trackingHeaderRow}>
                <Text style={[styles.blockLabel, { color: colors.textBody, marginBottom: 0 }]}>
                  {t("timer.detailsTitle")}
                </Text>
                <Text style={[styles.trackingState, { color: isTimerRunning ? colors.accent500 : colors.textMuted }]}>
                  {isTimerRunning ? t("timer.running") : t("timer.stopped")}
                </Text>
              </View>
              <Text style={[styles.trackingSummary, { color: colors.textBody }]}>
                {t("timer.comparison", {
                  actual: actualTracking.actualMinutes,
                  planned: actualTracking.plannedMinutes,
                  diff: actualTracking.diffMinutes,
                })}
              </Text>
              <Pressable
                disabled={isTimerUpdating || isSubmitting || isDeleting}
                onPress={isTimerRunning ? handleStopTimer : handleStartTimer}
                style={({ pressed }) => [
                  styles.trackingButton,
                  isTimerRunning
                    ? { backgroundColor: colors.danger20, borderColor: colors.danger30 }
                    : { backgroundColor: colors.accent18, borderColor: colors.accent30 },
                  (isTimerUpdating || isSubmitting || isDeleting) && { opacity: 0.6 },
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name={isTimerRunning ? "stop" : "play"}
                  size={14}
                  color={isTimerRunning ? colors.error500 : colors.accent500}
                />
                <Text
                  style={[
                    styles.trackingButtonText,
                    { color: isTimerRunning ? colors.error500 : colors.accent500 },
                  ]}
                >
                  {isTimerUpdating
                    ? t("timer.saving")
                    : isTimerRunning
                      ? t("timer.stop")
                      : t("timer.start")}
                </Text>
              </Pressable>
            </View>
          )}

          <TextField
            label={t("eventEditor.location")}
            value={location}
            onChangeText={setLocation}
            placeholder={t("eventEditor.location")}
            leftIcon="location-outline"
          />

          <TextField
            label={t("eventEditor.notes")}
            value={notes}
            onChangeText={setNotes}
            placeholder={t("eventEditor.notes")}
            leftIcon="document-text-outline"
            multiline
            numberOfLines={4}
          />

          {!!formError && <Text style={[styles.errorText, { color: colors.error500 }]}>{formError}</Text>}

          <View style={styles.actionColumn}>
            <Button onPress={saveHandler} disabled={isSubmitting || isDeleting}>
              {isSubmitting ? t("eventEditor.saving") : t("eventEditor.save")}
            </Button>
            <Button
              variant="secondary"
              onPress={() => navigation.goBack()}
              disabled={isSubmitting || isDeleting}
            >
              {t("eventEditor.cancel")}
            </Button>
            {isEditMode && (
              <Button
                variant="danger"
                onPress={deleteHandler}
                disabled={isSubmitting || isDeleting}
              >
                {isDeleting ? t("eventEditor.deleting") : t("eventEditor.delete")}
              </Button>
            )}
          </View>
          </Card>
        </ScrollView>

        <DateTimePickerModal
          visible={!!pickerState}
          mode={pickerState?.mode || "date"}
          value={pickerState?.field === "start" ? startAt : endAt}
          title={pickerState?.field === "start" ? t("eventEditor.start") : t("eventEditor.end")}
          onCancel={() => setPickerState(null)}
          onConfirm={onPickerConfirm}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    paddingBottom: 18,
  },
  editorHero: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  editorHeroIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  editorHeroTextWrap: {
    flex: 1,
  },
  editorHeroTitle: {
    fontSize: 12,
    fontWeight: "900",
  },
  editorHeroSub: {
    marginTop: 1,
    fontSize: 11,
    fontWeight: "700",
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
  actionColumn: {
    marginTop: 14,
    gap: 10,
  },
  expectedWrap: {
    marginTop: 8,
  },
  expectedSummary: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 3,
  },
  expectedSummaryText: {
    fontSize: 12,
    fontWeight: "800",
  },
  trackingCard: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
  },
  trackingHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  trackingState: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  trackingSummary: {
    fontSize: 12,
    fontWeight: "800",
  },
  trackingButton: {
    borderWidth: 1,
    borderRadius: 999,
    alignSelf: "flex-start",
    paddingVertical: 7,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  trackingButtonText: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  pressed: {
    opacity: 0.9,
  },
});
