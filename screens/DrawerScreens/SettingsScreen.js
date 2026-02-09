import React, { useContext } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlobalStyles } from "../../constants/styles";
import { CustomizationContext } from "../../store/customization-context";

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

function ToggleRow({ title, subtitle, value, onChange, colors, styles }) {
  return (
    <View
      style={[
        styles.toggleRow,
        { backgroundColor: colors.surface, borderColor: colors.white10 },
      ]}
    >
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.toggleSub}>{subtitle}</Text>}
      </View>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

export default function SettingsScreen({ navigation }) {
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);
  const {
    compactMode,
    largeText,
    reduceMotion,
    showCategoryTag,
    showPaymentTag,
    recurringRemindersEnabled,
    recurringReminderHour,
    budgetAlertsEnabled,
    budgetAlertAt80,
    budgetAlertAt100,
    setCompactMode,
    setLargeText,
    setReduceMotion,
    setShowCategoryTag,
    setShowPaymentTag,
    setRecurringRemindersEnabled,
    setRecurringReminderHour,
    setBudgetAlertsEnabled,
    setBudgetAlertAt80,
    setBudgetAlertAt100,
  } = useContext(CustomizationContext);

  const goDrawerScreen = (screenName) => {
    navigation.getParent()?.navigate(screenName);
  };

  const resetQuickPrefs = () => {
    setCompactMode(false);
    setLargeText(false);
    setReduceMotion(false);
    setShowCategoryTag(true);
    setShowPaymentTag(true);
    setRecurringRemindersEnabled(false);
    setRecurringReminderHour(9);
    setBudgetAlertsEnabled(false);
    setBudgetAlertAt80(true);
    setBudgetAlertAt100(true);
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
            Collegamenti rapidi e preferenze UX principali.
          </Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Navigazione rapida</Text>
      <View style={{ gap: 10, marginBottom: 14 }}>
        <NavCard
          icon="color-palette-outline"
          title="Personalizzazione"
          subtitle="Temi e preferenze UI"
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

      <Text style={styles.sectionLabel}>Impostazioni rapide</Text>

      <ToggleRow
        title="Modalita compatta"
        subtitle="Riduce spaziature e altezza dei componenti"
        value={compactMode}
        onChange={setCompactMode}
        colors={colors}
        styles={styles}
      />
      <ToggleRow
        title="Testo piu grande"
        subtitle="Aumenta la leggibilita in tutta l'app"
        value={largeText}
        onChange={setLargeText}
        colors={colors}
        styles={styles}
      />
      <ToggleRow
        title="Riduci animazioni"
        subtitle="Transizioni e sheet piu discrete"
        value={reduceMotion}
        onChange={setReduceMotion}
        colors={colors}
        styles={styles}
      />
      <ToggleRow
        title="Tag categoria nelle spese"
        subtitle="Mostra categoria su ogni movimento"
        value={showCategoryTag}
        onChange={setShowCategoryTag}
        colors={colors}
        styles={styles}
      />
      <ToggleRow
        title="Tag metodo pagamento"
        subtitle="Mostra Carta/Contanti accanto alla spesa"
        value={showPaymentTag}
        onChange={setShowPaymentTag}
        colors={colors}
        styles={styles}
      />
      <ToggleRow
        title="Promemoria ricorrenze"
        subtitle="Notifiche locali per abbonamenti e abitudini"
        value={recurringRemindersEnabled}
        onChange={setRecurringRemindersEnabled}
        colors={colors}
        styles={styles}
      />

      {recurringRemindersEnabled ? (
        <View
          style={[
            styles.toggleRow,
            { backgroundColor: colors.surface, borderColor: colors.white10 },
          ]}
        >
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.toggleTitle}>Ora promemoria</Text>
            <Text style={styles.toggleSub}>
              Le notifiche vengono inviate alle {String(recurringReminderHour).padStart(2, "0")}:00
            </Text>
          </View>
          <View style={styles.hourControls}>
            <Pressable
              onPress={() => setRecurringReminderHour(Math.max(0, recurringReminderHour - 1))}
              style={({ pressed }) => [
                styles.hourBtn,
                { borderColor: colors.white10, backgroundColor: colors.surface2 },
                pressed && { opacity: 0.9 },
              ]}
            >
              <Ionicons name="remove" size={16} color={colors.textTitle} />
            </Pressable>
            <Text style={styles.hourText}>
              {String(recurringReminderHour).padStart(2, "0")}
            </Text>
            <Pressable
              onPress={() => setRecurringReminderHour(Math.min(23, recurringReminderHour + 1))}
              style={({ pressed }) => [
                styles.hourBtn,
                { borderColor: colors.white10, backgroundColor: colors.surface2 },
                pressed && { opacity: 0.9 },
              ]}
            >
              <Ionicons name="add" size={16} color={colors.textTitle} />
            </Pressable>
          </View>
        </View>
      ) : null}

      <ToggleRow
        title="Allerte budget"
        subtitle="Notifiche quando il budget mensile viene raggiunto"
        value={budgetAlertsEnabled}
        onChange={setBudgetAlertsEnabled}
        colors={colors}
        styles={styles}
      />

      {budgetAlertsEnabled ? (
        <>
          <ToggleRow
            title="Soglia 80%"
            subtitle="Avvisa quando superi l'80% del budget"
            value={budgetAlertAt80}
            onChange={setBudgetAlertAt80}
            colors={colors}
            styles={styles}
          />
          <ToggleRow
            title="Soglia 100%"
            subtitle="Avvisa quando arrivi al 100% del budget"
            value={budgetAlertAt100}
            onChange={setBudgetAlertAt100}
            colors={colors}
            styles={styles}
          />
        </>
      ) : null}

      <Pressable
        onPress={resetQuickPrefs}
        style={({ pressed }) => [
          styles.resetBtn,
          pressed && { opacity: 0.88 },
        ]}
      >
        <Ionicons name="refresh-outline" size={18} color={colors.textTitle} />
        <Text style={styles.resetText}>Ripristina impostazioni rapide</Text>
      </Pressable>
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
    toggleRow: {
      borderRadius: 16,
      borderWidth: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    toggleTitle: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 13,
    },
    toggleSub: {
      color: colors.textMuted,
      fontWeight: "700",
      marginTop: 2,
      fontSize: 12,
    },
    hourControls: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    hourBtn: {
      width: 30,
      height: 30,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    hourText: {
      minWidth: 32,
      color: colors.textTitle,
      fontWeight: "900",
      textAlign: "center",
    },
    resetBtn: {
      marginTop: 6,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white08,
      paddingVertical: 11,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    resetText: { color: colors.textTitle, fontWeight: "900", fontSize: 13 },
  });
}
