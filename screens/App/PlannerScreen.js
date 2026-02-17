import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import EventListItem from "../../components/calendar/EventListItem";
import ViewToggle from "../../components/calendar/ViewToggle";
import AppLogo from "../../components/ui/AppLogo";
import Card from "../../components/ui/Card";
import DateTimePickerModal from "../../components/ui/DateTimePickerModal";
import ErrorOverlay from "../../components/ui/ErrorOverlay";
import IconButton from "../../components/ui/IconButton";
import LoadingOverlay from "../../components/ui/LoadingOverlay";
import { GlobalStyles } from "../../constants/styles";
import { AuthContext } from "../../context/AuthContext";
import { CustomizationContext } from "../../context/CustomizationContext";
import { useTranslation } from "../../context/LanguageContext";
import { getEventsByRange, startEventTimer, stopEventTimer } from "../../services/eventsService";
import {
  eachDayBetween,
  endOfDay,
  endOfMonth,
  endOfWeek,
  formatDate,
  formatWeekRangeLabel,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "../../utils/dates";

const LAYOUT = {
  horizontalPadding: 16,
  fabSize: 58,
  fabSpacing: 14,
};
const WEEKDAY_LABELS = {
  it: ["LUN", "MAR", "MER", "GIO", "VEN", "SAB", "DOM"],
  en: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
};
const MONTH_LABELS = {
  it: ["GEN", "FEB", "MAR", "APR", "MAG", "GIU", "LUG", "AGO", "SET", "OTT", "NOV", "DIC"],
  en: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
};
const DAYS_IN_WEEK = 7;
const WEEK_PAGER_WINDOW = 120;
const WEEK_PAGER_CENTER_INDEX = WEEK_PAGER_WINDOW;

function toDateString(date) {
  return formatDate(date, "yyyy-MM-dd");
}

function buildMonthWeeks(monthDate) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayBetween(gridStart, gridEnd, 42);
  const weeks = [];

  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  return weeks;
}

function isSameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function shiftDays(baseDate, days) {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + days);
  return next;
}

