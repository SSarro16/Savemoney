import React, { useContext, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ExpensesContext } from "../../store/expenses-context";
import { GlobalStyles } from "../../constants/styles";
import { CustomizationContext } from "../../store/customization-context";

const PRESETS = {
  DAYS_7: "DAYS_7",
  MONTH_1: "MONTH_1",
  YEAR_1: "YEAR_1",
};

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
function getPresetRange(preset) {
  const today = endOfDay(new Date());

  if (preset === PRESETS.DAYS_7) {
    const d = new Date(today);
    d.setDate(d.getDate() - 7);
    return { from: startOfDay(d), to: today };
  }
  if (preset === PRESETS.MONTH_1) {
    const d = new Date(today);
    d.setMonth(d.getMonth() - 1);
    return { from: startOfDay(d), to: today };
  }
  if (preset === PRESETS.YEAR_1) {
    const d = new Date(today);
    d.setFullYear(d.getFullYear() - 1);
    return { from: startOfDay(d), to: today };
  }
  return { from: null, to: null };
}

function euro(n) {
  const v = Number(n || 0);
  return `${v.toFixed(2)} €`;
}

function Chip({ label, active, onPress }) {
  const colors = GlobalStyles.colors;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        active && {
          backgroundColor: colors.accent18,
          borderColor: colors.accent35,
        },
        pressed && { opacity: 0.9 },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? colors.textTitle : colors.textBody },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Card({ title, icon, children, compactMode, highContrast }) {
  const colors = GlobalStyles.colors;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: highContrast ? colors.borderStrong : colors.border,
          padding: compactMode ? 12 : 14,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.cardIcon,
            {
              backgroundColor: colors.surface2,
              borderColor: highContrast ? colors.borderStrong : colors.border,
            },
          ]}
        >
          <Ionicons name={icon} size={16} color={colors.textTitle} />
        </View>
        <Text style={[styles.cardTitle, { color: colors.textTitle }]}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

