import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { GlobalStyles } from "../../constants/styles";
import { useTranslation } from "../../store/language-context";

function NavCard({ icon, title, subtitle, onPress, accent, styles, colors }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.navCard,
        { borderColor: colors.white10, backgroundColor: colors.surface },
        pressed && { opacity: 0.9 },
      ]}
    >
      <View style={[styles.navAccent, { backgroundColor: accent }]} />
      <View style={styles.navIcon}>
        <Ionicons name={icon} size={17} color={colors.textTitle} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.navTitle}>{title}</Text>
        <Text style={styles.navSub}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
    </Pressable>
  );
}

function SectionGroup({ title, children, styles, colors }) {
  return (
    <View style={[styles.group, { borderColor: colors.white10, backgroundColor: colors.white06 }]}>
      <Text style={styles.groupTitle}>{title}</Text>
      {children}
    </View>
  );
}

function LanguageToggleCard({ language, onChange, t, styles, colors }) {
  const options = [
    {
      key: "it",
      label: t("common.italian"),
      shortLabel: "IT",
      icon: "flag-outline",
    },
    {
      key: "en",
      label: t("common.english"),
      shortLabel: "EN",
      icon: "language-outline",
    },
  ];

  return (
    <View style={styles.languageCard}>
      <View style={styles.languageHeader}>
        <View style={styles.languageIconWrap}>
          <Ionicons name="globe-outline" size={17} color={colors.textTitle} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.navTitle}>{t("settings.languageTitle")}</Text>
          <Text style={styles.navSub}>{t("settings.languageSubtitle")}</Text>
        </View>
      </View>

      <View style={styles.languageSwitchRow}>
        {options.map((option) => {
          const active = language === option.key;
          return (
            <Pressable
              key={option.key}
              onPress={() => onChange(option.key)}
              style={({ pressed }) => [
                styles.languageOption,
                active && styles.languageOptionActive,
                pressed && { opacity: 0.9 },
              ]}
            >
              <Ionicons
                name={option.icon}
                size={15}
                color={active ? colors.textTitle : colors.textMuted}
              />
              <Text
                style={[
                  styles.languageShortLabel,
                  { color: active ? colors.textTitle : colors.textMuted },
                ]}
              >
                {option.shortLabel}
              </Text>
              <Text
                style={[
                  styles.languageLabel,
                  { color: active ? colors.textTitle : colors.textMuted },
                ]}
                numberOfLines={1}
              >
                {option.label}
              </Text>
              {active ? (
                <Ionicons name="checkmark-circle" size={15} color={colors.textTitle} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function SettingsScreen({ navigation }) {
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);
  const { t, language, setLanguage } = useTranslation();

  const goDrawerScreen = (screenName) => {
    navigation.getParent()?.navigate(screenName);
  };

  const handleLanguageChange = (nextLanguage) => {
    if (nextLanguage === language) return;
    void setLanguage(nextLanguage);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={[styles.heroBubble, styles.heroBubbleTop]} />
        <View style={[styles.heroBubble, styles.heroBubbleBottom]} />
        <View style={styles.heroIcon}>
          <Ionicons name="settings-outline" size={18} color={colors.textTitle} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>{t("settings.heroTitle")}</Text>
          <Text style={styles.heroSub}>
            {t("settings.heroSubtitle")}
          </Text>
        </View>
      </View>

      <SectionGroup title={t("settings.appearanceSection")} styles={styles} colors={colors}>
        <LanguageToggleCard
          language={language}
          onChange={handleLanguageChange}
          t={t}
          styles={styles}
          colors={colors}
        />
        <NavCard
          icon="flash-outline"
          title={t("settings.quickSettingsTitle")}
          subtitle={t("settings.quickSettingsSubtitle")}
          onPress={() => navigation.navigate("QuickSettings")}
          accent={colors.accent500}
          styles={styles}
          colors={colors}
        />
        <NavCard
          icon="color-palette-outline"
          title={t("settings.customizationTitle")}
          subtitle={t("settings.customizationSubtitle")}
          onPress={() => navigation.navigate("CustomizeHome")}
          accent={colors.primary500}
          styles={styles}
          colors={colors}
        />
      </SectionGroup>

      <SectionGroup title={t("settings.dataSection")} styles={styles} colors={colors}>
        <NavCard
          icon="pricetags-outline"
          title={t("settings.categoriesTitle")}
          subtitle={t("settings.categoriesSubtitle")}
          onPress={() => navigation.navigate("CategoriesManager")}
          accent={colors.accent500}
          styles={styles}
          colors={colors}
        />
        <NavCard
          icon="card-outline"
          title={t("settings.paymentsTitle")}
          subtitle={t("settings.paymentsSubtitle")}
          onPress={() => goDrawerScreen("Payments")}
          accent={colors.primary500}
          styles={styles}
          colors={colors}
        />
      </SectionGroup>

      <SectionGroup title={t("settings.planningSection")} styles={styles} colors={colors}>
        <NavCard
          icon="repeat-outline"
          title={t("settings.recurringTitle")}
          subtitle={t("settings.recurringSubtitle")}
          onPress={() => goDrawerScreen("Recurring")}
          accent={colors.accent500}
          styles={styles}
          colors={colors}
        />
        <NavCard
          icon="cash-outline"
          title={t("settings.budgetTitle")}
          subtitle={t("settings.budgetSubtitle")}
          onPress={() => goDrawerScreen("Budget")}
          accent={colors.primary500}
          styles={styles}
          colors={colors}
        />
        <NavCard
          icon="flag-outline"
          title={t("settings.goalsTitle")}
          subtitle={t("settings.goalsSubtitle")}
          onPress={() => goDrawerScreen("Goals")}
          accent={colors.accent500}
          styles={styles}
          colors={colors}
        />
      </SectionGroup>
    </ScrollView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.primary800,
      padding: 14,
    },
    hero: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      padding: 14,
      marginBottom: 12,
      position: "relative",
      overflow: "hidden",
    },
    heroBubble: {
      position: "absolute",
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.accent18,
      backgroundColor: colors.accent12,
    },
    heroBubbleTop: { width: 104, height: 104, right: -30, top: -28 },
    heroBubbleBottom: { width: 58, height: 58, right: 34, bottom: -24 },
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
    heroTitle: { color: colors.textTitle, fontWeight: "900", fontSize: 17 },
    heroSub: {
      marginTop: 2,
      color: colors.textMuted,
      fontWeight: "700",
      fontSize: 12,
      lineHeight: 17,
    },

    group: {
      borderRadius: 18,
      borderWidth: 1,
      padding: 10,
      marginBottom: 10,
      gap: 8,
    },
    groupTitle: {
      color: colors.textMuted,
      fontWeight: "900",
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.35,
      marginBottom: 2,
    },

    navCard: {
      borderRadius: 15,
      borderWidth: 1,
      paddingVertical: 11,
      paddingHorizontal: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      overflow: "hidden",
    },
    navAccent: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      opacity: 0.9,
    },
    navIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
    },
    navTitle: { color: colors.textTitle, fontWeight: "900", fontSize: 13 },
    navSub: {
      marginTop: 2,
      color: colors.textMuted,
      fontWeight: "700",
      fontSize: 11,
      lineHeight: 16,
    },
    languageCard: {
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      padding: 10,
      marginBottom: 8,
      gap: 10,
    },
    languageHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
    },
    languageIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
    },
    languageSwitchRow: {
      flexDirection: "row",
      gap: 8,
    },
    languageOption: {
      flex: 1,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
      paddingVertical: 9,
      paddingHorizontal: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    languageOptionActive: {
      borderColor: colors.accent35,
      backgroundColor: colors.accent18,
    },
    languageShortLabel: {
      fontWeight: "900",
      fontSize: 11,
    },
    languageLabel: {
      fontWeight: "900",
      fontSize: 11,
      maxWidth: 70,
    },
  });
}