function diffCalendarDays(a, b) {
  const aUtc = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const bUtc = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((aUtc - bUtc) / (24 * 60 * 60 * 1000));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getWeekdayLabel(date, language) {
  const labels = WEEKDAY_LABELS[language] || WEEKDAY_LABELS.en;
  const mondayFirstIndex = (date.getDay() + 6) % DAYS_IN_WEEK;
  return labels[mondayFirstIndex];
}

function getMonthLabel(date, language) {
  const labels = MONTH_LABELS[language] || MONTH_LABELS.en;
  return labels[date.getMonth()];
}

function getRange(viewMode, selectedDate) {
  if (viewMode === "day") {
    return {
      start: startOfDay(selectedDate),
      end: endOfDay(selectedDate),
    };
  }

  if (viewMode === "month") {
    return {
      start: startOfMonth(selectedDate),
      end: endOfMonth(selectedDate),
    };
  }

  return {
    start: startOfWeek(selectedDate),
    end: endOfWeek(selectedDate),
  };
}

function isEventOnDate(event, date) {
  const selectedStart = startOfDay(date);
  const selectedEnd = endOfDay(date);
  return event.startAt <= selectedEnd && event.endAt >= selectedStart;
}

function getLiveTrackedSeconds(event, nowMs) {
  const baseTrackedSeconds = Number(event?.trackedDurationSeconds);
  const safeTrackedSeconds = Number.isFinite(baseTrackedSeconds) ? Math.max(0, baseTrackedSeconds) : 0;
  const startedAt = event?.timerStartedAt ? new Date(event.timerStartedAt) : null;

  if (!startedAt) {
    return safeTrackedSeconds;
  }

  const liveSeconds = Math.max(0, Math.floor((nowMs - startedAt.getTime()) / 1000));
  return safeTrackedSeconds + liveSeconds;
}

function serializeEvent(event) {
  return {
    id: event.id,
    title: event.title,
    startAt: event.startAt?.toISOString?.() || null,
    endAt: event.endAt?.toISOString?.() || null,
    expectedDurationMinutes: event.expectedDurationMinutes ?? null,
    allDay: Boolean(event.allDay),
    category: event.category || "General",
    notes: event.notes || "",
    location: event.location || "",
    trackedDurationSeconds: event.trackedDurationSeconds ?? 0,
    liveTrackedDurationSeconds: event.liveTrackedDurationSeconds ?? 0,
    actualDurationMinutes: event.actualDurationMinutes ?? 0,
    timerStartedAt: event.timerStartedAt?.toISOString?.() || null,
    isTimerRunning: Boolean(event.isTimerRunning),
    plannedVsActualMinutes: event.plannedVsActualMinutes ?? 0,
    expectedVsActualMinutes: event.expectedVsActualMinutes ?? null,
    recurrence: event.recurrence || null,
    parentRecurringEventId: event.parentRecurringEventId || null,
    isRecurringOccurrence: Boolean(event.isRecurringOccurrence),
    occurrenceDateKey: event.occurrenceDateKey || null,
  };
}

function buildGreeting(profile, t) {
  const firstName = String(profile?.firstName || "").trim();
  if (!firstName) {
    return t("planner.greetingNeutral");
  }

  if (profile?.gender === "female") {
    return t("planner.greetingFemale", { name: firstName });
  }

  if (profile?.gender === "male") {
    return t("planner.greetingMale", { name: firstName });
  }

  return t("planner.greetingNeutral");
}

export default function PlannerScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const colors = GlobalStyles.colors;
  const { user, profile } = useContext(AuthContext);
  const { compactMode, textScale } = useContext(CustomizationContext);
  const { t, language } = useTranslation();

  const initialToday = useMemo(() => startOfDay(new Date()), []);
  const [viewMode, setViewMode] = useState("week");
  const [selectedDate, setSelectedDate] = useState(initialToday);
  const [events, setEvents] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [timerActionEventId, setTimerActionEventId] = useState(null);
  const [liveTick, setLiveTick] = useState(Date.now());
  const [weekPagerWidth, setWeekPagerWidth] = useState(0);
  const weekPagerRef = useRef(null);
  const weekPagerIndexRef = useRef(0);
  const hasAlignedWeekPagerRef = useRef(false);
  const hasLoadedOnceRef = useRef(false);
  const eventsRequestIdRef = useRef(0);
  const weekOffsets = useMemo(
    () =>
      Array.from(
        { length: WEEK_PAGER_WINDOW * 2 + 1 },
        (_item, index) => index - WEEK_PAGER_WINDOW,
      ),
    [],
  );
  const anchorWeekStart = useMemo(() => startOfWeek(initialToday), [initialToday]);

  const range = useMemo(() => getRange(viewMode, selectedDate), [selectedDate, viewMode]);
  const rangeStartMs = range.start.getTime();
  const rangeEndMs = range.end.getTime();

  const loadEvents = useCallback(async ({ silent = false } = {}) => {
    if (!user?.uid) {
      eventsRequestIdRef.current += 1;
      hasLoadedOnceRef.current = false;
      setEvents([]);
      setError(null);
      setIsInitialLoading(false);
      return;
    }

    const requestId = eventsRequestIdRef.current + 1;
    eventsRequestIdRef.current = requestId;

    if (!silent) {
      if (!hasLoadedOnceRef.current) {
        setIsInitialLoading(true);
      }
    }

    setError(null);

    try {
      const items = await getEventsByRange(user.uid, new Date(rangeStartMs), new Date(rangeEndMs));
      if (requestId !== eventsRequestIdRef.current) {
        return;
      }
      setEvents(items);
    } catch (loadError) {
      if (requestId !== eventsRequestIdRef.current) {
        return;
      }
      setError(loadError.message || "Impossibile caricare gli eventi.");
    } finally {
      if (requestId !== eventsRequestIdRef.current) {
        return;
      }
      hasLoadedOnceRef.current = true;
      setIsInitialLoading(false);
    }
  }, [rangeEndMs, rangeStartMs, user?.uid]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useFocusEffect(
    useCallback(() => {
      if (hasLoadedOnceRef.current) {
        loadEvents({ silent: true });
      }
      return undefined;
    }, [loadEvents]),
  );

  const selectedDayEvents = useMemo(
    () =>
      events
        .filter((event) => isEventOnDate(event, selectedDate))
        .sort((a, b) => a.startAt - b.startAt),
    [events, selectedDate],
  );
  const selectedDayMetrics = useMemo(() => {
    return selectedDayEvents.reduce(
      (acc, event) => {
        const plannedRaw = Number(event?.expectedDurationMinutes);
        const fallbackRaw = Number(event?.scheduledDurationMinutes);
        const plannedMinutes = Number.isFinite(plannedRaw) && plannedRaw > 0
          ? plannedRaw
          : Number.isFinite(fallbackRaw)
            ? fallbackRaw
            : 0;

        acc.eventCount += 1;
        acc.runningCount += event?.isTimerRunning ? 1 : 0;
        acc.plannedMinutes += Math.max(0, plannedMinutes);
        acc.trackedMinutes += Math.round(getLiveTrackedSeconds(event, liveTick) / 60);
        return acc;
      },
      {
        eventCount: 0,
        runningCount: 0,
        plannedMinutes: 0,
        trackedMinutes: 0,
      },
    );
  }, [liveTick, selectedDayEvents]);

  useEffect(() => {
    const hasRunningTimer = events.some((event) => event.isTimerRunning);
    if (!hasRunningTimer) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setLiveTick(Date.now());
    }, 15000);

    return () => clearInterval(intervalId);
  }, [events]);

  const monthWeeks = useMemo(() => buildMonthWeeks(selectedDate), [selectedDate]);
  const monthWeekdayLabels = useMemo(
    () => {
      const weekStart = startOfWeek(selectedDate);
      return Array.from({ length: DAYS_IN_WEEK }, (_item, index) =>
        getWeekdayLabel(shiftDays(weekStart, index), language),
      );
    },
    [language, selectedDate],
  );
  const selectedWeekStart = useMemo(() => startOfWeek(selectedDate), [selectedDate]);
  const selectedWeekdayOffset = useMemo(
    () => diffCalendarDays(startOfDay(selectedDate), selectedWeekStart),
    [selectedDate, selectedWeekStart],
  );
  const selectedWeekOffset = useMemo(
    () => Math.trunc(diffCalendarDays(selectedWeekStart, anchorWeekStart) / DAYS_IN_WEEK),
    [anchorWeekStart, selectedWeekStart],
  );
  const selectedWeekPageIndex = useMemo(
    () =>
      clamp(
        selectedWeekOffset + WEEK_PAGER_CENTER_INDEX,
        0,
        weekOffsets.length - 1,
      ),
    [selectedWeekOffset, weekOffsets.length],
  );

  const eventsByDateMap = useMemo(() => {
    const map = {};
    events.forEach((event) => {
      eachDayBetween(event.startAt, event.endAt).forEach((day) => {
        const key = toDateString(day);
        map[key] = (map[key] || 0) + 1;
      });
    });
    return map;
  }, [events]);

  const titleLabel =
    viewMode === "week"
      ? formatWeekRangeLabel(selectedDate)
      : viewMode === "month"
        ? formatDate(selectedDate, "MMMM yyyy")
        : formatDate(selectedDate, "EEE, MMM d");

  const eventsTitle = isSameDay(selectedDate, new Date())
    ? t("planner.eventsToday")
    : formatDate(selectedDate, "EEEE, MMM d");
  const panelStatusLabel = selectedDayMetrics.runningCount > 0 ? t("planner.focusRunning") : t("planner.focusIdle");
  const eventsCountLabel = t("planner.eventsCount", { count: selectedDayMetrics.eventCount });
  const isTodaySelected = isSameDay(selectedDate, new Date());
  const selectedDateLabel =
    viewMode === "week"
      ? formatWeekRangeLabel(selectedDate)
      : formatDate(selectedDate, "EEEE, d MMMM");
  const greetingLabel = useMemo(
    () => buildGreeting(profile, t),
    [profile, t],
  );

  const monthRows = monthWeeks.length || 5;
  const isMonthView = viewMode === "month";
  const monthCalendarHeight =
    (compactMode ? 46 : 52) * monthRows + (compactMode ? 74 : 86);
  const calendarHeight = isMonthView ? monthCalendarHeight : compactMode ? 136 : 156;
  const listBottomPadding = insets.bottom + LAYOUT.fabSize + LAYOUT.fabSpacing + 18;
  const headerTopPadding = Math.max(insets.top, 8);

  const openCreateEditor = () => {
    navigation.navigate("EventEditor", {
      mode: "create",
      initialDate: selectedDate.toISOString(),
    });
  };

  const resetToToday = () => {
    setSelectedDate(startOfDay(new Date()));
  };

  const shiftMonth = (delta) => {
    const monthAnchor = startOfMonth(selectedDate);
    const nextMonth = new Date(monthAnchor);
    nextMonth.setMonth(monthAnchor.getMonth() + delta);
    setSelectedDate(startOfDay(nextMonth));
  };

  const buildWeekDaysByOffset = useCallback(
    (weekOffset) => {
      const weekStart = startOfDay(shiftDays(anchorWeekStart, weekOffset * DAYS_IN_WEEK));
      return eachDayBetween(weekStart, endOfWeek(weekStart), DAYS_IN_WEEK);
    },
    [anchorWeekStart],
  );

  useEffect(() => {
    if (viewMode === "month" || weekPagerWidth <= 0 || !weekPagerRef.current) {
      return;
    }

    if (weekPagerIndexRef.current === selectedWeekPageIndex) {
      hasAlignedWeekPagerRef.current = true;
      return;
    }

    weekPagerRef.current.scrollToIndex({
      index: selectedWeekPageIndex,
      animated: hasAlignedWeekPagerRef.current,
      viewPosition: 0.5,
    });
    weekPagerIndexRef.current = selectedWeekPageIndex;
    hasAlignedWeekPagerRef.current = true;
  }, [selectedWeekPageIndex, viewMode, weekPagerWidth]);

  const onWeekPagerMomentumEnd = (event) => {
    if (!weekPagerWidth) {
      return;
    }

    const rawIndex = Math.round(event.nativeEvent.contentOffset.x / weekPagerWidth);
    const nextIndex = clamp(rawIndex, 0, weekOffsets.length - 1);
    weekPagerIndexRef.current = nextIndex;
    const weekOffset = weekOffsets[nextIndex];
    const weekStart = startOfDay(shiftDays(anchorWeekStart, weekOffset * DAYS_IN_WEEK));
    const nextDate = startOfDay(shiftDays(weekStart, selectedWeekdayOffset));

    if (!isSameDay(nextDate, selectedDate)) {
      setSelectedDate(nextDate);
    }
  };

  const openEventDetail = (event) => {
    navigation.navigate("EventDetail", {
      eventId: event.id,
      initialEvent: serializeEvent(event),
    });
  };

  const upsertUpdatedEvent = (updatedEvent) => {
    setEvents((currentEvents) =>
      currentEvents.map((item) => (item.id === updatedEvent.id ? updatedEvent : item)),
    );
  };

  const handleStartTimer = async (event) => {
    if (!user?.uid || timerActionEventId || event?.isRecurringOccurrence) {
      return;
    }

    setTimerActionEventId(event.id);
    try {
      setActionError(null);
      const updatedEvent = await startEventTimer(user.uid, event.id);
      upsertUpdatedEvent(updatedEvent);
    } catch (timerError) {
      setActionError(timerError?.message || "Impossibile avviare il timer.");
    } finally {
      setTimerActionEventId(null);
    }
  };

  const handleStopTimer = async (event) => {
    if (!user?.uid || timerActionEventId || event?.isRecurringOccurrence) {
      return;
    }

    setTimerActionEventId(event.id);
    try {
      setActionError(null);
      const updatedEvent = await stopEventTimer(user.uid, event.id);
      upsertUpdatedEvent(updatedEvent);
    } catch (timerError) {
      setActionError(timerError?.message || "Impossibile fermare il timer.");
    } finally {
      setTimerActionEventId(null);
    }
  };

  if (isInitialLoading) {
    return <LoadingOverlay message={t("planner.loading")} />;
  }

  if (error) {
    return <ErrorOverlay message={error} onRetry={loadEvents} />;
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.bg, paddingTop: headerTopPadding }]}
      edges={["left", "right"]}
    >
      <View
        style={[
          styles.headerRow,
          {
            paddingHorizontal: LAYOUT.horizontalPadding,
            paddingBottom: compactMode ? 8 : 10,
          },
        ]}
      >
        <IconButton
          icon="menu"
          size={22}
          color={colors.textTitle}
          variant="soft"
          onPress={() => navigation.getParent()?.openDrawer()}
        />

        <Text style={[styles.headerTitle, { color: colors.textTitle, fontSize: 17 * textScale }]} numberOfLines={1}>
          {titleLabel || "Savetime"}
        </Text>

        <View style={[styles.headerLogoWrap, { borderColor: colors.white10, backgroundColor: colors.white08 }]}>
          <AppLogo size={24} borderRadius={9} />
        </View>
      </View>

      <View style={[styles.topSection, { paddingHorizontal: LAYOUT.horizontalPadding }]}>
        <Card style={[styles.heroCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.heroAura, styles.heroAuraLarge, { borderColor: colors.accent18, backgroundColor: colors.accent12 }]} />
          <View style={[styles.heroAura, styles.heroAuraSmall, { borderColor: colors.white10, backgroundColor: colors.white08 }]} />

          <View style={styles.heroTopRow}>
            <View style={[styles.heroIconWrap, { borderColor: colors.white10, backgroundColor: colors.surface2 }]}>
              <Ionicons name="time-outline" size={15} color={colors.accent500} />
            </View>
            <View style={styles.heroTextWrap}>
              <Text style={[styles.heroTitle, { color: colors.textTitle }]}>{greetingLabel}</Text>
              <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>{t("planner.homePanelSubtitle")}</Text>
            </View>
            <View style={[styles.heroStatusPill, { borderColor: colors.accent30, backgroundColor: colors.accent12 }]}>
              <Text style={[styles.heroStatusText, { color: colors.textBody }]}>{panelStatusLabel}</Text>
            </View>
          </View>

          <View style={styles.heroMetricsRow}>
            <View style={[styles.heroMetricCard, { borderColor: colors.white10, backgroundColor: colors.white08 }]}>
              <Text style={[styles.heroMetricLabel, { color: colors.textMuted }]}>{t("planner.metricEvents")}</Text>
              <Text style={[styles.heroMetricValue, { color: colors.textTitle }]}>{selectedDayMetrics.eventCount}</Text>
            </View>
            <View style={[styles.heroMetricCard, { borderColor: colors.white10, backgroundColor: colors.white08 }]}>
              <Text style={[styles.heroMetricLabel, { color: colors.textMuted }]}>{t("planner.metricPlanned")}</Text>
              <Text style={[styles.heroMetricValue, { color: colors.textTitle }]}>{selectedDayMetrics.plannedMinutes}m</Text>
            </View>
            <View style={[styles.heroMetricCard, { borderColor: colors.white10, backgroundColor: colors.white08 }]}>
              <Text style={[styles.heroMetricLabel, { color: colors.textMuted }]}>{t("planner.metricTracked")}</Text>
              <Text style={[styles.heroMetricValue, { color: colors.textTitle }]}>{selectedDayMetrics.trackedMinutes}m</Text>
            </View>
          </View>

          <View style={styles.mottoRow}>
            <View style={[styles.mottoChip, { borderColor: colors.white10, backgroundColor: colors.surface2 }]}>
              <Ionicons name="hourglass-outline" size={14} color={colors.accent500} />
              <Text style={[styles.mottoText, { color: colors.textMuted }]}>{t("common.motto")}</Text>
            </View>
          </View>
        </Card>

        <View style={[styles.controlsCard, { borderColor: colors.white10, backgroundColor: colors.white06 }]}>
          <View style={[styles.toggleWrap, { marginBottom: compactMode ? 8 : 10 }]}>
            <ViewToggle value={viewMode} onChange={setViewMode} />
          </View>

          <View style={styles.datePickerWrap}>
            <Text style={[styles.datePickerLabel, { color: colors.textMuted }]}>
              {t("planner.dateLabel")}
            </Text>
            <View style={styles.datePickerRow}>
              <Pressable
                onPress={() => setIsDatePickerOpen(true)}
                style={[
                  styles.datePickerField,
                  { backgroundColor: colors.surface, borderColor: colors.white10 },
                ]}
              >
                <Ionicons name="calendar-outline" size={16} color={colors.accent500} />
                <Text style={[styles.datePickerText, { color: colors.textTitle }]} numberOfLines={1}>
                  {selectedDateLabel}
                </Text>
                <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
              </Pressable>

              <Pressable
                onPress={resetToToday}
                accessibilityRole="button"
                accessibilityLabel={t("planner.resetToTodayA11y")}
                style={[
                  styles.todayIconButton,
                  isTodaySelected
                    ? { backgroundColor: colors.accent18, borderColor: colors.accent35 }
                    : { backgroundColor: colors.white08, borderColor: colors.white12 },
                ]}
              >
                <Ionicons
                  name="refresh-outline"
                  size={16}
                  color={isTodaySelected ? colors.accent500 : colors.textBody}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <Card
          style={[
            styles.calendarCard,
            {
              backgroundColor: colors.surface2,
              height: calendarHeight,
            },
          ]}
        >
          {viewMode === "month" ? (
            <View style={styles.monthWrap}>
              <View style={styles.monthNavRow}>
                <Pressable
                  onPress={() => shiftMonth(-1)}
                  style={({ pressed }) => [
                    styles.monthNavButton,
                    {
                      borderColor: colors.white10,
                      backgroundColor: colors.white08,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons name="chevron-back" size={16} color={colors.textBody} />
                </Pressable>
                <Text style={[styles.monthHeaderText, { color: colors.textTitle }]}>
                  {`${getMonthLabel(selectedDate, language)} ${formatDate(selectedDate, "yyyy")}`}
                </Text>
                <Pressable
                  onPress={() => shiftMonth(1)}
                  style={({ pressed }) => [
                    styles.monthNavButton,
                    {
                      borderColor: colors.white10,
                      backgroundColor: colors.white08,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons name="chevron-forward" size={16} color={colors.textBody} />
                </Pressable>
              </View>

              <View style={styles.monthWeekHeaderRow}>
                {monthWeekdayLabels.map((label, index) => (
                  <View key={`${label}-${index}`} style={styles.monthWeekHeaderCell}>
                    <Text style={[styles.monthWeekHeaderText, { color: colors.textMuted }]}>{label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.monthGrid}>
                {monthWeeks.map((week, rowIndex) => (
                  <View key={`week-${rowIndex}`} style={styles.monthWeekRow}>
                    {week.map((date) => {
                      const key = toDateString(date);
                      const isSelected = isSameDay(date, selectedDate);
                      const isCurrentMonth = isSameMonth(date, selectedDate);
                      const dayCount = eventsByDateMap[key] || 0;

                      return (
                        <Pressable
                          key={key}
                          onPress={() => setSelectedDate(startOfDay(date))}
                          style={({ pressed }) => [
                            styles.monthDayCell,
                            isSelected
                              ? { backgroundColor: colors.accent500, borderColor: colors.accent30 }
                              : {
                                  backgroundColor: isCurrentMonth ? colors.white08 : colors.white06,
                                  borderColor: colors.white10,
                                },
                            pressed && styles.pressed,
                          ]}
                        >
                          <Text
                            style={[
                              styles.monthDayNumber,
                              {
                                color: isSelected
                                  ? colors.textOnAccentStrong
                                  : isCurrentMonth
                                    ? colors.textBody
                                    : colors.textMuted,
                              },
                            ]}
                          >
                            {formatDate(date, "d")}
                          </Text>
                          {!isCurrentMonth && (
                            <Text
                              style={[
                                styles.monthOutsideHint,
                                { color: isSelected ? colors.textOnAccentStrong : colors.textMuted },
                              ]}
                            >
                              {getMonthLabel(date, language)}
                            </Text>
                          )}
                          {!!dayCount && (
                            <View
                              style={[
                                styles.monthDayDot,
                                {
                                  backgroundColor: isSelected
                                    ? colors.textOnAccentStrong
                                    : colors.accent500,
                                },
                              ]}
                            />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View
              style={styles.dayWeekWrap}
              onLayout={(event) => {
                const nextWidth = Math.round(event.nativeEvent.layout.width);
                if (nextWidth > 0 && nextWidth !== weekPagerWidth) {
                  setWeekPagerWidth(nextWidth);
                }
              }}
            >
              <FlatList
                ref={weekPagerRef}
                data={weekOffsets}
                horizontal
                pagingEnabled
                keyExtractor={(item) => `week-${item}`}
                showsHorizontalScrollIndicator={false}
                getItemLayout={
                  weekPagerWidth > 0
                    ? (_data, index) => ({
                        length: weekPagerWidth,
                        offset: weekPagerWidth * index,
                        index,
                      })
                    : undefined
                }
                onScrollToIndexFailed={() => {}}
                onMomentumScrollEnd={onWeekPagerMomentumEnd}
                renderItem={({ item }) => {
                  const weekDates = buildWeekDaysByOffset(item);

                  return (
                    <View style={[styles.weekPage, { width: weekPagerWidth || 1 }]}>
                      <View style={styles.dayStrip}>
                        {weekDates.map((date) => {
                          const isSelected = isSameDay(date, selectedDate);
                          const key = toDateString(date);
                          const dayCount = eventsByDateMap[key] || 0;

                          return (
                            <Pressable
                              key={key}
                              onPress={() => setSelectedDate(startOfDay(date))}
                              style={[
                                styles.dayChip,
                                { minHeight: compactMode ? 74 : 82 },
                                isSelected
                                  ? { backgroundColor: colors.accent500, borderColor: colors.accent30 }
                                  : { backgroundColor: colors.white08, borderColor: colors.white12 },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.dayChipLabel,
                                  { color: isSelected ? colors.textOnAccentStrong : colors.textMuted },
                                ]}
                              >
                                {getWeekdayLabel(date, language)}
                              </Text>
                              <Text
                                style={[
                                  styles.dayChipDate,
                                  { color: isSelected ? colors.textOnAccentStrong : colors.textBody },
                                ]}
                              >
                                {formatDate(date, "d")}
                              </Text>
                              {!isSameMonth(date, selectedDate) && (
                                <Text
                                  style={[
                                    styles.dayChipMonth,
                                    { color: isSelected ? colors.textOnAccentStrong : colors.textMuted },
                                  ]}
                                >
                                  {getMonthLabel(date, language)}
                                </Text>
                              )}
                              {!!dayCount && (
                                <View
                                  style={[
                                    styles.dayDot,
                                    {
                                      backgroundColor: isSelected
                                        ? colors.textOnAccentStrong
                                        : colors.accent500,
                                    },
                                  ]}
                                />
                              )}
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  );
                }}
              />
            </View>
          )}
        </Card>

        <View style={styles.eventsHeader}>
          <Text style={[styles.eventsTitle, { color: colors.textTitle, fontSize: 19 * textScale }]}>
            {eventsTitle}
          </Text>
          <Text style={[styles.eventsSubtitle, { color: colors.textMuted }]}>{eventsCountLabel}</Text>
          {!!actionError && (
            <Text style={[styles.actionErrorText, { color: colors.error500 }]} numberOfLines={2}>
              {actionError}
            </Text>
          )}
        </View>
      </View>

      {isMonthView ? (
        <ScrollView
          style={styles.eventsList}
          contentContainerStyle={[
            styles.eventsListContent,
            {
              paddingHorizontal: LAYOUT.horizontalPadding,
              paddingBottom: listBottomPadding,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {selectedDayEvents.length === 0 ? (
            <Card style={[styles.emptyCard, { backgroundColor: colors.surface2 }]}>
              <Text style={[styles.emptyText, { color: colors.textBody }]}>{t("planner.empty")}</Text>
            </Card>
          ) : (
            selectedDayEvents.map((item) => (
              <EventListItem
                key={item.id}
                event={item}
                onPress={() => openEventDetail(item)}
                onStartTimer={() => handleStartTimer(item)}
                onStopTimer={() => handleStopTimer(item)}
                timerBusy={timerActionEventId === item.id}
                timerDisabled={Boolean(item.isRecurringOccurrence)}
              />
            ))
          )}
        </ScrollView>
      ) : (
        <FlatList
          style={styles.eventsList}
          data={selectedDayEvents}
          keyExtractor={(item) => item.id}
          extraData={`${liveTick}-${timerActionEventId || ""}`}
          renderItem={({ item }) => (
            <EventListItem
              event={item}
              onPress={() => openEventDetail(item)}
              onStartTimer={() => handleStartTimer(item)}
              onStopTimer={() => handleStopTimer(item)}
              timerBusy={timerActionEventId === item.id}
              timerDisabled={Boolean(item.isRecurringOccurrence)}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.eventsListContent,
            {
              paddingHorizontal: LAYOUT.horizontalPadding,
              paddingBottom: listBottomPadding,
            },
          ]}
          ListEmptyComponent={
            <Card style={[styles.emptyCard, { backgroundColor: colors.surface2 }]}>
              <Text style={[styles.emptyText, { color: colors.textBody }]}>{t("planner.empty")}</Text>
            </Card>
          }
        />
      )}

      <Pressable
        onPress={openCreateEditor}
        style={[
          styles.fab,
          {
            backgroundColor: colors.accent500,
            borderColor: colors.accent30,
            shadowColor: colors.overlay72,
            right: LAYOUT.horizontalPadding,
            bottom: insets.bottom + LAYOUT.fabSpacing,
          },
        ]}
      >
        <Ionicons name="add" size={28} color={colors.textOnAccentStrong} />
      </Pressable>

      <DateTimePickerModal
        visible={isDatePickerOpen}
        mode="date"
        value={selectedDate}
        title={t("planner.selectDateTitle")}
        onCancel={() => setIsDatePickerOpen(false)}
        onConfirm={(date) => {
          setSelectedDate(startOfDay(date));
          setIsDatePickerOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontWeight: "900",
  },
  headerLogoWrap: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  mottoRow: {
    marginTop: 6,
  },
  mottoChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mottoText: {
    fontSize: 11,
    fontWeight: "800",
  },
  topSection: {
    gap: 10,
  },
  heroCard: {
    overflow: "hidden",
    position: "relative",
    padding: 12,
    gap: 10,
  },
  heroAura: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
  },
  heroAuraLarge: {
    width: 120,
    height: 120,
    top: -38,
    right: -32,
  },
  heroAuraSmall: {
    width: 58,
    height: 58,
    right: 44,
    top: 18,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroIconWrap: {
    width: 34,
    height: 34,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 14,
    fontWeight: "900",
  },
  heroSubtitle: {
    marginTop: 1,
    fontSize: 11,
    fontWeight: "700",
  },
  heroStatusPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  heroStatusText: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.22,
  },
  heroMetricsRow: {
    flexDirection: "row",
    gap: 8,
  },
  heroMetricCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 2,
  },
  heroMetricLabel: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.22,
  },
  heroMetricValue: {
    fontSize: 15,
    fontWeight: "900",
  },
  controlsCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 9,
    paddingHorizontal: 9,
  },
  toggleWrap: {
    marginBottom: 10,
  },
  datePickerWrap: {
    gap: 6,
  },
  datePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  datePickerLabel: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  datePickerField: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  datePickerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "900",
  },
  todayIconButton: {
    borderWidth: 1,
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarCard: {
    marginBottom: 10,
    padding: 7,
  },
  monthWrap: {
    flex: 1,
  },
  monthNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  monthNavButton: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  monthHeaderText: {
    fontSize: 15,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  monthWeekHeaderRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  monthWeekHeaderCell: {
    flex: 1,
    alignItems: "center",
  },
  monthWeekHeaderText: {
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  monthGrid: {
    flex: 1,
    gap: 4,
  },
  monthWeekRow: {
    flexDirection: "row",
    gap: 4,
  },
  monthDayCell: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    gap: 0,
  },
  monthDayNumber: {
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 18,
  },
  monthOutsideHint: {
    fontSize: 8,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  monthDayDot: {
    marginTop: 2,
    width: 4,
    height: 4,
    borderRadius: 999,
  },
  dayWeekWrap: {
    flex: 1,
    justifyContent: "flex-start",
  },
  weekPage: {
    justifyContent: "flex-start",
  },
  dayStrip: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  dayChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  dayChipLabel: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  dayChipDate: {
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 24,
  },
  dayChipMonth: {
    marginTop: 1,
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  dayDot: {
    marginTop: 6,
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  eventsHeader: {
    marginBottom: 6,
  },
  eventsTitle: {
    fontWeight: "900",
  },
  eventsSubtitle: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "800",
  },
  actionErrorText: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "800",
  },
  eventsList: {
    flex: 1,
  },
  eventsListContent: {
    flexGrow: 1,
  },
  emptyCard: {
    paddingVertical: 18,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  pressed: {
    opacity: 0.9,
  },
  fab: {
    position: "absolute",
    width: 58,
    height: 58,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 9,
  },
});