export default function InsightsScreen() {
  const expensesCtx = useContext(ExpensesContext);
  const { compactMode, highContrast } = useContext(CustomizationContext);
  const colors = GlobalStyles.colors;

  const [preset, setPreset] = useState(PRESETS.DAYS_7);
  const range = useMemo(() => getPresetRange(preset), [preset]);

  const filtered = useMemo(() => {
    const { from, to } = range;
    return (expensesCtx.expenses || []).filter((e) => {
      const d = e.date instanceof Date ? e.date : new Date(e.date);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [expensesCtx.expenses, range]);

  const total = useMemo(
    () => filtered.reduce((sum, e) => sum + Number(e.amount || 0), 0),
    [filtered],
  );

  const byCategory = useMemo(() => {
    const map = new Map();
    for (const e of filtered) {
      const c = String(e.category || "Altro");
      map.set(c, (map.get(c) || 0) + Number(e.amount || 0));
    }
    return Array.from(map.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [filtered]);

  const byMethod = useMemo(() => {
    const map = new Map();
    for (const e of filtered) {
      const type =
        e?.methodType === "CARD" || e?.payMethod === "CARD" ? "CARD" : "CASH";
      map.set(type, (map.get(type) || 0) + Number(e.amount || 0));
    }

    return [
      { key: "CARD", label: "Carta", amount: map.get("CARD") || 0 },
      { key: "CASH", label: "Contanti", amount: map.get("CASH") || 0 },
    ];
  }, [filtered]);

  const topDescriptions = useMemo(() => {
    const map = new Map();
    for (const e of filtered) {
      const d = String(e.description || "").trim();
      if (!d) continue;
      const key = d.toLowerCase();
      map.set(key, (map.get(key) || 0) + Number(e.amount || 0));
    }
    return Array.from(map.entries())
      .map(([desc, amount]) => ({ desc, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [filtered]);

  const maxCat = byCategory[0]?.amount || 0;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.bg }]}
      contentContainerStyle={[
        styles.content,
        { padding: compactMode ? 12 : 16 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.hero,
          {
            backgroundColor: colors.surface,
            borderColor: highContrast ? colors.borderStrong : colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.heroBlob,
            styles.heroBlobTop,
            { backgroundColor: colors.accent12, borderColor: colors.accent18 },
          ]}
        />
        <View
          style={[
            styles.heroBlob,
            styles.heroBlobBottom,
            { backgroundColor: colors.accent12, borderColor: colors.accent18 },
          ]}
        />

        <View style={styles.heroTop}>
          <View
            style={[
              styles.heroIcon,
              {
                backgroundColor: colors.accent18,
                borderColor: colors.accent35,
              },
            ]}
          >
            <Ionicons name="analytics-outline" size={16} color={colors.textTitle} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: colors.textTitle }]}>
              Analisi
            </Text>
            <Text style={[styles.heroSub, { color: colors.textMuted }]}>
              Capisci dove stai spendendo davvero.
            </Text>
          </View>
        </View>

        <View style={styles.chipsRow}>
          <Chip
            label="7 giorni"
            active={preset === PRESETS.DAYS_7}
            onPress={() => setPreset(PRESETS.DAYS_7)}
          />
          <Chip
            label="1 mese"
            active={preset === PRESETS.MONTH_1}
            onPress={() => setPreset(PRESETS.MONTH_1)}
          />
          <Chip
            label="1 anno"
            active={preset === PRESETS.YEAR_1}
            onPress={() => setPreset(PRESETS.YEAR_1)}
          />
        </View>
      </View>

      <View
        style={[
          styles.totalCard,
          {
            backgroundColor: colors.surface2,
            borderColor: highContrast ? colors.borderStrong : colors.border,
            padding: compactMode ? 12 : 16,
          },
        ]}
      >
        <Text style={[styles.totalLabel, { color: colors.textMuted }]}>
          Totale periodo
        </Text>
        <Text style={[styles.totalValue, { color: colors.textTitle }]}>
          {euro(total)}
        </Text>
        <Text style={[styles.totalHint, { color: colors.textFaint }]}>
          {filtered.length} spese nel periodo selezionato
        </Text>
      </View>

      <Card
        title="Per categoria"
        icon="pricetags-outline"
        compactMode={compactMode}
        highContrast={highContrast}
      >
        {!byCategory.length ? (
          <Text style={[styles.emptyText, { color: colors.textFaint }]}>
            Nessun dato in questo periodo.
          </Text>
        ) : (
          <View style={{ gap: 10, marginTop: 10 }}>
            {byCategory.map((x) => {
              const pct =
                maxCat > 0 ? Math.round((x.amount / maxCat) * 100) : 0;
              return (
                <View key={x.category} style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.rowTop}>
                      <Text
                        style={[styles.rowTitle, { color: colors.textTitle }]}
                        numberOfLines={1}
                      >
                        {x.category}
                      </Text>
                      <Text
                        style={[styles.rowValue, { color: colors.accent500 }]}
                      >
                        {euro(x.amount)}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.barTrack,
                        {
                          backgroundColor: colors.surface2,
                          borderColor: highContrast
                            ? colors.borderStrong
                            : colors.border,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${pct}%`,
                            backgroundColor: colors.accent500,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </Card>

      <Card
        title="Top spese"
        icon="trophy-outline"
        compactMode={compactMode}
        highContrast={highContrast}
      >
        {!topDescriptions.length ? (
          <Text style={[styles.emptyText, { color: colors.textFaint }]}>
            Nessun dato in questo periodo.
          </Text>
        ) : (
          <View style={{ gap: 10, marginTop: 10 }}>
            {topDescriptions.map((x) => (
              <View key={x.desc} style={styles.topRow}>
                <Text
                  style={[styles.topText, { color: colors.textTitle }]}
                  numberOfLines={1}
                >
                  {x.desc}
                </Text>
                <Text style={[styles.topValue, { color: colors.textBody }]}>
                  {euro(x.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      <Card
        title="Per metodo"
        icon="card-outline"
        compactMode={compactMode}
        highContrast={highContrast}
      >
        <View style={{ gap: 10, marginTop: 10 }}>
          {byMethod.map((x) => (
            <View key={x.key} style={styles.topRow}>
              <Text style={[styles.topText, { color: colors.textTitle }]}>
                {x.label}
              </Text>
              <Text style={[styles.topValue, { color: colors.textBody }]}>
                {euro(x.amount)}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingBottom: 28 },

  hero: {
    marginBottom: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    overflow: "hidden",
  },
  heroBlob: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
  },
  heroBlobTop: { width: 100, height: 100, right: -24, top: -26 },
  heroBlobBottom: { width: 62, height: 62, right: 34, bottom: -24 },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  heroIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: { fontWeight: "900", fontSize: 22 },
  heroSub: { marginTop: 4, fontWeight: "700" },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontWeight: "900", fontSize: 12 },

  totalCard: { borderRadius: 18, borderWidth: 1, marginBottom: 12 },
  totalLabel: { fontWeight: "900", fontSize: 12 },
  totalValue: { marginTop: 6, fontWeight: "900", fontSize: 26 },
  totalHint: { marginTop: 6, fontWeight: "700" },

  card: { borderRadius: 18, borderWidth: 1, marginTop: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontWeight: "900", fontSize: 14 },

  emptyText: { marginTop: 10, fontWeight: "700" },

  row: { flexDirection: "row", alignItems: "center" },
  rowTop: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  rowTitle: { fontWeight: "900", flex: 1 },
  rowValue: { fontWeight: "900" },

  barTrack: {
    marginTop: 8,
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
  },
  barFill: { height: "100%", borderRadius: 999 },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  topText: { fontWeight: "800", flex: 1 },
  topValue: { fontWeight: "900" },
});
