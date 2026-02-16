import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
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
import { getEventsByRange } from "../../services/eventsService";
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
  };
}

export default function PlannerScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const colors = GlobalStyles.colors;
  const { user } = useContext(AuthContext);
  const { compactMode, textScale } = useContext(CustomizationContext);
  const { t, language } = useTranslation();

  const [viewMode, setViewMode] = useState("week");
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [weekPagerWidth, setWeekPagerWidth] = useState(0);
  const weekPagerRef = useRef(null);
  const weekOffsets = useMemo(
    () =>
      Array.from(
        { length: WEEK_PAGER_WINDOW * 2 + 1 },
        (_item, index) => index - WEEK_PAGER_WINDOW,
      ),
    [],
  );
  const anchorWeekStart = useMemo(() => startOfWeek(startOfDay(new Date())), []);

  const range = useMemo(() => getRange(viewMode, selectedDate), [selectedDate, viewMode]);
  const rangeStartMs = range.start.getTime();
  const rangeEndMs = range.end.getTime();

  const loadEvents = useCallback(async () => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const items = await getEventsByRange(user.uid, new Date(rangeStartMs), new Date(rangeEndMs));
      setEvents(items);
    } catch (loadError) {
      setError(loadError.message || "Unable to load events.");
    } finally {
      setIsLoading(false);
    }
  }, [rangeEndMs, rangeStartMs, user?.uid]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useFocusEffect(
    useCallback(() => {
      loadEvents();
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
  const isTodaySelected = isSameDay(selectedDate, new Date());
  const selectedDateLabel =
    viewMode === "week"
      ? formatWeekRangeLabel(selectedDate)
      : formatDate(selectedDate, "EEEE, d MMMM");

  const monthRows = monthWeeks.length || 5;
  const monthCalendarHeight =
    (compactMode ? 56 : 62) * monthRows + (compactMode ? 94 : 108);
  const calendarHeight = viewMode === "month" ? monthCalendarHeight : compactMode ? 136 : 156;
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

    weekPagerRef.current.scrollToIndex({
      index: selectedWeekPageIndex,
      animated: true,
      viewPosition: 0.5,
    });
  }, [selectedWeekPageIndex, viewMode, weekPagerWidth]);

  const onWeekPagerMomentumEnd = (event) => {
    if (!weekPagerWidth) {
      return;
    }

    const rawIndex = Math.round(event.nativeEvent.contentOffset.x / weekPagerWidth);
    const nextIndex = clamp(rawIndex, 0, weekOffsets.length - 1);
    const weekOffset = weekOffsets[nextIndex];
    const weekStart = startOfDay(shiftDays(anchorWeekStart, weekOffset * DAYS_IN_WEEK));
    const nextDate = startOfDay(shiftDays(weekStart, selectedWeekdayOffset));

    if (!isSameDay(nextDate, selectedDate)) {
      setSelectedDate(nextDate);
    }
  };

  const openEditEditor = (event) => {
    navigation.navigate("EventEditor", {
      mode: "edit",
      eventId: event.id,
      initialEvent: serializeEvent(event),
    });
  };

  if (isLoading) {
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
        <View style={styles.mottoRow}>
          <View style={[styles.mottoChip, { borderColor: colors.white10, backgroundColor: colors.surface }]}>
            <Ionicons name="hourglass-outline" size={14} color={colors.accent500} />
            <Text style={[styles.mottoText, { color: colors.textMuted }]}>{t("common.motto")}</Text>
          </View>
        </View>

        <View style={[styles.toggleWrap, { marginBottom: compactMode ? 8 : 10 }]}>
          <ViewToggle value={viewMode} onChange={setViewMode} />
        </View>

        <View style={styles.datePickerWrap}>
          <Text style={[styles.datePickerLabel, { color: colors.textMuted }]}>
            {t("planner.dateLabel")}
          </Text>
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
        </View>

        <View style={styles.todayRow}>
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
        </View>
      </View>

      <FlatList
        style={styles.eventsList}
        data={selectedDayEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EventListItem event={item} onPress={() => openEditEditor(item)} />}
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
    marginBottom: 10,
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
  topSection: {},
  toggleWrap: {
    marginBottom: 10,
  },
  datePickerWrap: {
    marginBottom: 10,
    gap: 6,
  },
  datePickerLabel: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  datePickerField: {
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
  todayRow: {
    marginBottom: 10,
    alignItems: "flex-end",
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
    marginBottom: 14,
    padding: 8,
  },
  monthWrap: {
    flex: 1,
  },
  monthNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  monthNavButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  monthHeaderText: {
    fontSize: 17,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  monthWeekHeaderRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  monthWeekHeaderCell: {
    flex: 1,
    alignItems: "center",
  },
  monthWeekHeaderText: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  monthGrid: {
    flex: 1,
    gap: 6,
  },
  monthWeekRow: {
    flexDirection: "row",
    gap: 6,
  },
  monthDayCell: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    gap: 1,
  },
  monthDayNumber: {
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 22,
  },
  monthOutsideHint: {
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  monthDayDot: {
    marginTop: 3,
    width: 5,
    height: 5,
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
