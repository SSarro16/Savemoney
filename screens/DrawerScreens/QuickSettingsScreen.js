import React, { useContext } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { GlobalStyles } from "../../constants/styles";
import { CustomizationContext } from "../../store/customization-context";

function ToggleRow({ title, subtitle, value, onChange, styles }) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        {!!subtitle ? <Text style={styles.toggleSub}>{subtitle}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

function SectionBlock({ icon, title, subtitle, children, styles, colors }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHead}>
        <View style={styles.sectionIcon}>
          <Ionicons name={icon} size={16} color={colors.textTitle} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSub}>{subtitle}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

export default function QuickSettingsScreen() {
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);
  const {
    compactMode,
    highContrast,
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
    setHighContrast,
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

  const resetQuickPrefs = () => {
    setCompactMode(false);
    setHighContrast(false);
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
        <View style={[styles.heroBubble, styles.heroBubbleTop]} />
        <View style={[styles.heroBubble, styles.heroBubbleBottom]} />
        <View style={styles.heroIcon}>
          <Ionicons name="flash-outline" size={18} color={colors.textTitle} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Quick Controls</Text>
          <Text style={styles.heroSub}>
            Regola in pochi tap accessibilita, notifiche e comportamento UI.
          </Text>
        </View>
      </View>

      <SectionBlock
        icon="phone-portrait-outline"
        title="Interfaccia"
        subtitle="Leggibilita e comportamento visivo"
        styles={styles}
        colors={colors}
      >
        <ToggleRow
          title="Modalita compatta"
          subtitle="Riduce spazi e altezze dei componenti"
          value={compactMode}
          onChange={setCompactMode}
          styles={styles}
        />
        <ToggleRow
          title="Contrasto elevato"
          subtitle="Bordi e separatori piu marcati"
          value={highContrast}
          onChange={setHighContrast}
          styles={styles}
        />
        <ToggleRow
          title="Testo piu grande"
          subtitle="Aumenta la leggibilita globale"
          value={largeText}
          onChange={setLargeText}
          styles={styles}
        />
        <ToggleRow
          title="Riduci animazioni"
          subtitle="Transizioni piu discrete"
          value={reduceMotion}
          onChange={setReduceMotion}
          styles={styles}
        />
        <ToggleRow
          title="Tag categoria nelle spese"
          subtitle="Mostra categoria su ogni movimento"
          value={showCategoryTag}
          onChange={setShowCategoryTag}
          styles={styles}
        />
        <ToggleRow
          title="Tag metodo pagamento"
          subtitle="Mostra Carta/Contanti accanto alla spesa"
          value={showPaymentTag}
          onChange={setShowPaymentTag}
          styles={styles}
        />
      </SectionBlock>

      <SectionBlock
        icon="notifications-outline"
        title="Notifiche"
        subtitle="Reminder ricorrenze e soglie budget"
        styles={styles}
        colors={colors}
      >
        <ToggleRow
          title="Promemoria ricorrenze"
          subtitle="Notifiche locali per abbonamenti e abitudini"
          value={recurringRemindersEnabled}
          onChange={setRecurringRemindersEnabled}
          styles={styles}
        />

        {recurringRemindersEnabled ? (
          <View style={styles.hourCard}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.toggleTitle}>Ora promemoria</Text>
              <Text style={styles.toggleSub}>
                Invio previsto alle {String(recurringReminderHour).padStart(2, "0")}:00
              </Text>
            </View>
            <View style={styles.hourControls}>
              <Pressable
                onPress={() => setRecurringReminderHour(Math.max(0, recurringReminderHour - 1))}
                style={({ pressed }) => [styles.hourBtn, pressed && { opacity: 0.88 }]}
              >
                <Ionicons name="remove" size={16} color={colors.textTitle} />
              </Pressable>
              <Text style={styles.hourText}>
                {String(recurringReminderHour).padStart(2, "0")}
              </Text>
              <Pressable
                onPress={() => setRecurringReminderHour(Math.min(23, recurringReminderHour + 1))}
                style={({ pressed }) => [styles.hourBtn, pressed && { opacity: 0.88 }]}
              >
                <Ionicons name="add" size={16} color={colors.textTitle} />
              </Pressable>
            </View>
          </View>
        ) : null}

        <ToggleRow
          title="Allerte budget"
          subtitle="Avvisi quando il budget viene raggiunto"
          value={budgetAlertsEnabled}
          onChange={setBudgetAlertsEnabled}
          styles={styles}
        />

        {budgetAlertsEnabled ? (
          <>
            <ToggleRow
              title="Soglia 80%"
              subtitle="Notifica quando superi l'80%"
              value={budgetAlertAt80}
              onChange={setBudgetAlertAt80}
              styles={styles}
            />
            <ToggleRow
              title="Soglia 100%"
              subtitle="Notifica al raggiungimento del limite"
              value={budgetAlertAt100}
              onChange={setBudgetAlertAt100}
              styles={styles}
            />
          </>
        ) : null}
      </SectionBlock>

      <Pressable
        onPress={resetQuickPrefs}
        style={({ pressed }) => [styles.resetBtn, pressed && { opacity: 0.88 }]}
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
    heroBubbleTop: { width: 104, height: 104, right: -30, top: -30 },
    heroBubbleBottom: { width: 58, height: 58, right: 32, bottom: -24 },
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

    sectionCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      padding: 10,
      marginBottom: 10,
    },
    sectionHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      marginBottom: 8,
    },
    sectionIcon: {
      width: 34,
      height: 34,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
      alignItems: "center",
      justifyContent: "center",
    },
    sectionTitle: { color: colors.textTitle, fontWeight: "900", fontSize: 14 },
    sectionSub: { marginTop: 1, color: colors.textMuted, fontWeight: "700", fontSize: 11 },

    toggleRow: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      paddingVertical: 10,
      paddingHorizontal: 11,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
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
      fontSize: 11,
    },

    hourCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      paddingVertical: 10,
      paddingHorizontal: 11,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    hourControls: { flexDirection: "row", alignItems: "center", gap: 6 },
    hourBtn: {
      width: 30,
      height: 30,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
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
      marginTop: 2,
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
