import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, ScrollView, StyleSheet, Text as RNText } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { Button, Paragraph, Separator, TamaguiProvider, Text, XStack, YStack } from "tamagui";

import LoadingOverlay from "../../components/ui/LoadingOverlay";
import { GlobalStyles } from "../../constants/styles";
import { AuthContext } from "../../context/AuthContext";
import { useTranslation } from "../../context/LanguageContext";
import { getEventById, startEventTimer, stopEventTimer } from "../../services/eventsService";
import { formatDate, formatTime } from "../../utils/dates";

const tamaguiConfig = require("../../tamagui.config");

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

  return {
    ...event,
    startAt: event.startAt?.toISOString?.() || null,
    endAt: event.endAt?.toISOString?.() || null,
    timerStartedAt: event.timerStartedAt?.toISOString?.() || null,
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
          toValue: 1.04,
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
        <RNText style={{ color: colors.error500, textAlign: "center", marginTop: 24 }}>
          {loadError || t("eventDetail.loadError")}
        </RNText>
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
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        <YStack f={1} backgroundColor={colors.bg}>
          <XStack
            ai="center"
            jc="space-between"
            paddingHorizontal={16}
            paddingBottom={10}
            gap={8}
          >
            <Button
              size="$3"
              backgroundColor={colors.white08}
              borderColor={colors.white12}
              borderWidth={1}
              color={colors.textTitle}
              onPress={() => navigation.goBack()}
            >
              {t("eventDetail.back")}
            </Button>
            <Text color={colors.textTitle} fontWeight="900" fontSize={17}>
              {t("eventDetail.title")}
            </Text>
            <Button
              size="$3"
              backgroundColor={colors.accent18}
              borderColor={colors.accent30}
              borderWidth={1}
              color={colors.textTitle}
              onPress={openEditorHandler}
            >
              {t("eventDetail.openEditor")}
            </Button>
          </XStack>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <YStack
              borderWidth={1}
              borderColor={colors.white12}
              backgroundColor={colors.surface}
              borderRadius={18}
              padding={14}
              gap={8}
            >
              <Text color={colors.textTitle} fontWeight="900" fontSize={24}>
                {event.title || "Untitled"}
              </Text>
              <XStack flexWrap="wrap" gap={8}>
                <YStack
                  borderWidth={1}
                  borderColor={colors.white12}
                  backgroundColor={colors.white08}
                  borderRadius={999}
                  paddingHorizontal={10}
                  paddingVertical={6}
                >
                  <Text color={colors.textBody} fontSize={11} fontWeight="800">
                    {`${t("eventDetail.date")}: ${formatDate(event.startAt, "dd MMM yyyy")}`}
                  </Text>
                </YStack>
                <YStack
                  borderWidth={1}
                  borderColor={colors.white12}
                  backgroundColor={colors.white08}
                  borderRadius={999}
                  paddingHorizontal={10}
                  paddingVertical={6}
                >
                  <Text color={colors.textBody} fontSize={11} fontWeight="800">
                    {`${t("eventDetail.timeWindow")}: ${formatTime(event.startAt)} - ${formatTime(event.endAt)}`}
                  </Text>
                </YStack>
              </XStack>
              <XStack gap={8} flexWrap="wrap">
                <YStack
                  borderWidth={1}
                  borderColor={colors.accent30}
                  backgroundColor={colors.accent12}
                  borderRadius={999}
                  paddingHorizontal={10}
                  paddingVertical={6}
                >
                  <Text color={colors.textBody} fontSize={11} fontWeight="800">
                    {`${t("eventDetail.category")}: ${event.category || "General"}`}
                  </Text>
                </YStack>
                {Array.isArray(event.tags) &&
                  event.tags.map((tag) => (
                    <YStack
                      key={String(tag)}
                      borderWidth={1}
                      borderColor={colors.white12}
                      backgroundColor={colors.white08}
                      borderRadius={999}
                      paddingHorizontal={10}
                      paddingVertical={6}
                    >
                      <Text color={colors.textBody} fontSize={11} fontWeight="800">
                        {`#${String(tag)}`}
                      </Text>
                    </YStack>
                  ))}
              </XStack>
            </YStack>

            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <YStack
                marginTop={12}
                borderWidth={1}
                borderColor={event.isTimerRunning ? colors.accent30 : colors.white12}
                backgroundColor={event.isTimerRunning ? colors.accent12 : colors.surface2}
                borderRadius={18}
                padding={16}
                gap={10}
              >
                <Text color={colors.textTitle} fontWeight="900" fontSize={16}>
                  {t("timer.detailsTitle")}
                </Text>
                <Text color={colors.textTitle} fontWeight="900" fontSize={42}>
                  {timerDurationText}
                </Text>
                <Paragraph color={colors.textMuted} fontSize={12}>
                  {`${t("eventDetail.actualTracked")}: ${Math.round(liveTrackedSeconds / 60)} min | ${t("eventDetail.expected")}: ${expectedLabel}`}
                </Paragraph>

                {isRecurringOccurrence ? (
                  <Paragraph color={colors.textMuted} fontSize={12}>
                    {t("eventDetail.timerDisabledRecurring")}
                  </Paragraph>
                ) : (
                  <Button
                    size="$4"
                    onPress={toggleTimerHandler}
                    disabled={isTimerUpdating}
                    backgroundColor={event.isTimerRunning ? colors.danger20 : colors.accent18}
                    borderColor={event.isTimerRunning ? colors.danger30 : colors.accent30}
                    borderWidth={1}
                    color={event.isTimerRunning ? colors.error500 : colors.accent500}
                    fontWeight="900"
                  >
                    {isTimerUpdating ? (
                      <ActivityIndicator size="small" color={event.isTimerRunning ? colors.error500 : colors.accent500} />
                    ) : event.isTimerRunning ? (
                      t("timer.stop")
                    ) : (
                      t("timer.start")
                    )}
                  </Button>
                )}
              </YStack>
            </Animated.View>

            <YStack
              marginTop={12}
              borderWidth={1}
              borderColor={colors.white12}
              backgroundColor={colors.surface2}
              borderRadius={18}
              padding={14}
              gap={8}
            >
              <Text color={colors.textTitle} fontWeight="900" fontSize={16}>
                {t("eventDetail.notes")}
              </Text>
              <Separator borderColor={colors.white12} />
              <Paragraph color={colors.textBody} fontSize={13}>
                {event.notes || t("eventDetail.noNotes")}
              </Paragraph>
            </YStack>

            {!!loadError && (
              <Paragraph color={colors.error500} fontWeight="800" marginTop={10}>
                {loadError}
              </Paragraph>
            )}
          </ScrollView>
        </YStack>
      </TamaguiProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});
