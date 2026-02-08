import React, { useContext } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemeContext } from "../../store/theme-context";
import { CustomizationContext } from "../../store/customization-context";
import { THEMES, GlobalStyles } from "../../constants/styles";

function ThemeButton({ label, icon, active, onPress, colors, styles }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.themeBtn,
        { backgroundColor: colors.white08, borderColor: colors.white10 },
        active && {
          backgroundColor: colors.accent18,
          borderColor: colors.accent35,
        },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={18} color={colors.textTitle} />
      <Text style={styles.themeBtnText}>{label}</Text>
      {active ? (
        <Ionicons name="checkmark-circle" size={18} color={colors.textTitle} />
      ) : null}
    </Pressable>
  );
}

function ToggleRow({ title, subtitle, value, onValueChange, colors, styles }) {
  return (
    <View
      style={[
        styles.toggleRow,
        { backgroundColor: colors.white06, borderColor: colors.white10 },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        {!!subtitle && <Text style={[styles.toggleSub, { color: colors.textMuted }]}>{subtitle}</Text>}
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

const THEME_GROUPS = [
  {
    title: "Temi base",
    options: [
      { key: "DARK", icon: "moon-outline" },
      { key: "LIGHT", icon: "sunny-outline" },
      { key: "BLUE", icon: "water-outline" },
      { key: "GREEN", icon: "leaf-outline" },
      { key: "RED", icon: "flame-outline" },
      { key: "YELLOW", icon: "color-filter-outline" },
    ],
  },
  {
    title: "Temi creativi",
    options: [
      { key: "PURPLE_GOLD", icon: "sparkles-outline" },
      { key: "OCEAN", icon: "planet-outline" },
      { key: "ROSE", icon: "rose-outline" },
      { key: "FOREST", icon: "flower-outline" },
      { key: "SUNSET", icon: "partly-sunny-outline" },
      { key: "SLATE", icon: "moon-outline" },
      { key: "MIDNIGHT_TEAL", icon: "color-wand-outline" },
      { key: "GRAPHITE_LIME", icon: "contrast-outline" },
      { key: "BORDEAUX", icon: "wine-outline" },
      { key: "NIGHT_COPPER", icon: "flame-outline" },
    ],
  },
];

export default function CustomizeScreen() {
  const { themeKey, setThemeKey } = useContext(ThemeContext);
  const {
    compactMode,
    highContrast,
    largeText,
    reduceMotion,
    showCategoryTag,
    showPaymentTag,
    setCompactMode,
    setHighContrast,
    setLargeText,
    setReduceMotion,
    setShowCategoryTag,
    setShowPaymentTag,
  } = useContext(CustomizationContext);

  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.primary800 }]}
      contentContainerStyle={{ padding: 16 }}
    >
      <View style={styles.hero}>
        <View style={[styles.heroBlob, styles.heroBlobTop]} />
        <View style={[styles.heroBlob, styles.heroBlobBottom]} />
        <View style={styles.heroIcon}>
          <Ionicons name="color-palette-outline" size={18} color={colors.textTitle} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Personalizza</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            Tema e preferenze UI persistenti.
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.white06, borderColor: colors.white10 },
        ]}
      >
        <Text style={[styles.section, { color: colors.textMuted }]}>Temi</Text>

        {THEME_GROUPS.map((group) => (
          <View key={group.title} style={styles.groupBlock}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            {group.options.map((opt) => (
              <ThemeButton
                key={opt.key}
                label={THEMES[opt.key]?.label || opt.key}
                icon={opt.icon}
                active={themeKey === opt.key}
                onPress={() => setThemeKey(opt.key)}
                colors={colors}
                styles={styles}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={{ height: 14 }} />

      <Text style={[styles.section, { color: colors.textMuted, marginBottom: 10 }]}>
        Preferenze UI
      </Text>

      <ToggleRow
        title="Modalita compatta"
        subtitle="Riduce padding e spaziature in alcune schermate"
        value={compactMode}
        onValueChange={setCompactMode}
        colors={colors}
        styles={styles}
      />

      <ToggleRow
        title="Contrasto elevato"
        subtitle="Bordi e separatori piu evidenti"
        value={highContrast}
        onValueChange={setHighContrast}
        colors={colors}
        styles={styles}
      />

      <ToggleRow
        title="Testo piu grande"
        subtitle="Aumenta dimensioni testo e header"
        value={largeText}
        onValueChange={setLargeText}
        colors={colors}
        styles={styles}
      />

      <ToggleRow
        title="Riduci animazioni"
        subtitle="Riduce animazioni su modal e sheet"
        value={reduceMotion}
        onValueChange={setReduceMotion}
        colors={colors}
        styles={styles}
      />

      <ToggleRow
        title="Mostra categoria nelle spese"
        subtitle="Visualizza tag categoria su ogni riga spesa"
        value={showCategoryTag}
        onValueChange={setShowCategoryTag}
        colors={colors}
        styles={styles}
      />

      <ToggleRow
        title="Mostra metodo pagamento"
        subtitle="Visualizza Carta/Contanti nella lista spese"
        value={showPaymentTag}
        onValueChange={setShowPaymentTag}
        colors={colors}
        styles={styles}
      />

      <View
        style={[
          styles.preview,
          { backgroundColor: colors.white06, borderColor: colors.white10 },
        ]}
      >
        <Text style={styles.previewTitle}>Anteprima</Text>
        <View style={styles.swatches}>
          <View style={[styles.dot, { backgroundColor: colors.primary800 }]} />
          <View style={[styles.dot, { backgroundColor: colors.primary500 }]} />
          <View style={[styles.dot, { backgroundColor: colors.primary200 }]} />
          <View style={[styles.dot, { backgroundColor: colors.accent500 }]} />
        </View>
      </View>
    </ScrollView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1 },
    hero: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      padding: 12,
      marginBottom: 6,
      overflow: "hidden",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    heroBlob: {
      position: "absolute",
      borderRadius: 999,
      backgroundColor: colors.accent12,
      borderWidth: 1,
      borderColor: colors.accent18,
    },
    heroBlobTop: { width: 100, height: 100, right: -22, top: -22 },
    heroBlobBottom: { width: 56, height: 56, right: 28, bottom: -24 },
    heroIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.accent35,
      backgroundColor: colors.accent18,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { color: colors.textTitle, fontWeight: "900", fontSize: 26 },
    sub: { marginTop: 6, fontWeight: "700" },

    card: { marginTop: 16, borderRadius: 18, padding: 14, borderWidth: 1 },
    section: {
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      fontSize: 12,
    },
    groupBlock: { marginTop: 10 },
    groupTitle: {
      color: colors.textMuted,
      fontWeight: "800",
      fontSize: 12,
      marginBottom: 2,
      textTransform: "uppercase",
      letterSpacing: 0.2,
    },

    themeBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 14,
      borderWidth: 1,
      marginTop: 10,
      justifyContent: "space-between",
    },
    themeBtnText: { color: colors.textTitle, fontWeight: "900", flex: 1 },
    pressed: { opacity: 0.85 },

    toggleRow: {
      borderRadius: 18,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderWidth: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 10,
    },
    toggleTitle: { color: colors.textTitle, fontWeight: "900" },
    toggleSub: { marginTop: 3, fontWeight: "700", fontSize: 12 },

    preview: { marginTop: 14, borderRadius: 18, padding: 14, borderWidth: 1 },
    previewTitle: { color: colors.textTitle, fontWeight: "900", marginBottom: 10 },
    swatches: { flexDirection: "row", gap: 10, alignItems: "center" },
    dot: { width: 18, height: 18, borderRadius: 999 },
  });
}
