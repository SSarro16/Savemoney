import { Ionicons } from "@expo/vector-icons";
import { useContext, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { GlobalStyles, THEMES } from "../../constants/styles";
import { useTranslation } from "../../context/LanguageContext";
import { ThemeContext } from "../../context/ThemeContext";

const BASE_THEMES = ["DARK", "OBSIDIAN", "LIGHT", "BLUE", "GREEN", "RED", "YELLOW", "MINT", "SAND"];
const CREATIVE_THEMES = [
  "PURPLE_GOLD",
  "OCEAN",
  "ROSE",
  "FOREST",
  "SUNSET",
  "SLATE",
  "MIDNIGHT_TEAL",
  "GRAPHITE_LIME",
  "BORDEAUX",
  "NIGHT_COPPER",
  "AURORA",
  "CHERRY_NIGHT",
];

function buildThemes(keys) {
  return keys
    .filter((key) => THEMES[key])
    .map((key) => ({
      key,
      label: THEMES[key].label,
      accent: THEMES[key].accent500,
    }));
}

function ThemeChip({ theme, selected, onPress, styles }) {
  const colors = GlobalStyles.colors;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.themeChip,
        selected ? styles.themeChipActive : styles.themeChipIdle,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.themeDot, { backgroundColor: theme.accent }]} />
      <Text style={styles.themeLabel}>{theme.label}</Text>
      {selected ? <Ionicons name="checkmark-circle" size={16} color={colors.textTitle} /> : null}
    </Pressable>
  );
}

export default function CustomizationScreen() {
  const colors = GlobalStyles.colors;
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors);
  const { themeKey, setThemeKey } = useContext(ThemeContext);
  const { t } = useTranslation();

  const baseThemes = useMemo(() => buildThemes(BASE_THEMES), []);
  const creativeThemes = useMemo(() => buildThemes(CREATIVE_THEMES), []);

  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          paddingTop: Math.max(insets.top, 10),
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
      edges={["left", "right"]}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={[styles.heroBubble, styles.heroBubbleTop]} />
          <View style={[styles.heroBubble, styles.heroBubbleBottom]} />
          <View style={styles.heroIcon}>
            <Ionicons name="color-palette-outline" size={18} color={colors.textTitle} />
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{t("customization.title")}</Text>
            <Text style={styles.heroSubtitle}>{t("customization.subtitle")}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("customization.baseThemes")}</Text>
          <View style={styles.themeList}>
            {baseThemes.map((theme) => (
              <ThemeChip
                key={theme.key}
                theme={theme}
                selected={theme.key === themeKey}
                onPress={() => setThemeKey(theme.key)}
                styles={styles}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("customization.creativeThemes")}</Text>
          <View style={styles.themeList}>
            {creativeThemes.map((theme) => (
              <ThemeChip
                key={theme.key}
                theme={theme}
                selected={theme.key === themeKey}
                onPress={() => setThemeKey(theme.key)}
                styles={styles}
              />
            ))}
          </View>
        </View>

        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>{t("customization.preview")}</Text>
          <Text style={styles.previewSubtitle}>{t("customization.previewSubtitle")}</Text>

          <View style={styles.previewHeader}>
            <View style={styles.previewBadge}>
              <Ionicons name="time-outline" size={14} color={colors.textTitle} />
            </View>
            <View style={styles.previewTextWrap}>
              <Text style={styles.previewHeading}>Savetime</Text>
              <Text style={styles.previewBody}>Il tempo e denaro</Text>
            </View>
          </View>

          <View style={styles.swatchRow}>
            <View style={[styles.swatch, { backgroundColor: colors.primary800 }]} />
            <View style={[styles.swatch, { backgroundColor: colors.primary700 }]} />
            <View style={[styles.swatch, { backgroundColor: colors.primary500 }]} />
            <View style={[styles.swatch, { backgroundColor: colors.accent500 }]} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 8,
      gap: 12,
    },
    hero: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      padding: 14,
      position: "relative",
      overflow: "hidden",
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    heroBubble: {
      position: "absolute",
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.accent18,
      backgroundColor: colors.accent12,
    },
    heroBubbleTop: {
      width: 108,
      height: 108,
      right: -30,
      top: -30,
    },
    heroBubbleBottom: {
      width: 58,
      height: 58,
      right: 35,
      bottom: -24,
    },
    heroIcon: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
    },
    heroContent: {
      flex: 1,
    },
    heroTitle: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 18,
    },
    heroSubtitle: {
      marginTop: 2,
      color: colors.textMuted,
      fontWeight: "700",
      fontSize: 12,
      lineHeight: 17,
    },
    section: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      padding: 10,
      gap: 8,
    },
    sectionTitle: {
      color: colors.textMuted,
      fontWeight: "900",
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.35,
      marginBottom: 2,
    },
    themeList: {
      gap: 8,
    },
    themeChip: {
      borderWidth: 1,
      borderRadius: 14,
      paddingVertical: 10,
      paddingHorizontal: 11,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    themeChipActive: {
      borderColor: colors.accent35,
      backgroundColor: colors.accent18,
    },
    themeChipIdle: {
      borderColor: colors.white10,
      backgroundColor: colors.surface,
    },
    themeDot: {
      width: 11,
      height: 11,
      borderRadius: 999,
    },
    themeLabel: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 12,
      flex: 1,
    },
    previewCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      padding: 12,
      gap: 8,
    },
    previewTitle: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 14,
    },
    previewSubtitle: {
      color: colors.textMuted,
      fontWeight: "700",
      fontSize: 11,
      marginTop: -1,
    },
    previewHeader: {
      marginTop: 4,
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
      paddingVertical: 10,
      paddingHorizontal: 10,
    },
    previewBadge: {
      width: 30,
      height: 30,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white08,
    },
    previewTextWrap: {
      flex: 1,
    },
    previewHeading: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 13,
    },
    previewBody: {
      color: colors.textMuted,
      fontWeight: "700",
      fontSize: 11,
      marginTop: 1,
    },
    swatchRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 2,
    },
    swatch: {
      width: 22,
      height: 22,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.white12,
    },
    pressed: {
      opacity: 0.88,
    },
  });
}
