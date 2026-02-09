import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { GlobalStyles } from "../../constants/styles";

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

export default function SettingsScreen({ navigation }) {
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);

  const goDrawerScreen = (screenName) => {
    navigation.getParent()?.navigate(screenName);
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
          <Text style={styles.heroTitle}>Control Center</Text>
          <Text style={styles.heroSub}>
            Hub unico per personalizzazione, operativita e gestione moduli.
          </Text>
        </View>
      </View>

      <SectionGroup title="Aspetto e UX" styles={styles} colors={colors}>
        <NavCard
          icon="flash-outline"
          title="Impostazioni rapide"
          subtitle="Accessibilita, notifiche e preferenze operative"
          onPress={() => navigation.navigate("QuickSettings")}
          accent={colors.accent500}
          styles={styles}
          colors={colors}
        />
        <NavCard
          icon="color-palette-outline"
          title="Personalizzazione"
          subtitle="Temi e identita visiva dell'app"
          onPress={() => navigation.navigate("CustomizeHome")}
          accent={colors.primary500}
          styles={styles}
          colors={colors}
        />
      </SectionGroup>

      <SectionGroup title="Dati e cataloghi" styles={styles} colors={colors}>
        <NavCard
          icon="pricetags-outline"
          title="Categorie Spese"
          subtitle="Aggiungi, rinomina e rimuovi categorie"
          onPress={() => navigation.navigate("CategoriesManager")}
          accent={colors.accent500}
          styles={styles}
          colors={colors}
        />
        <NavCard
          icon="card-outline"
          title="Carte e Contanti"
          subtitle="Gestione wallet e metodi di pagamento"
          onPress={() => goDrawerScreen("Payments")}
          accent={colors.primary500}
          styles={styles}
          colors={colors}
        />
      </SectionGroup>

      <SectionGroup title="Pianificazione" styles={styles} colors={colors}>
        <NavCard
          icon="repeat-outline"
          title="Abbonamenti e Abitudini"
          subtitle="Scadenze ricorrenti e azioni rapide"
          onPress={() => goDrawerScreen("Recurring")}
          accent={colors.accent500}
          styles={styles}
          colors={colors}
        />
        <NavCard
          icon="cash-outline"
          title="Budget"
          subtitle="Limiti, allocazioni e overview"
          onPress={() => goDrawerScreen("Budget")}
          accent={colors.primary500}
          styles={styles}
          colors={colors}
        />
        <NavCard
          icon="flag-outline"
          title="Obiettivi"
          subtitle="Target di risparmio e avanzamento"
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
  });
}
