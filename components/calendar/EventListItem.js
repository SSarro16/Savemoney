import { Pressable, StyleSheet, Text, View } from "react-native";

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

export default function EventListItem({ event, onPress }) {
  const colors = GlobalStyles.colors;
  const { t } = useTranslation();
  const tone = resolveCategoryTone(event.category, colors);
  const scheduleLabel = buildScheduleLabel(event, t);

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
