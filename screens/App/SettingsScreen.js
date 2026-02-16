import { Ionicons } from "@expo/vector-icons";
import { useContext } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import Constants from "expo-constants";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { GlobalStyles } from "../../constants/styles";
import { AuthContext } from "../../context/AuthContext";
import { CustomizationContext } from "../../context/CustomizationContext";
import { useTranslation } from "../../context/LanguageContext";

function SectionGroup({ title, children, styles }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      {children}
    </View>
  );
}

function NavCard({ icon, title, subtitle, onPress, styles }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.navCard, pressed && styles.pressed]}>
      <View style={styles.navIcon}>
        <Ionicons name={icon} size={17} color={GlobalStyles.colors.textTitle} />
      </View>
      <View style={styles.navContent}>
        <Text style={styles.navTitle}>{title}</Text>
        <Text style={styles.navSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={GlobalStyles.colors.textMuted} />
    </Pressable>
  );
}

function ToggleRow({ label, value, onChange, styles }) {
  const colors = GlobalStyles.colors;

  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.white20, true: colors.accent35 }}
        thumbColor={value ? colors.accent500 : colors.white88}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const { language, setLanguage, t } = useTranslation();
  const { compactMode, largeText, reduceMotion, setCompactMode, setLargeText, setReduceMotion } =
    useContext(CustomizationContext);

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
            <Ionicons name="settings-outline" size={18} color={colors.textTitle} />
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{t("settings.title")}</Text>
            <Text style={styles.heroSubtitle}>{t("settings.subtitle")}</Text>
          </View>
        </View>

        <SectionGroup title={t("settings.appearanceSection")} styles={styles}>
          <View style={styles.languageCard}>
            <View style={styles.languageHeader}>
              <View style={styles.languageIconWrap}>
                <Ionicons name="globe-outline" size={16} color={colors.textTitle} />
              </View>
              <View style={styles.navContent}>
                <Text style={styles.navTitle}>{t("settings.languageTitle")}</Text>
                <Text style={styles.navSubtitle}>{t("settings.languageSubtitle")}</Text>
              </View>
            </View>

            <View style={styles.languageRow}>
              <Pressable
                onPress={() => setLanguage("it")}
                style={({ pressed }) => [
                  styles.languageOption,
                  language === "it" && styles.languageOptionActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.languageText}>{t("customization.italian")}</Text>
                {language === "it" ? (
                  <Ionicons name="checkmark-circle" size={15} color={colors.textTitle} />
                ) : null}
              </Pressable>

              <Pressable
                onPress={() => setLanguage("en")}
                style={({ pressed }) => [
                  styles.languageOption,
                  language === "en" && styles.languageOptionActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.languageText}>{t("customization.english")}</Text>
                {language === "en" ? (
                  <Ionicons name="checkmark-circle" size={15} color={colors.textTitle} />
                ) : null}
              </Pressable>
            </View>
          </View>

          <ToggleRow
            label={t("customization.compactMode")}
            value={compactMode}
            onChange={setCompactMode}
            styles={styles}
          />
          <ToggleRow
            label={t("customization.largeText")}
            value={largeText}
            onChange={setLargeText}
            styles={styles}
          />
          <ToggleRow
            label={t("customization.reduceMotion")}
            value={reduceMotion}
            onChange={setReduceMotion}
            styles={styles}
          />

          <NavCard
            icon="color-palette-outline"
            title={t("settings.themeTitle")}
            subtitle={t("settings.themeSubtitle")}
            onPress={() => navigation.navigate("Customization")}
            styles={styles}
          />
        </SectionGroup>

        <SectionGroup title={t("settings.accountSection")} styles={styles}>
          <NavCard
            icon="person-circle-outline"
            title={t("settings.profileTitle")}
            subtitle={t("settings.profileSubtitle")}
            onPress={() => navigation.navigate("UserProfile")}
            styles={styles}
          />

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={16} color={colors.textMuted} />
              <Text style={styles.infoLabel}>{t("settings.email")}</Text>
              <Text style={styles.infoValue}>{user?.email || t("settings.noEmail")}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="phone-portrait-outline" size={16} color={colors.textMuted} />
              <Text style={styles.infoLabel}>{t("settings.appVersion")}</Text>
              <Text style={styles.infoValue}>{Constants.expoConfig?.version || "0.0.0"}</Text>
            </View>
          </View>
        </SectionGroup>
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
      marginBottom: 2,
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
      width: 104,
      height: 104,
      right: -28,
      top: -30,
    },
    heroBubbleBottom: {
      width: 58,
      height: 58,
      right: 32,
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
    group: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      padding: 10,
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
    languageCard: {
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      padding: 10,
      gap: 10,
    },
    languageHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
    },
    languageIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
    },
    languageRow: {
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
      paddingHorizontal: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    languageOptionActive: {
      borderColor: colors.accent35,
      backgroundColor: colors.accent18,
    },
    languageText: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 12,
    },
    toggleRow: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      paddingVertical: 10,
      paddingHorizontal: 11,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    toggleLabel: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 13,
      flexShrink: 1,
    },
    navCard: {
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      paddingVertical: 11,
      paddingHorizontal: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
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
    navContent: {
      flex: 1,
    },
    navTitle: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 13,
    },
    navSubtitle: {
      marginTop: 2,
      color: colors.textMuted,
      fontWeight: "700",
      fontSize: 11,
      lineHeight: 16,
    },
    infoCard: {
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      paddingVertical: 4,
      paddingHorizontal: 10,
      gap: 2,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 8,
    },
    infoLabel: {
      color: colors.textMuted,
      fontWeight: "800",
      fontSize: 12,
      minWidth: 72,
    },
    infoValue: {
      color: colors.textBody,
      fontWeight: "800",
      fontSize: 12,
      flex: 1,
    },
    pressed: {
      opacity: 0.88,
    },
  });
}
