import { useCallback, useContext, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { DrawerActions, useFocusEffect, useNavigation } from "@react-navigation/native";

import AppLogo from "../../components/ui/AppLogo";
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
  endOfDay,
  endOfMonth,
  endOfWeek,
  formatDate,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "../../utils/dates";

const PERIOD_OPTIONS = ["week", "month", "30d"];

function toDayKey(value) {
  return formatDate(value, "yyyy-MM-dd");
}

function addDays(baseDate, days) {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + days);
  return next;
}

function getRollingRange(now, days) {
  const rangeEnd = endOfDay(now);
  const rangeStart = startOfDay(addDays(rangeEnd, -(days - 1)));
  return { start: rangeStart, end: rangeEnd };
}

function getPeriodRange(periodKey, now = new Date()) {
  if (periodKey === "month") {
    return {
      start: startOfMonth(now),
      end: endOfMonth(now),
    };
  }

  if (periodKey === "30d") {
    return getRollingRange(now, 30);
  }

  return {
    start: startOfWeek(now),
    end: endOfWeek(now),
  };
}

function eventTouchesDay(event, day) {
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);
  return event.startAt <= dayEnd && event.endAt >= dayStart;
}

function getEventActualMinutes(event, nowMs) {
  const trackedSecondsRaw = Number(event?.trackedDurationSeconds);
  const trackedSeconds = Number.isFinite(trackedSecondsRaw) ? Math.max(0, trackedSecondsRaw) : 0;
  const timerStartedAt = event?.timerStartedAt ? new Date(event.timerStartedAt) : null;
  const liveSeconds = timerStartedAt ? Math.max(0, Math.floor((nowMs - timerStartedAt.getTime()) / 1000)) : 0;
  return Math.round((trackedSeconds + liveSeconds) / 60);
}

function getEventPlannedMinutes(event) {
  const expectedRaw = Number(event?.expectedDurationMinutes);
  if (Number.isFinite(expectedRaw) && expectedRaw > 0) {
    return Math.round(expectedRaw);
  }

  const scheduledRaw = Number(event?.scheduledDurationMinutes);
  if (Number.isFinite(scheduledRaw) && scheduledRaw >= 0) {
    return Math.round(scheduledRaw);
  }

  if (event?.startAt && event?.endAt) {
    const diffMs = event.endAt.getTime() - event.startAt.getTime();
    return Math.max(0, Math.round(diffMs / (1000 * 60)));
  }

  return 0;
}

function resolveSummary(events, nowMs) {
  return events.reduce(
    (acc, event) => {
      const plannedMinutes = getEventPlannedMinutes(event);
      const actualMinutes = getEventActualMinutes(event, nowMs);
      const deltaMinutes = actualMinutes - plannedMinutes;

      acc.eventCount += 1;
      acc.plannedMinutes += plannedMinutes;
      acc.actualMinutes += actualMinutes;
      acc.deltaMinutes += deltaMinutes;
      acc.timeLostMinutes += Math.max(0, plannedMinutes - actualMinutes);
      return acc;
    },
    {
      eventCount: 0,
      plannedMinutes: 0,
      actualMinutes: 0,
      deltaMinutes: 0,
      timeLostMinutes: 0,
    },
  );
}

function resolveCategoryBreakdown(events, nowMs) {
  const map = {};

  events.forEach((event) => {
    const category = String(event?.category || "General").trim() || "General";
    if (!map[category]) {
      map[category] = {
        category,
        eventCount: 0,
        plannedMinutes: 0,
        actualMinutes: 0,
      };
    }

    map[category].eventCount += 1;
    map[category].plannedMinutes += getEventPlannedMinutes(event);
    map[category].actualMinutes += getEventActualMinutes(event, nowMs);
  });

  return Object.values(map)
    .sort((a, b) => b.actualMinutes - a.actualMinutes)
    .slice(0, 4);
}

function resolveWeeklyTrend(events, nowMs, language) {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_item, index) => addDays(today, index - 6));

  const rows = days.map((day) => {
    let plannedMinutes = 0;
    let actualMinutes = 0;
    let eventCount = 0;

    events.forEach((event) => {
      if (!eventTouchesDay(event, day)) {
        return;
      }

      eventCount += 1;
      plannedMinutes += getEventPlannedMinutes(event);
      actualMinutes += getEventActualMinutes(event, nowMs);
    });

    return {
      key: toDayKey(day),
      day,
      label: formatDate(day, language === "it" ? "EEE" : "EEE").toUpperCase(),
      plannedMinutes,
      actualMinutes,
      eventCount,
    };
  });

  const maxMinutes = rows.reduce((max, row) => Math.max(max, row.actualMinutes, row.plannedMinutes), 0);
  return {
    rows,
    maxMinutes: Math.max(maxMinutes, 1),
  };
}

