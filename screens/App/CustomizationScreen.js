import { useContext, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import Card from "../../components/ui/Card";
import { GlobalStyles, THEMES } from "../../constants/styles";
import { CustomizationContext } from "../../context/CustomizationContext";
import { useTranslation } from "../../context/LanguageContext";
import { ThemeContext } from "../../context/ThemeContext";

function themeEntries() {
  return Object.values(THEMES).map((theme) => ({
    key: theme.key,
    label: theme.label,
    accent: theme.accent500,
  }));
}

export default function CustomizationScreen() {
  const colors = GlobalStyles.colors;
  const insets = useSafeAreaInsets();
  const { themeKey, setThemeKey } = useContext(ThemeContext);
  const { language, setLanguage, t } = useTranslation();
  const {
    compactMode,
    largeText,
    reduceMotion,
    setCompactMode,
    setLargeText,
    setReduceMotion,
  } = useContext(CustomizationContext);

  const themes = useMemo(themeEntries, []);

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
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.textTitle }]}>{t("customization.title")}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t("customization.subtitle")}</Text>

        <Card style={[styles.card, { backgroundColor: colors.surface2 }]}> 
          <Text style={[styles.sectionTitle, { color: colors.textTitle }]}>{t("customization.theme")}</Text>
          <View style={styles.themeGrid}>
            {themes.map((theme) => {
              const selected = theme.key === themeKey;
              return (
                <Pressable
                  key={theme.key}
                  onPress={() => setThemeKey(theme.key)}
                  style={[
                    styles.themeChip,
                    selected
                      ? { borderColor: colors.accent500, backgroundColor: colors.accent18 }
                      : { borderColor: colors.white12, backgroundColor: colors.white08 },
                  ]}
                >
                  <View style={[styles.dot, { backgroundColor: theme.accent }]} />
                  <Text
                    style={[
                      styles.themeLabel,
                      { color: selected ? colors.textTitle : colors.textBody },
                    ]}
                  >
                    {theme.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card style={[styles.card, { backgroundColor: colors.surface2 }]}> 
          <Text style={[styles.sectionTitle, { color: colors.textTitle }]}>{t("customization.ui")}</Text>

          <View style={styles.prefRow}>
            <Text style={[styles.prefLabel, { color: colors.textBody }]}>{t("customization.compactMode")}</Text>
            <Switch
              value={compactMode}
              onValueChange={setCompactMode}
              trackColor={{ false: colors.white20, true: colors.accent35 }}
              thumbColor={compactMode ? colors.accent500 : colors.white88}
            />
          </View>

          <View style={styles.prefRow}>
            <Text style={[styles.prefLabel, { color: colors.textBody }]}>{t("customization.largeText")}</Text>
            <Switch
              value={largeText}
              onValueChange={setLargeText}
              trackColor={{ false: colors.white20, true: colors.accent35 }}
              thumbColor={largeText ? colors.accent500 : colors.white88}
            />
          </View>

          <View style={styles.prefRow}>
            <Text style={[styles.prefLabel, { color: colors.textBody }]}>{t("customization.reduceMotion")}</Text>
            <Switch
              value={reduceMotion}
              onValueChange={setReduceMotion}
              trackColor={{ false: colors.white20, true: colors.accent35 }}
              thumbColor={reduceMotion ? colors.accent500 : colors.white88}
            />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textTitle, marginTop: 8 }]}>
            {t("customization.language")}
          </Text>
          <View style={styles.themeGrid}>
            <Pressable
              onPress={() => setLanguage("it")}
              style={[
                styles.themeChip,
                language === "it"
                  ? { borderColor: colors.accent500, backgroundColor: colors.accent18 }
                  : { borderColor: colors.white12, backgroundColor: colors.white08 },
              ]}
            >
              <Text style={[styles.themeLabel, { color: colors.textBody }]}>{t("customization.italian")}</Text>
            </Pressable>
            <Pressable
              onPress={() => setLanguage("en")}
              style={[
                styles.themeChip,
                language === "en"
                  ? { borderColor: colors.accent500, backgroundColor: colors.accent18 }
                  : { borderColor: colors.white12, backgroundColor: colors.white08 },
              ]}
            >
              <Text style={[styles.themeLabel, { color: colors.textBody }]}>{t("customization.english")}</Text>
            </Pressable>
          </View>
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
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  card: {
    padding: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 10,
  },
  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  themeChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },
  themeLabel: {
    fontSize: 12,
    fontWeight: "900",
  },
  prefRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  prefLabel: {
    fontSize: 14,
    fontWeight: "800",
  },
});
