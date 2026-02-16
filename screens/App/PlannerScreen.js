import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Calendar,
  CalendarProvider,
  WeekCalendar,
} from "react-native-calendars";
import {
  useFocusEffect,
  useNavigation,
} from "@react-navigation/native";

import { EventListItem, ViewToggle } from "../../components/calendar";
import { Card, ErrorOverlay, IconButton, LoadingOverlay } from "../../components/ui";
import { GlobalStyles } from "../../constants/styles";
import { AuthContext } from "../../context/AuthContext";
import { getEventsByRange } from "../../services/eventsService";
import {
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

function toDateString(date) {
  return formatDate(date, "yyyy-MM-dd");
}

function fromDateString(dateString) {
  return new Date(`${dateString}T12:00:00`);
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
    allDay: Boolean(event.allDay),
    category: event.category || "General",
    notes: event.notes || "",
    location: event.location || "",
  };
}

export default function PlannerScreen() {
  const navigation = useNavigation();
  const colors = GlobalStyles.colors;
  const { user } = useContext(AuthContext);

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
      const items = await getEventsByRange(
        user.uid,
        new Date(rangeStartMs),
        new Date(rangeEndMs),
      );
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
      const key = toDateString(event.startAt);
      marks[key] = {
        ...(marks[key] || {}),
        marked: true,
        dotColor: colors.accent500,
      };
    });

    const selectedKey = toDateString(selectedDate);
    marks[selectedKey] = {
      ...(marks[selectedKey] || {}),
      selected: true,
      selectedColor: colors.accent500,
      selectedTextColor: colors.textOnAccentStrong,
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
      textDayFontWeight: "700",
      textMonthFontWeight: "900",
      textDayHeaderFontWeight: "800",
    }),
    [colors],
  );

  const calendarDate = toDateString(selectedDate);

  const titleLabel =
    viewMode === "week"
      ? formatWeekRangeLabel(selectedDate)
      : viewMode === "month"
        ? formatDate(selectedDate, "MMMM yyyy")
        : formatDate(selectedDate, "EEE, MMM d");

  const eventsTitle = isSameDay(selectedDate, new Date())
    ? "Today"
    : formatDate(selectedDate, "EEEE, MMM d");

  const openCreateEditor = () => {
    navigation.navigate("EventEditor", {
      mode: "create",
      initialDate: selectedDate.toISOString(),
    });
  };

  const openEditEditor = (event) => {
    navigation.navigate("EventEditor", {
      mode: "edit",
      eventId: event.id,
      initialEvent: serializeEvent(event),
    });
  };

  if (isLoading) {
    return <LoadingOverlay message="Loading planner..." />;
  }

  if (error) {
    return <ErrorOverlay message={error} onRetry={loadEvents} />;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={styles.headerRow}>
        <IconButton
          icon="menu"
          size={22}
          color={colors.textTitle}
          variant="soft"
          onPress={() => navigation.getParent()?.openDrawer()}
        />

        <Text style={[styles.headerTitle, { color: colors.textTitle }]} numberOfLines={1}>
          {titleLabel || "Savetime"}
        </Text>

        <IconButton icon="time-outline" size={20} color={colors.textTitle} variant="soft" />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.toggleWrap}>
          <ViewToggle value={viewMode} onChange={setViewMode} />
        </View>

        <Card style={[styles.calendarCard, { backgroundColor: colors.surface2 }]}> 
          {viewMode === "month" ? (
            <Calendar
              current={calendarDate}
              onDayPress={(day) => setSelectedDate(fromDateString(day.dateString))}
              markedDates={markedDates}
              enableSwipeMonths
              firstDay={1}
              theme={calendarTheme}
            />
          ) : (
            <CalendarProvider
              date={calendarDate}
              onDateChanged={(dateString) => setSelectedDate(fromDateString(dateString))}
            >
              <WeekCalendar
                onDayPress={(day) => setSelectedDate(fromDateString(day.dateString))}
                markedDates={markedDates}
                firstDay={1}
                theme={calendarTheme}
              />
            </CalendarProvider>
          )}

          {viewMode === "day" && (
            <Text style={[styles.dayHint, { color: colors.textMuted }]}>Focus mode for one day.</Text>
          )}
        </Card>

        <View style={styles.eventsHeader}>
          <Text style={[styles.eventsTitle, { color: colors.textTitle }]}>{eventsTitle}</Text>
        </View>

        {selectedDayEvents.length === 0 ? (
          <Card style={[styles.emptyCard, { backgroundColor: colors.surface2 }]}> 
            <Text style={[styles.emptyText, { color: colors.textBody }]}> 
              No events planned yet. Tap + to create the first one.
            </Text>
          </Card>
        ) : (
          selectedDayEvents.map((event) => (
            <EventListItem key={event.id} event={event} onPress={() => openEditEditor(event)} />
          ))
        )}
      </ScrollView>

      <Pressable
        onPress={openCreateEditor}
        style={[
          styles.fab,
          {
            backgroundColor: colors.accent500,
            borderColor: colors.accent30,
            shadowColor: colors.overlay72,
          },
        ]}
      >
        <Ionicons name="add" size={28} color={colors.textOnAccentStrong} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "900",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  toggleWrap: {
    marginBottom: 10,
  },
  calendarCard: {
    marginBottom: 14,
    padding: 10,
  },
  dayHint: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
  },
  eventsHeader: {
    marginBottom: 8,
  },
  eventsTitle: {
    fontSize: 20,
    fontWeight: "900",
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
    right: 18,
    bottom: 26,
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
