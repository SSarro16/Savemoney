import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import EventListItem from "../../components/calendar/EventListItem";
import ViewToggle from "../../components/calendar/ViewToggle";
import Card from "../../components/ui/Card";
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

function toDateString(date) {
  return formatDate(date, "yyyy-MM-dd");
}

function fromDateString(dateString) {
  return new Date(`${dateString}T12:00:00`);
}

function formatMonthHeader(dateValue, fallbackDate) {
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return formatDate(fallbackDate, "MMMM yyyy");
  }
  return formatDate(parsed, "MMMM yyyy");
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
  const { t } = useTranslation();

  const [viewMode, setViewMode] = useState("week");
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const markedDates = useMemo(() => {
    const marks = {};

    events.forEach((event) => {
      if (!event?.startAt || !event?.endAt) {
        return;
      }

      eachDayBetween(event.startAt, event.endAt).forEach((date) => {
        const key = toDateString(date);
        marks[key] = {
          ...(marks[key] || {}),
          marked: true,
          dotColor: colors.accent500,
        };
      });
    });

    const selectedKey = toDateString(selectedDate);
    marks[selectedKey] = {
      ...(marks[selectedKey] || {}),
      selected: true,
      selectedColor: colors.accent500,
      selectedTextColor: colors.textOnAccentStrong,
      marked: true,
      dotColor: colors.textOnAccentStrong,
    };

    return marks;
  }, [events, selectedDate, colors.accent500, colors.textOnAccentStrong]);

  const calendarTheme = useMemo(
    () => ({
      calendarBackground: colors.surface2,
      selectedDayBackgroundColor: colors.accent500,
      selectedDayTextColor: colors.textOnAccentStrong,
      todayTextColor: colors.accent500,
      dayTextColor: colors.textBody,
      monthTextColor: colors.textTitle,
      arrowColor: colors.accent500,
      textDisabledColor: colors.white35,
      textSectionTitleColor: colors.textMuted,
      textDayFontWeight: "800",
      textMonthFontWeight: "900",
      textDayHeaderFontWeight: "800",
      textMonthFontSize: 18,
      textDayHeaderFontSize: 11,
      textDayFontSize: 14,
    }),
    [colors],
  );

  const calendarDate = toDateString(selectedDate);
  const weekDays = useMemo(
    () => eachDayBetween(startOfWeek(selectedDate), endOfWeek(selectedDate), 7),
    [selectedDate],
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

  const calendarHeight = viewMode === "month" ? (compactMode ? 346 : 364) : compactMode ? 136 : 156;
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

        <IconButton icon="time-outline" size={20} color={colors.textTitle} variant="soft" />
      </View>

      <View style={[styles.topSection, { paddingHorizontal: LAYOUT.horizontalPadding }]}> 
        <View style={[styles.toggleWrap, { marginBottom: compactMode ? 8 : 10 }]}>
          <ViewToggle value={viewMode} onChange={setViewMode} />
        </View>

        <View style={styles.todayRow}>
          <Pressable
            onPress={resetToToday}
            style={[
              styles.todayButton,
              isTodaySelected
                ? { backgroundColor: colors.accent18, borderColor: colors.accent35 }
                : { backgroundColor: colors.white08, borderColor: colors.white12 },
            ]}
          >
            <Ionicons
              name="today-outline"
              size={15}
              color={isTodaySelected ? colors.accent500 : colors.textBody}
            />
            <Text
              style={[
                styles.todayButtonText,
                { color: isTodaySelected ? colors.accent500 : colors.textBody },
              ]}
            >
              {t("planner.todayButton")}
            </Text>
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
            <Calendar
              style={styles.calendarWidget}
              current={calendarDate}
              onDayPress={(day) => setSelectedDate(fromDateString(day.dateString))}
              markedDates={markedDates}
              enableSwipeMonths
              hideExtraDays={false}
              firstDay={1}
              renderHeader={(date) => (
                <Text style={[styles.monthHeaderText, { color: colors.textTitle }]}>
                  {formatMonthHeader(date, selectedDate)}
                </Text>
              )}
              theme={calendarTheme}
            />
          ) : (
            <View style={styles.dayWeekWrap}>
              <View style={styles.dayStrip}>
                {weekDays.map((date) => {
                  const isSelected = isSameDay(date, selectedDate);
                  const key = toDateString(date);
                  const dayCount = eventsByDateMap[key] || 0;

                  return (
                    <Pressable
                      key={key}
                      onPress={() => setSelectedDate(date)}
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
                        {formatDate(date, "EEE")}
                      </Text>
                      <Text
                        style={[
                          styles.dayChipDate,
                          { color: isSelected ? colors.textOnAccentStrong : colors.textBody },
                        ]}
                      >
                        {formatDate(date, "d")}
                      </Text>
                      {!!dayCount && (
                        <View
                          style={[
                            styles.dayDot,
                            { backgroundColor: isSelected ? colors.textOnAccentStrong : colors.accent500 },
                          ]}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {viewMode === "day" && (
                <Text style={[styles.dayHint, { color: colors.textMuted, fontSize: 12 * textScale }]}>
                  {t("planner.focusMode")}
                </Text>
              )}
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
  topSection: {},
  toggleWrap: {
    marginBottom: 10,
  },
  todayRow: {
    marginBottom: 10,
    alignItems: "flex-end",
  },
  todayButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: "900",
  },
  calendarCard: {
    marginBottom: 14,
    padding: 8,
  },
  calendarWidget: {
    flex: 1,
  },
  monthHeaderText: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 6,
    textTransform: "capitalize",
  },
  dayWeekWrap: {
    flex: 1,
    justifyContent: "space-between",
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
  dayDot: {
    marginTop: 6,
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  dayHint: {
    marginTop: 8,
    fontWeight: "700",
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
