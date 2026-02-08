import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlobalStyles } from "../../constants/styles";
import RecurringTimeline from "./RecurringTimeline";

function CreateCard({ title, subtitle, icon, onPress }) {
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.createCard, pressed && { opacity: 0.92 }]}
    >
      <View style={[styles.createBlob, styles.createBlobTop]} />
      <View style={[styles.createBlob, styles.createBlobBottom]} />
      <View style={styles.createIcon}>
        <Ionicons name={icon} size={18} color={colors.textTitle} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.createTitle}>{title}</Text>
        <Text style={styles.createSub}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export default function RecurringOutputHeader({
  items,
  onCreateHabit,
  onCreateSubscription,
  onAddAllDue,
  dueCount,
  showPaidSubscriptions = false,
  onToggleShowPaid,
  hiddenPaidCount = 0,
}) {
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);
  const totalItems = Array.isArray(items) ? items.length : 0;
  const subscriptions = (items || []).filter((x) => x?.type === "SUBSCRIPTION").length;
  const habits = Math.max(0, totalItems - subscriptions);

  const hiddenPaidText =
    hiddenPaidCount === 1
      ? "1 abbonamento già pagato nascosto"
      : `${hiddenPaidCount} abbonamenti pagati nascosti`;

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.heroCard}>
        <View style={[styles.heroBlob, styles.heroBlobTop]} />
        <View style={[styles.heroBlob, styles.heroBlobBottom]} />

        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Ionicons name="repeat-outline" size={18} color={colors.textTitle} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Abbonamenti e Abitudini</Text>
            <Text style={styles.heroSub}>
              {dueCount > 0
                ? `${dueCount} pagamento/i da registrare`
                : "Inizia a inserire i tuoi abbonamenti o le tue abitudini!"}
            </Text>
          </View>
        </View>

        <View style={styles.heroStats}>
          <View style={styles.heroStatChip}>
            <Ionicons name="repeat-outline" size={14} color={colors.textTitle} />
            <Text style={styles.heroStatText}>Abbonamenti: {subscriptions}</Text>
          </View>
          <View style={styles.heroStatChip}>
            <Ionicons name="flash-outline" size={14} color={colors.textTitle} />
            <Text style={styles.heroStatText}>Abitudini: {habits}</Text>
          </View>
        </View>
      </View>

      <View style={styles.topRow}>
        <CreateCard
          title="Nuova Abitudine"
          subtitle="Tocca per creare (aggiungi piu volte)"
          icon="flash-outline"
          onPress={onCreateHabit}
        />
        <CreateCard
          title="Nuovo Abbonamento"
          subtitle="Tocca per creare (paga a scadenza)"
          icon="repeat-outline"
          onPress={onCreateSubscription}
        />
      </View>

      {!!dueCount && (
        <Pressable
          onPress={onAddAllDue}
          style={({ pressed }) => [styles.addAllBtn, pressed && { opacity: 0.9 }]}
        >
          <Ionicons name="checkmark-done" size={18} color={colors.textOnAccentStrong} />
          <Text style={styles.addAllText}>Aggiungi tutto ({dueCount})</Text>
        </Pressable>
      )}

      <RecurringTimeline items={items} />

      <View style={styles.sectionHead}>
        <View style={styles.sectionIcon}>
          <Ionicons name="list-outline" size={16} color={colors.textTitle} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Le tue ricorrenze</Text>
          <Text style={styles.sectionSub}>Tocca per modificare - scorri per eliminare</Text>
        </View>
        <Pressable
          onPress={onToggleShowPaid}
          style={({ pressed }) => [
            styles.togglePaidBtn,
            showPaidSubscriptions && styles.togglePaidBtnActive,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Ionicons
            name={showPaidSubscriptions ? "eye-outline" : "eye-off-outline"}
            size={16}
            color={colors.textTitle}
          />
          <Text style={styles.togglePaidText}>
            {showPaidSubscriptions ? "Mostra tutti" : "Nascondi pagati"}
          </Text>
        </Pressable>
      </View>

      {!showPaidSubscriptions && hiddenPaidCount > 0 ? (
        <View style={styles.hiddenHint}>
          <Ionicons name="checkmark-circle-outline" size={16} color={colors.textMuted} />
          <Text style={styles.hiddenHintText}>{hiddenPaidText}</Text>
        </View>
      ) : null}

      {!items?.length ? (
        <View style={styles.empty}>
          <Ionicons name="sparkles-outline" size={18} color={colors.textMuted} />
          <Text style={styles.emptyText}>Nessuna abitudine o abbonamento ancora.</Text>
        </View>
      ) : null}
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    topRow: { flexDirection: "row", gap: 10 },
    heroCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      padding: 12,
      overflow: "hidden",
      gap: 10,
    },
    heroBlob: {
      position: "absolute",
      borderRadius: 999,
      backgroundColor: colors.accent16,
      borderWidth: 1,
      borderColor: colors.accent30,
    },
    heroBlobTop: { width: 110, height: 110, right: -26, top: -28 },
    heroBlobBottom: { width: 70, height: 70, right: 30, bottom: -22 },
    heroTop: { flexDirection: "row", alignItems: "center", gap: 10 },
    heroIcon: {
      width: 38,
      height: 38,
      borderRadius: 14,
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.white10,
      alignItems: "center",
      justifyContent: "center",
    },
    heroTitle: { color: colors.textTitle, fontWeight: "900", fontSize: 14 },
    heroSub: { marginTop: 2, color: colors.textMuted, fontWeight: "800", fontSize: 12 },
    heroStats: { flexDirection: "row", gap: 8 },
    heroStatChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    heroStatText: { color: colors.textBody, fontWeight: "800", fontSize: 11 },

    createCard: {
      flex: 1,
      padding: 12,
      borderRadius: 18,
      backgroundColor: colors.white06,
      borderWidth: 1,
      borderColor: colors.white10,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      overflow: "hidden",
    },
    createIcon: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: colors.accent18,
      borderWidth: 1,
      borderColor: colors.accent35,
      alignItems: "center",
      justifyContent: "center",
    },
    createBlob: {
      position: "absolute",
      borderRadius: 999,
      backgroundColor: colors.accent12,
      borderWidth: 1,
      borderColor: colors.accent18,
    },
    createBlobTop: { width: 78, height: 78, right: -24, top: -22 },
    createBlobBottom: { width: 44, height: 44, right: 20, bottom: -20 },
    createTitle: { color: colors.textTitle, fontWeight: "900" },
    createSub: {
      marginTop: 2,
      color: colors.textMuted,
      fontWeight: "700",
      fontSize: 12,
    },

    addAllBtn: {
      height: 50,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      backgroundColor: colors.accent500,
      borderWidth: 1,
      borderColor: colors.accent30,
    },
    addAllText: { color: colors.textOnAccentStrong, fontWeight: "900" },

    sectionHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 6,
      marginBottom: 10,
    },
    sectionIcon: {
      width: 34,
      height: 34,
      borderRadius: 14,
      backgroundColor: colors.white08,
      borderWidth: 1,
      borderColor: colors.white10,
      alignItems: "center",
      justifyContent: "center",
    },
    sectionTitle: { color: colors.textTitle, fontWeight: "900" },
    sectionSub: {
      marginTop: 2,
      color: colors.textMuted,
      fontWeight: "700",
      fontSize: 12,
    },
    togglePaidBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
    },
    togglePaidBtnActive: {
      borderColor: colors.accent35,
      backgroundColor: colors.accent18,
    },
    togglePaidText: { color: colors.textTitle, fontWeight: "900", fontSize: 11 },
    hiddenHint: {
      padding: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    hiddenHintText: { color: colors.textMuted, fontWeight: "800", fontSize: 12, flex: 1 },

    empty: {
      padding: 14,
      borderRadius: 18,
      backgroundColor: colors.white06,
      borderWidth: 1,
      borderColor: colors.white10,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    emptyText: { color: colors.textBody, fontWeight: "800", flex: 1 },
  });
}
