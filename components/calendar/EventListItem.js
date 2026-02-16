import { StyleSheet, Text, View } from "react-native";

import { Card } from "../ui";
import { GlobalStyles } from "../../constants/styles";
import { formatTime } from "../../utils/dates";

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

export default function EventListItem({ event }) {
  const colors = GlobalStyles.colors;
  const tone = resolveCategoryTone(event.category, colors);

  return (
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

          <Text style={[styles.time, { color: colors.textMuted }]}> 
            {event.allDay
              ? "All day"
              : `${formatTime(event.startAt)} - ${formatTime(event.endAt)}`}
          </Text>

          {!!event.location && (
            <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
              {event.location}
            </Text>
          )}
        </View>
      </View>
    </Card>
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
});
