import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { GlobalStyles } from "../../constants/styles";

function NavCard({ icon, title, subtitle, onPress, colors, styles }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.white10,
        },
        pressed && { opacity: 0.9 },
      ]}
    >
      <View style={styles.cardIcon}>
        <Ionicons name={icon} size={18} color={colors.textTitle} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSub}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
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
        <View style={styles.heroIcon}>
          <Ionicons name="settings-outline" size={18} color={colors.textTitle} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Impostazioni</Text>
          <Text style={styles.heroSub}>
            Tutte le aree di configurazione in una schermata ordinata.
          </Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Configurazione</Text>
      <View style={{ gap: 10, marginBottom: 14 }}>
        <NavCard
          icon="flash-outline"
          title="Impostazioni rapide"
          subtitle="Toggle rapidi per UX e notifiche"
          onPress={() => navigation.navigate("QuickSettings")}
          colors={colors}
          styles={styles}
        />

        <NavCard
          icon="color-palette-outline"
          title="Personalizzazione"
          subtitle="Temi e look & feel"
          onPress={() => navigation.navigate("CustomizeHome")}
          colors={colors}
          styles={styles}
        />

        <NavCard
          icon="pricetags-outline"
          title="Categorie Spese"
          subtitle="Aggiungi, modifica o elimina categorie"
          onPress={() => navigation.navigate("CategoriesManager")}
          colors={colors}
          styles={styles}
        />

        <NavCard
          icon="card-outline"
          title="Carte e Contanti"
          subtitle="Gestisci wallet e carte in uso"
          onPress={() => goDrawerScreen("Payments")}
          colors={colors}
          styles={styles}
        />

        <NavCard
          icon="repeat-outline"
          title="Abbonamenti/Abitudinali"
          subtitle="Vai alle ricorrenze e scadenze"
          onPress={() => goDrawerScreen("Recurring")}
          colors={colors}
          styles={styles}
        />

        <NavCard
          icon="cash-outline"
          title="Budget"
          subtitle="Controlla limiti e categorie budget"
          onPress={() => goDrawerScreen("Budget")}
          colors={colors}
          styles={styles}
        />

        <NavCard
          icon="flag-outline"
          title="Obiettivi"
          subtitle="Monitora i tuoi traguardi di risparmio"
          onPress={() => goDrawerScreen("Goals")}
          colors={colors}
          styles={styles}
        />
      </View>
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
    sectionLabel: {
      color: colors.textMuted,
      fontWeight: "900",
      fontSize: 12,
      letterSpacing: 0.3,
      textTransform: "uppercase",
      marginBottom: 8,
    },
    hero: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      padding: 14,
      marginBottom: 12,
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
    heroTitle: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 16,
    },
    heroSub: {
      marginTop: 2,
      color: colors.textMuted,
      fontWeight: "800",
      fontSize: 12,
    },
    card: {
      borderRadius: 16,
      borderWidth: 1,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    cardIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
    },
    cardTitle: { color: colors.textTitle, fontWeight: "900" },
    cardSub: {
      color: colors.textMuted,
      fontWeight: "700",
      marginTop: 2,
      fontSize: 12,
    },
  });
}
