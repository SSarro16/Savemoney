import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  Text,
} from "react-native-paper";

import LoadingOverlay from "../../components/ui/LoadingOverlay";
import { GlobalStyles } from "../../constants/styles";
import { AuthContext } from "../../context/AuthContext";
import { useTranslation } from "../../context/LanguageContext";
import { getEventById, startEventTimer, stopEventTimer } from "../../services/eventsService";
import { formatDate, formatTime } from "../../utils/dates";

function toSafeDate(value, fallback = null) {
  if (!value) {
    return fallback;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return parsed;
}

function normalizeEvent(rawEvent) {
  if (!rawEvent) {
    return null;
  }

  return {
    ...rawEvent,
    id: String(rawEvent.id || ""),
    title: String(rawEvent.title || "").trim(),
    notes: String(rawEvent.notes || "").trim(),
    category: String(rawEvent.category || "General").trim(),
    tags: Array.isArray(rawEvent.tags) ? rawEvent.tags : [],
    startAt: toSafeDate(rawEvent.startAt, new Date()),
    endAt: toSafeDate(rawEvent.endAt, toSafeDate(rawEvent.startAt, new Date())),
    timerStartedAt: toSafeDate(rawEvent.timerStartedAt, null),
    trackedDurationSeconds: Math.max(0, Number(rawEvent.trackedDurationSeconds) || 0),
    expectedDurationMinutes:
      rawEvent.expectedDurationMinutes === null || rawEvent.expectedDurationMinutes === undefined
        ? null
        : Number(rawEvent.expectedDurationMinutes),
    isTimerRunning: Boolean(rawEvent.isTimerRunning),
    isRecurringOccurrence: Boolean(rawEvent.isRecurringOccurrence),
    parentRecurringEventId: rawEvent.parentRecurringEventId || null,
    occurrenceDateKey: rawEvent.occurrenceDateKey || null,
  };
}

function serializeEventForEditor(event) {
  if (!event) {
    return null;
  }

  const recurrence =
    event?.recurrence && typeof event.recurrence === "object"
      ? {
          ...event.recurrence,
          untilAt: event.recurrence.untilAt?.toISOString?.() || null,
        }
      : null;

  return {
    id: event.id,
    title: event.title || "",
    allDay: Boolean(event.allDay),
    category: event.category || "General",
    expectedDurationMinutes: event.expectedDurationMinutes ?? null,
    notes: event.notes || "",
    location: event.location || "",
    startAt: event.startAt?.toISOString?.() || null,
    endAt: event.endAt?.toISOString?.() || null,
    trackedDurationSeconds: event.trackedDurationSeconds ?? 0,
    timerStartedAt: event.timerStartedAt?.toISOString?.() || null,
    isTimerRunning: Boolean(event.isTimerRunning),
    recurrence,
    parentRecurringEventId: event.parentRecurringEventId || null,
    isRecurringOccurrence: Boolean(event.isRecurringOccurrence),
    occurrenceDateKey: event.occurrenceDateKey || null,
  };
}

function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export default function EventDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const colors = GlobalStyles.colors;
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();

  const routeEventId = String(route.params?.eventId || "").trim();
  const initialEvent = useMemo(
    () => normalizeEvent(route.params?.initialEvent || null),
    [route.params?.initialEvent],
  );

  const [event, setEvent] = useState(initialEvent);
  const [isLoading, setIsLoading] = useState(!initialEvent && !!routeEventId);
  const [isTimerUpdating, setIsTimerUpdating] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [tickNow, setTickNow] = useState(Date.now());
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isRecurringOccurrence = Boolean(event?.isRecurringOccurrence);
  const eventDocId = useMemo(() => {
    if (isRecurringOccurrence) {
      return String(event?.parentRecurringEventId || "").trim();
    }
    return routeEventId || String(event?.id || "").trim();
  }, [event?.id, event?.parentRecurringEventId, isRecurringOccurrence, routeEventId]);

  const liveTrackedSeconds = useMemo(() => {
    const baseSeconds = Math.max(0, Number(event?.trackedDurationSeconds) || 0);
    if (!event?.isTimerRunning || !event?.timerStartedAt) {
      return baseSeconds;
    }

    const delta = Math.max(0, Math.floor((tickNow - event.timerStartedAt.getTime()) / 1000));
    return baseSeconds + delta;
  }, [event?.isTimerRunning, event?.timerStartedAt, event?.trackedDurationSeconds, tickNow]);

  useEffect(() => {
    if (!event?.isTimerRunning) {
      pulseAnim.setValue(1);
      return undefined;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();

    return () => {
      loop.stop();
      pulseAnim.setValue(1);
    };
  }, [event?.isTimerRunning, pulseAnim]);

  useEffect(() => {
    if (!event?.isTimerRunning) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setTickNow(Date.now());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [event?.isTimerRunning]);

  const loadEvent = useCallback(async () => {
    if (!user?.uid || !eventDocId || isRecurringOccurrence) {
      setIsLoading(false);
      return;
    }

    setLoadError(null);
    setIsLoading(true);

    try {
      const fetched = await getEventById(user.uid, eventDocId);
      setEvent(normalizeEvent(fetched));
    } catch (error) {
      setLoadError(error?.message || t("eventDetail.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [eventDocId, isRecurringOccurrence, t, user?.uid]);

  useFocusEffect(
    useCallback(() => {
      if (!isRecurringOccurrence && eventDocId) {
        loadEvent();
      }
      return undefined;
    }, [eventDocId, isRecurringOccurrence, loadEvent]),
  );

  const toggleTimerHandler = async () => {
    if (!user?.uid || !eventDocId || !event || isRecurringOccurrence || isTimerUpdating) {
      return;
    }

    setIsTimerUpdating(true);
    setLoadError(null);

    try {
      const updatedEvent = event.isTimerRunning
        ? await stopEventTimer(user.uid, eventDocId)
        : await startEventTimer(user.uid, eventDocId);

      setEvent(normalizeEvent(updatedEvent));
      setTickNow(Date.now());
    } catch (error) {
      setLoadError(error?.message || t("errors.somethingWrong"));
    } finally {
      setIsTimerUpdating(false);
    }
  };

  const openEditorHandler = () => {
    if (!event) {
      return;
    }

    navigation.navigate("EventEditor", {
      mode: "edit",
      eventId: event.id,
      initialEvent: serializeEventForEditor(event),
      parentRecurringEventId: event.parentRecurringEventId || null,
      occurrenceDateKey: event.occurrenceDateKey || null,
    });
  };

  if (isLoading) {
    return <LoadingOverlay message={t("planner.loading")} />;
  }

  if (!event) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.error500, textAlign: "center", marginTop: 24 }}>
          {loadError || t("eventDetail.loadError")}
        </Text>
      </SafeAreaView>
    );
  }

  const timerDurationText = formatDuration(liveTrackedSeconds);
  const expectedMinutes = Number(event.expectedDurationMinutes);
  const expectedLabel =
    Number.isFinite(expectedMinutes) && expectedMinutes > 0
      ? `${Math.round(expectedMinutes)} min`
      : "n/a";

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.bg, paddingTop: Math.max(insets.top, 8) }]}
      edges={["left", "right"]}
    >
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <IconButton
            icon="arrow-left"
            iconColor={colors.textTitle}
            size={20}
            style={[styles.headerIconButton, { backgroundColor: colors.white08 }]}
            onPress={() => navigation.goBack()}
          />
          <Text style={[styles.headerTitle, { color: colors.textTitle }]}>
            {t("eventDetail.title")}
          </Text>
          <Button
            mode="outlined"
            onPress={openEditorHandler}
            style={[styles.headerActionButton, { borderColor: colors.accent30 }]}
            textColor={colors.textTitle}
          >
            {t("eventDetail.openEditor")}
          </Button>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Card
            mode="contained"
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.white12 }]}
          >
            <Card.Content style={styles.cardContent}>
              <Text style={[styles.eventTitle, { color: colors.textTitle }]}>
                {event.title || "Untitled"}
              </Text>
              <View style={styles.chipsRow}>
                <Chip compact style={[styles.metaChip, { backgroundColor: colors.white08 }]}>
                  {`${t("eventDetail.date")}: ${formatDate(event.startAt, "dd MMM yyyy")}`}
                </Chip>
                <Chip compact style={[styles.metaChip, { backgroundColor: colors.white08 }]}>
                  {`${formatTime(event.startAt)} - ${formatTime(event.endAt)}`}
                </Chip>
                <Chip compact style={[styles.metaChip, { backgroundColor: colors.accent12 }]}>
                  {`${t("eventDetail.category")}: ${event.category || "General"}`}
                </Chip>
              </View>
              {Array.isArray(event.tags) && event.tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {event.tags.map((tag) => (
                    <Chip
                      key={String(tag)}
                      compact
                      style={[styles.tagChip, { backgroundColor: colors.white08 }]}
                    >
                      {`#${String(tag)}`}
                    </Chip>
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>

          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Card
              mode="contained"
              style={[
                styles.card,
                styles.timerCard,
                {
                  borderColor: event.isTimerRunning ? colors.accent30 : colors.white12,
                  backgroundColor: event.isTimerRunning ? colors.accent12 : colors.surface2,
                },
              ]}
            >
              <Card.Content style={styles.cardContent}>
                <Text style={[styles.sectionTitle, { color: colors.textTitle }]}>
                  {t("timer.detailsTitle")}
                </Text>
                <Text style={[styles.timerText, { color: colors.textTitle }]}>
                  {timerDurationText}
                </Text>
                <Text style={[styles.timerMeta, { color: colors.textMuted }]}>
                  {`${t("eventDetail.actualTracked")}: ${Math.round(liveTrackedSeconds / 60)} min | ${t("eventDetail.expected")}: ${expectedLabel}`}
                </Text>

                {isRecurringOccurrence ? (
                  <Text style={[styles.timerMeta, { color: colors.textMuted }]}>
                    {t("eventDetail.timerDisabledRecurring")}
                  </Text>
                ) : (
                  <Button
                    mode="contained"
                    onPress={toggleTimerHandler}
                    disabled={isTimerUpdating}
                    style={[
                      styles.timerButton,
                      {
                        backgroundColor: event.isTimerRunning ? colors.danger20 : colors.accent18,
                      },
                    ]}
                    textColor={event.isTimerRunning ? colors.error500 : colors.accent500}
                  >
                    {isTimerUpdating ? (
                      <ActivityIndicator
                        size="small"
                        color={event.isTimerRunning ? colors.error500 : colors.accent500}
                      />
                    ) : event.isTimerRunning ? (
                      t("timer.stop")
                    ) : (
                      t("timer.start")
                    )}
                  </Button>
                )}
              </Card.Content>
            </Card>
          </Animated.View>

          <Card
            mode="contained"
            style={[styles.card, { backgroundColor: colors.surface2, borderColor: colors.white12 }]}
          >
            <Card.Content style={styles.cardContent}>
              <Text style={[styles.sectionTitle, { color: colors.textTitle }]}>
                {t("eventDetail.notes")}
              </Text>
              <Divider style={{ backgroundColor: colors.white12, marginVertical: 8 }} />
              <Text style={[styles.notesText, { color: colors.textBody }]}>
                {event.notes || t("eventDetail.noNotes")}
              </Text>
            </Card.Content>
          </Card>

          {!!loadError && (
            <Text style={[styles.errorText, { color: colors.error500 }]}>
              {loadError}
            </Text>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 6,
  },
  headerIconButton: {
    margin: 0,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "900",
  },
  headerActionButton: {
    borderRadius: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardContent: {
    gap: 8,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: "900",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaChip: {
    borderRadius: 999,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    borderRadius: 999,
  },
  timerCard: {
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
  },
  timerText: {
    fontSize: 40,
    fontWeight: "900",
  },
  timerMeta: {
    fontSize: 12,
    fontWeight: "700",
  },
  timerButton: {
    marginTop: 4,
    borderRadius: 12,
  },
  notesText: {
    fontSize: 13,
    fontWeight: "700",
  },
  errorText: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "800",
  },
});