export default function InsightsScreen() {
  const navigation = useNavigation();
  const colors = GlobalStyles.colors;
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);
  const { textScale } = useContext(CustomizationContext);
  const { t, language } = useTranslation();

  const [period, setPeriod] = useState("week");
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadInsights = useCallback(async () => {
    if (!user?.uid) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const range = getPeriodRange(period, new Date());
      const rangeEvents = await getEventsByRange(user.uid, range.start, range.end);
      setEvents(rangeEvents);
    } catch (loadError) {
      setError(loadError?.message || t("insights.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [period, t, user?.uid]);

  useFocusEffect(
    useCallback(() => {
      loadInsights();
      return undefined;
    }, [loadInsights]),
  );

  const openDrawer = useCallback(() => {
    const parentNavigator = navigation.getParent();
    if (parentNavigator?.openDrawer) {
      parentNavigator.openDrawer();
      return;
    }

    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  const nowMs = Date.now();
  const summary = useMemo(() => resolveSummary(events, nowMs), [events, nowMs]);
  const categories = useMemo(() => resolveCategoryBreakdown(events, nowMs), [events, nowMs]);
  const trend = useMemo(() => resolveWeeklyTrend(events, nowMs, language), [events, language, nowMs]);

  if (isLoading) {
    return <LoadingOverlay message={t("insights.loading")} />;
  }

  if (error) {
    return <ErrorOverlay message={error} onRetry={loadInsights} />;
  }

  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.bg,
          paddingTop: Math.max(insets.top, 10),
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
      edges={["left", "right"]}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <IconButton
            icon="menu"
            size={22}
            color={colors.textTitle}
            variant="soft"
            onPress={openDrawer}
          />
          <Text style={[styles.headerTitle, { color: colors.textTitle }]}>{t("insights.title")}</Text>
          <View style={[styles.headerLogoWrap, { borderColor: colors.white10, backgroundColor: colors.white08 }]}>
            <AppLogo size={22} borderRadius={8} />
          </View>
        </View>

        <Card style={[styles.hero, { backgroundColor: colors.surface }]}>
          <View style={[styles.heroAura, styles.heroAuraTop, { borderColor: colors.accent18, backgroundColor: colors.accent12 }]} />
          <View style={[styles.heroAura, styles.heroAuraBottom, { borderColor: colors.white10, backgroundColor: colors.white08 }]} />
          <View style={[styles.heroIconWrap, { borderColor: colors.white10, backgroundColor: colors.surface2 }]}>
            <Ionicons name="analytics-outline" size={17} color={colors.accent500} />
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={[styles.heroTitle, { color: colors.textTitle, fontSize: 21 * textScale }]}>{t("insights.title")}</Text>
            <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>{t("insights.subtitle")}</Text>
          </View>
        </Card>

        <Card style={[styles.periodCard, { backgroundColor: colors.surface2 }]}>
          <Text style={[styles.periodTitle, { color: colors.textMuted }]}>{t("insights.periodTitle")}</Text>
          <View style={styles.periodRow}>
            {PERIOD_OPTIONS.map((option) => {
              const selected = option === period;
              return (
                <Pressable
                  key={option}
                  onPress={() => setPeriod(option)}
                  style={[
                    styles.periodChip,
                    selected
                      ? { borderColor: colors.accent30, backgroundColor: colors.accent18 }
                      : { borderColor: colors.white10, backgroundColor: colors.white08 },
                  ]}
                >
                  <Text style={[styles.periodChipText, { color: selected ? colors.textTitle : colors.textBody }]}>
                    {t(`insights.period.${option}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <View style={styles.kpiGrid}>
          <Card style={[styles.kpiCard, { backgroundColor: colors.surface2 }]}>
            <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>{t("insights.kpi.planned")}</Text>
            <Text style={[styles.kpiValue, { color: colors.textTitle }]}>{summary.plannedMinutes}m</Text>
          </Card>

          <Card style={[styles.kpiCard, { backgroundColor: colors.surface2 }]}>
            <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>{t("insights.kpi.actual")}</Text>
            <Text style={[styles.kpiValue, { color: colors.textTitle }]}>{summary.actualMinutes}m</Text>
          </Card>

          <Card style={[styles.kpiCard, { backgroundColor: colors.surface2 }]}>
            <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>{t("insights.kpi.lost")}</Text>
            <Text style={[styles.kpiValue, { color: colors.textTitle }]}>{summary.timeLostMinutes}m</Text>
          </Card>

          <Card style={[styles.kpiCard, { backgroundColor: colors.surface2 }]}>
            <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>{t("insights.kpi.delta")}</Text>
            <Text
              style={[
                styles.kpiValue,
                { color: summary.deltaMinutes >= 0 ? colors.accent500 : colors.error500 },
              ]}
            >
              {summary.deltaMinutes >= 0 ? "+" : ""}
              {summary.deltaMinutes}m
            </Text>
          </Card>
        </View>

        <Card style={[styles.blockCard, { backgroundColor: colors.surface2 }]}>
          <Text style={[styles.blockTitle, { color: colors.textTitle }]}>{t("insights.trendTitle")}</Text>
          <Text style={[styles.blockSubtitle, { color: colors.textMuted }]}>{t("insights.trendSubtitle")}</Text>
          <View style={styles.trendRow}>
            {trend.rows.map((row) => {
              const ratio = row.actualMinutes / trend.maxMinutes;
              const barHeight = Math.max(8, Math.round(ratio * 86));
              return (
                <View key={row.key} style={styles.trendCol}>
                  <Text style={[styles.trendValue, { color: colors.textMuted }]}>{row.actualMinutes}m</Text>
                  <View style={[styles.trendBarTrack, { backgroundColor: colors.white08, borderColor: colors.white12 }]}>
                    <View style={[styles.trendBarFill, { backgroundColor: colors.accent500, height: barHeight }]} />
                  </View>
                  <Text style={[styles.trendLabel, { color: colors.textBody }]}>{row.label}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        <Card style={[styles.blockCard, { backgroundColor: colors.surface2 }]}>
          <View style={styles.blockHeaderRow}>
            <Text style={[styles.blockTitle, { color: colors.textTitle }]}>{t("insights.categoriesTitle")}</Text>
            <Text style={[styles.blockCount, { color: colors.textMuted }]}>
              {t("insights.eventsCount", { count: summary.eventCount })}
            </Text>
          </View>

          {categories.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t("insights.emptyCategories")}</Text>
          ) : (
            categories.map((item) => {
              const planned = Math.max(1, item.plannedMinutes);
              const ratio = Math.min(item.actualMinutes / planned, 1);
              return (
                <View key={item.category} style={styles.categoryRow}>
                  <View style={styles.categoryTextWrap}>
                    <Text style={[styles.categoryName, { color: colors.textTitle }]}>{item.category}</Text>
                    <Text style={[styles.categoryMeta, { color: colors.textMuted }]}>
                      {t("insights.categoryMeta", {
                        events: item.eventCount,
                        actual: item.actualMinutes,
                        planned: item.plannedMinutes,
                      })}
                    </Text>
                  </View>
                  <View style={[styles.categoryTrack, { backgroundColor: colors.white08, borderColor: colors.white12 }]}>
                    <View style={[styles.categoryFill, { width: `${Math.max(5, Math.round(ratio * 100))}%`, backgroundColor: colors.accent500 }]} />
                  </View>
                </View>
              );
            })
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  headerRow: {
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
  headerLogoWrap: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    position: "relative",
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  heroAura: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
  },
  heroAuraTop: {
    width: 112,
    height: 112,
    right: -28,
    top: -32,
  },
  heroAuraBottom: {
    width: 62,
    height: 62,
    right: 44,
    bottom: -28,
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
    fontWeight: "900",
  },
  heroSubtitle: {
    marginTop: 1,
    fontSize: 12,
    fontWeight: "700",
  },
  periodCard: {
    gap: 8,
  },
  periodTitle: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },
  periodRow: {
    flexDirection: "row",
    gap: 8,
  },
  periodChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    paddingHorizontal: 8,
  },
  periodChipText: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.25,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  kpiCard: {
    width: "48.5%",
    minHeight: 96,
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.25,
  },
  kpiValue: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 28,
  },
  blockCard: {
    gap: 8,
  },
  blockHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: "900",
  },
  blockSubtitle: {
    marginTop: -2,
    fontSize: 11,
    fontWeight: "700",
  },
  blockCount: {
    fontSize: 11,
    fontWeight: "800",
  },
  trendRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8,
  },
  trendCol: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  trendValue: {
    fontSize: 9,
    fontWeight: "800",
  },
  trendBarTrack: {
    width: "100%",
    height: 90,
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: "flex-end",
    padding: 4,
  },
  trendBarFill: {
    width: "100%",
    borderRadius: 6,
    minHeight: 4,
  },
  trendLabel: {
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  categoryRow: {
    marginTop: 6,
    gap: 6,
  },
  categoryTextWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  categoryMeta: {
    fontSize: 10,
    fontWeight: "700",
  },
  categoryTrack: {
    height: 8,
    borderWidth: 1,
    borderRadius: 999,
    overflow: "hidden",
  },
  categoryFill: {
    height: "100%",
    borderRadius: 999,
  },
  emptyText: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
  },
});
