import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import Card from "../ui/Card";
import { GlobalStyles } from "../../constants/styles";
import { useTranslation } from "../../context/LanguageContext";
import { formatDate, formatTime, isSameDay } from "../../utils/dates";

const CATEGORY_TONE = {
  work: "accent500",
  personal: "white80",
  study: "white70",
  health: "white90",
  other: "white65",
  general: "white72",
};

function resolveCategoryTone(category, colors) {
  const key = String(category || "general").toLowerCase();
  const colorToken = CATEGORY_TONE[key] || CATEGORY_TONE.general;
  return colors[colorToken] || colors.accent500;
}

function buildScheduleLabel(event, t) {
  if (!event?.startAt || !event?.endAt) {
    return "";
  }

  if (event.allDay) {
    if (isSameDay(event.startAt, event.endAt)) {
      return t("eventEditor.allDay");
    }
    return `${t("eventEditor.allDay")} | ${formatDate(event.startAt, "dd MMM")} - ${formatDate(event.endAt, "dd MMM")}`;
  }

  if (isSameDay(event.startAt, event.endAt)) {
    return `${formatTime(event.startAt)} - ${formatTime(event.endAt)}`;
  }

  return `${formatDate(event.startAt, "dd MMM HH:mm")} - ${formatDate(event.endAt, "dd MMM HH:mm")}`;
}

function buildExpectedSummary(event, t) {
  const scheduled = Number(event?.scheduledDurationMinutes);
  const expected = Number(event?.expectedDurationMinutes);
  const lost = Number(event?.timeLostMinutes);

  if (!Number.isFinite(expected) || expected <= 0) {
    return null;
  }

  const safeScheduled = Number.isFinite(scheduled) ? scheduled : 0;
  const safeLost = Number.isFinite(lost) ? lost : safeScheduled - expected;

  return `${t("eventEditor.scheduledSummary", { minutes: safeScheduled })} | ${t("eventEditor.timeLostSummary", { minutes: safeLost })}`;
}

function buildActualSummary(event, t) {
  const trackedSeconds = Number(event?.trackedDurationSeconds);
  const startedAt = event?.timerStartedAt ? new Date(event.timerStartedAt) : null;
  const safeTrackedSeconds = Number.isFinite(trackedSeconds) ? trackedSeconds : 0;
  const runningSeconds = startedAt ? Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000)) : 0;
  const actualMinutes = Math.max(0, Math.round((safeTrackedSeconds + runningSeconds) / 60));

  const targetMinutesRaw = Number(event?.expectedDurationMinutes);
  const fallbackMinutesRaw = Number(event?.scheduledDurationMinutes);
  const targetMinutes = Number.isFinite(targetMinutesRaw) && targetMinutesRaw > 0
    ? targetMinutesRaw
    : Number.isFinite(fallbackMinutesRaw)
      ? fallbackMinutesRaw
      : null;

  if (targetMinutes === null) {
    return t("timer.actualOnly", { minutes: actualMinutes });
  }

  const diffMinutes = actualMinutes - targetMinutes;
  return t("timer.comparison", {
    actual: actualMinutes,
    planned: targetMinutes,
    diff: diffMinutes,
  });
}

export default function EventListItem({
  event,
  onPress,
  onStartTimer,
  onStopTimer,
  timerBusy = false,
  timerDisabled = false,
}) {
  const colors = GlobalStyles.colors;
  const { t } = useTranslation();
  const tone = resolveCategoryTone(event.category, colors);
  const scheduleLabel = buildScheduleLabel(event, t);
  const expectedSummary = buildExpectedSummary(event, t);
  const actualSummary = buildActualSummary(event, t);
  const isRunning = Boolean(event?.isTimerRunning);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.categoryBar, { backgroundColor: tone }]} />
          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.textTitle }]} numberOfLines={1}>
                {event.title}
              </Text>
              <View style={[styles.categoryPill, { borderColor: colors.white12, backgroundColor: colors.white08 }]}>
                <Text style={[styles.categoryText, { color: colors.textBody }]}> 
                  {event.category || "General"}
                </Text>
              </View>
            </View>

            {!!scheduleLabel && (
              <View style={[styles.timePill, { borderColor: colors.white12, backgroundColor: colors.white08 }]}>
                <Text style={[styles.time, { color: colors.textMuted }]}>{scheduleLabel}</Text>
              </View>
            )}

            {!!expectedSummary && (
              <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={2}>
                {expectedSummary}
              </Text>
            )}
            <View style={[styles.timerRow, { borderColor: colors.white12, backgroundColor: colors.white08 }]}>
              <View style={styles.timerInfo}>
                <Text style={[styles.timerLabel, { color: colors.textBody }]} numberOfLines={2}>
                  {actualSummary}
                </Text>
                <Text style={[styles.timerStatus, { color: isRunning ? colors.accent500 : colors.textMuted }]}>
                  {isRunning ? t("timer.running") : t("timer.stopped")}
                </Text>
              </View>
              {!timerDisabled && (
                <Pressable
                  disabled={timerBusy}
                  onPress={isRunning ? onStopTimer : onStartTimer}
                  style={({ pressed }) => [
                    styles.timerButton,
                    isRunning
                      ? { backgroundColor: colors.danger20, borderColor: colors.danger30 }
                      : { backgroundColor: colors.accent18, borderColor: colors.accent30 },
                    timerBusy && { opacity: 0.6 },
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name={isRunning ? "stop" : "play"}
                    size={13}
                    color={isRunning ? colors.error500 : colors.accent500}
                  />
                  <Text
                    style={[
                      styles.timerButtonText,
                      { color: isRunning ? colors.error500 : colors.accent500 },
                    ]}
                  >
                    {timerBusy ? t("timer.saving") : isRunning ? t("timer.stop") : t("timer.start")}
                  </Text>
                </Pressable>
              )}
            </View>

            {!!event.location && (
              <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
                {event.location}
              </Text>
            )}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    padding: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
  },
  categoryBar: {
    width: 5,
    borderRadius: 999,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
  },
  time: {
    fontSize: 12,
    fontWeight: "700",
  },
  timePill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  meta: {
    fontSize: 12,
    fontWeight: "700",
  },
  timerRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timerInfo: {
    flex: 1,
    gap: 2,
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: "800",
  },
  timerStatus: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  timerButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  timerButtonText: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  categoryPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  pressed: {
    opacity: 0.86,
  },
});
