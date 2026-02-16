import { Ionicons } from "@expo/vector-icons";
import { useContext, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { GlobalStyles, THEMES } from "../../constants/styles";
import { AuthContext } from "../../context/AuthContext";
import { CustomizationContext } from "../../context/CustomizationContext";
import { useTranslation } from "../../context/LanguageContext";
import { ThemeContext } from "../../context/ThemeContext";

function MetricCard({ icon, title, value, subtitle, styles }) {
  const colors = GlobalStyles.colors;

  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIcon}>
        <Ionicons name={icon} size={16} color={colors.textTitle} />
      </View>
      <Text style={styles.metricTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.metricValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.metricSub} numberOfLines={1}>
        {subtitle}
      </Text>
    </View>
  );
}

function InfoRow({ icon, label, value, styles }) {
  const colors = GlobalStyles.colors;

  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={15} color={colors.textMuted} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function toDisplayName(user, t) {
  if (user?.displayName) {
    return String(user.displayName);
  }

  const email = String(user?.email || "");
  if (email.includes("@")) {
    return email.split("@")[0];
  }

  return t("profile.guestName");
}

function toInitials(name) {
  const parts = String(name || "")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return "ST";
  }

  return parts.map((part) => part.slice(0, 1).toUpperCase()).join("");
}

export default function UserProfileScreen() {
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const { compactMode, largeText, reduceMotion } = useContext(CustomizationContext);
  const { language, t } = useTranslation();
  const { themeKey } = useContext(ThemeContext);

  const displayName = useMemo(() => toDisplayName(user, t), [user, t]);
  const initials = useMemo(() => toInitials(displayName), [displayName]);
  const email = user?.email || t("profile.noEmail");
  const userId = user?.uid ? String(user.uid).slice(0, 10) : t("profile.noId");
  const themeName = THEMES[themeKey]?.label || themeKey;

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

          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.heroTitle} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.heroSubtitle} numberOfLines={1}>
              {email}
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <InfoRow icon="person-outline" label={t("profile.nameLabel")} value={displayName} styles={styles} />
          <InfoRow icon="mail-outline" label={t("profile.emailLabel")} value={email} styles={styles} />
          <InfoRow icon="id-card-outline" label={t("profile.idLabel")} value={userId} styles={styles} />
          <InfoRow icon="language-outline" label={t("profile.languageLabel")} value={language.toUpperCase()} styles={styles} />
          <InfoRow icon="color-palette-outline" label={t("profile.themeLabel")} value={themeName} styles={styles} />
        </View>

        <Text style={styles.sectionTitle}>{t("profile.preferencesTitle")}</Text>
        <View style={styles.metricsWrap}>
          <MetricCard
            icon="phone-portrait-outline"
            title={t("profile.compactMode")}
            value={compactMode ? t("profile.enabled") : t("profile.disabled")}
            subtitle={t("profile.layoutDensity")}
            styles={styles}
          />
          <MetricCard
            icon="text-outline"
            title={t("profile.largeText")}
            value={largeText ? t("profile.enabled") : t("profile.disabled")}
            subtitle={t("profile.readability")}
            styles={styles}
          />
          <MetricCard
            icon="trail-sign-outline"
            title={t("profile.reduceMotion")}
            value={reduceMotion ? t("profile.enabled") : t("profile.disabled")}
            subtitle={t("profile.animations")}
            styles={styles}
          />
          <MetricCard
            icon="color-wand-outline"
            title={t("profile.themeCount")}
            value={String(Object.keys(THEMES).length)}
            subtitle={t("profile.availableThemes")}
            styles={styles}
          />
        </View>

        <Pressable
          onPress={() => navigation.navigate("Customization")}
          style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="color-palette-outline" size={16} color={colors.textTitle} />
          </View>
          <View style={styles.actionTextWrap}>
            <Text style={styles.actionTitle}>{t("profile.openCustomization")}</Text>
            <Text style={styles.actionSubtitle}>{t("profile.openCustomizationSubtitle")}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>
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
      gap: 12,
    },
    hero: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      paddingVertical: 14,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      overflow: "hidden",
      position: "relative",
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
      right: -34,
      top: -28,
    },
    heroBubbleBottom: {
      width: 62,
      height: 62,
      right: 30,
      bottom: -30,
    },
    avatarWrap: {
      width: 56,
      height: 56,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.accent35,
      backgroundColor: colors.accent18,
    },
    avatarText: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 18,
    },
    heroContent: {
      flex: 1,
    },
    heroTitle: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 17,
    },
    heroSubtitle: {
      marginTop: 2,
      color: colors.textMuted,
      fontWeight: "700",
      fontSize: 12,
    },
    infoCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      paddingVertical: 8,
      paddingHorizontal: 12,
      gap: 8,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    infoLabel: {
      minWidth: 72,
      color: colors.textMuted,
      fontWeight: "800",
      fontSize: 12,
    },
    infoValue: {
      flex: 1,
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 12,
    },
    sectionTitle: {
      color: colors.textMuted,
      fontWeight: "900",
      fontSize: 11,
      letterSpacing: 0.3,
      textTransform: "uppercase",
      marginTop: 2,
    },
    metricsWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    metricCard: {
      width: "48%",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      paddingHorizontal: 11,
      paddingVertical: 11,
    },
    metricIcon: {
      width: 32,
      height: 32,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
      marginBottom: 8,
    },
    metricTitle: {
      color: colors.textMuted,
      fontWeight: "900",
      fontSize: 11,
    },
    metricValue: {
      marginTop: 2,
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 13,
    },
    metricSub: {
      marginTop: 3,
      color: colors.textMuted,
      fontWeight: "700",
      fontSize: 11,
    },
    actionCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 6,
    },
    actionIcon: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
    },
    actionTextWrap: {
      flex: 1,
    },
    actionTitle: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 13,
    },
    actionSubtitle: {
      color: colors.textMuted,
      fontWeight: "700",
      marginTop: 2,
      fontSize: 11,
    },
    pressed: {
      opacity: 0.88,
    },
  });
}
