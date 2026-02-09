import React, { useContext, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlobalStyles } from "../../constants/styles";
import { GoalsContext } from "../../store/goals-context";
import { CustomizationContext } from "../../store/customization-context";
import LoadingOverlay from "../../components/ui/LoadingOverlay";

function euro(value) {
  return `${Number(value || 0).toFixed(2)} €`;
}

function toPercent(goal) {
  const target = Number(goal?.targetAmount || 0);
  const current = Number(goal?.currentAmount || 0);
  if (target <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((current / target) * 100)));
}

export default function GoalsScreen() {
  const goalsCtx = useContext(GoalsContext);
  const { compactMode, highContrast } = useContext(CustomizationContext);
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    id: "",
    title: "",
    targetAmount: "",
    currentAmount: "",
    notes: "",
  });

  const completion = useMemo(() => {
    if (goalsCtx.totalTarget <= 0) return 0;
    return Math.min(100, Math.round((goalsCtx.totalSaved / goalsCtx.totalTarget) * 100));
  }, [goalsCtx.totalSaved, goalsCtx.totalTarget]);

  const borderColor = highContrast ? colors.borderStrong : colors.border;

  const openCreate = () => {
    setDraft({
      id: "",
      title: "",
      targetAmount: "",
      currentAmount: "",
      notes: "",
    });
    setModalOpen(true);
  };

  const openEdit = (goal) => {
    setDraft({
      id: String(goal?.id || ""),
      title: String(goal?.title || ""),
      targetAmount: String(Number(goal?.targetAmount || 0)),
      currentAmount: String(Number(goal?.currentAmount || 0)),
      notes: String(goal?.notes || ""),
    });
    setModalOpen(true);
  };

  const submitGoal = async () => {
    const title = String(draft.title || "").trim();
    const targetAmount = Number(draft.targetAmount || 0);
    const currentAmount = Number(draft.currentAmount || 0);
    const notes = String(draft.notes || "").trim();

    if (!title) {
      Alert.alert("Titolo mancante", "Inserisci un nome obiettivo.");
      return;
    }
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      Alert.alert("Target non valido", "Inserisci un importo target maggiore di zero.");
      return;
    }

    setSaving(true);
    try {
      await goalsCtx.saveGoal({
        id: draft.id || undefined,
        title,
        targetAmount,
        currentAmount: Number.isFinite(currentAmount) ? Math.max(0, currentAmount) : 0,
        notes,
      });
      setModalOpen(false);
    } catch {
      Alert.alert("Errore", "Impossibile salvare l'obiettivo.");
    } finally {
      setSaving(false);
    }
  };

  const deleteGoal = (goal) => {
    Alert.alert("Eliminare obiettivo?", goal?.title || "Obiettivo", [
      { text: "Annulla", style: "cancel" },
      {
        text: "Elimina",
        style: "destructive",
        onPress: async () => {
          try {
            await goalsCtx.deleteGoal(goal?.id);
          } catch {
            Alert.alert("Errore", "Impossibile eliminare l'obiettivo.");
          }
        },
      },
    ]);
  };

  if (!goalsCtx.initialized && goalsCtx.loading) {
    return <LoadingOverlay message="Caricamento obiettivi..." />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ padding: compactMode ? 12 : 16, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { borderColor, backgroundColor: colors.surface }]}>
          <View style={styles.heroTop}>
            <View style={[styles.heroIcon, { borderColor, backgroundColor: colors.surface2 }]}>
              <Ionicons name="flag-outline" size={17} color={colors.textTitle} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Obiettivi risparmio</Text>
              <Text style={styles.heroSub}>
                {euro(goalsCtx.totalSaved)} su {euro(goalsCtx.totalTarget)}
              </Text>
            </View>
            <Pressable
              onPress={openCreate}
              style={({ pressed }) => [
                styles.addBtn,
                { borderColor: colors.accent35, backgroundColor: colors.accent18 },
                pressed && { opacity: 0.9 },
              ]}
            >
              <Ionicons name="add" size={16} color={colors.textOnAccent} />
              <Text style={styles.addBtnText}>Nuovo</Text>
            </Pressable>
          </View>

          <View style={[styles.progressTrack, { backgroundColor: colors.surface2, borderColor }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.max(4, completion)}%`,
                  backgroundColor: colors.accent500,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>Completamento totale: {completion}%</Text>
        </View>

        {(goalsCtx.goals || []).length === 0 ? (
          <View style={[styles.emptyCard, { borderColor, backgroundColor: colors.surface }]}>
            <Text style={styles.emptyText}>Nessun obiettivo. Crea il primo e monitora il progresso.</Text>
          </View>
        ) : (
          <View style={{ gap: 10, marginTop: 12 }}>
            {(goalsCtx.goals || []).map((goal) => {
              const pct = toPercent(goal);
              return (
                <View key={goal.id} style={[styles.goalCard, { borderColor, backgroundColor: colors.surface }]}>
                  <View style={styles.goalTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.goalTitle}>{goal.title}</Text>
                      <Text style={styles.goalAmounts}>
                        {euro(goal.currentAmount)} / {euro(goal.targetAmount)}
                      </Text>
                    </View>
                    <Pressable onPress={() => openEdit(goal)} style={styles.iconBtn}>
                      <Ionicons name="create-outline" size={18} color={colors.textTitle} />
                    </Pressable>
                    <Pressable onPress={() => deleteGoal(goal)} style={styles.iconBtn}>
                      <Ionicons name="trash-outline" size={18} color={colors.textTitle} />
                    </Pressable>
                  </View>

                  <View style={[styles.progressTrack, { backgroundColor: colors.surface2, borderColor }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.max(3, pct)}%`,
                          backgroundColor: colors.accent500,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>{pct}% completato</Text>
                  {!!goal.notes && <Text style={styles.notes}>{goal.notes}</Text>}

                  <View style={styles.quickActions}>
                    <Pressable
                      onPress={() => goalsCtx.addProgress(goal.id, -10)}
                      style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.9 }]}
                    >
                      <Text style={styles.quickBtnText}>-10 €</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => goalsCtx.addProgress(goal.id, 10)}
                      style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.9 }]}
                    >
                      <Text style={styles.quickBtnText}>+10 €</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => goalsCtx.addProgress(goal.id, 50)}
                      style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.9 }]}
                    >
                      <Text style={styles.quickBtnText}>+50 €</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal transparent visible={modalOpen} animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { borderColor, backgroundColor: colors.surface }]}>
            <Text style={styles.modalTitle}>{draft.id ? "Modifica obiettivo" : "Nuovo obiettivo"}</Text>

            <TextInput
              value={draft.title}
              onChangeText={(value) => setDraft((prev) => ({ ...prev, title: value }))}
              style={[styles.input, { borderColor, backgroundColor: colors.surface2, color: colors.textTitle }]}
              placeholder="Titolo"
              placeholderTextColor={colors.textFaint}
            />
            <TextInput
              value={draft.targetAmount}
              onChangeText={(value) => setDraft((prev) => ({ ...prev, targetAmount: value }))}
              keyboardType="decimal-pad"
              style={[styles.input, { borderColor, backgroundColor: colors.surface2, color: colors.textTitle }]}
              placeholder="Target (€)"
              placeholderTextColor={colors.textFaint}
            />
            <TextInput
              value={draft.currentAmount}
              onChangeText={(value) => setDraft((prev) => ({ ...prev, currentAmount: value }))}
              keyboardType="decimal-pad"
              style={[styles.input, { borderColor, backgroundColor: colors.surface2, color: colors.textTitle }]}
              placeholder="Importo risparmiato (€)"
              placeholderTextColor={colors.textFaint}
            />
            <TextInput
              value={draft.notes}
              onChangeText={(value) => setDraft((prev) => ({ ...prev, notes: value }))}
              style={[styles.input, { borderColor, backgroundColor: colors.surface2, color: colors.textTitle }]}
              placeholder="Note (opzionale)"
              placeholderTextColor={colors.textFaint}
              multiline
            />

            <View style={styles.modalActions}>
              <Pressable onPress={() => setModalOpen(false)} style={styles.actionBtn}>
                <Text style={styles.actionText}>Annulla</Text>
              </Pressable>
              <Pressable onPress={submitGoal} style={styles.actionBtn} disabled={saving}>
                <Text style={styles.actionText}>{saving ? "Salvataggio..." : "Salva"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    hero: {
      borderRadius: 18,
      borderWidth: 1,
      padding: 12,
    },
    heroTop: { flexDirection: "row", alignItems: "center", gap: 10 },
    heroIcon: {
      width: 34,
      height: 34,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    heroTitle: { color: colors.textTitle, fontWeight: "900", fontSize: 16 },
    heroSub: { marginTop: 3, color: colors.textMuted, fontWeight: "800" },
    addBtn: {
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    addBtnText: { color: colors.textOnAccent, fontWeight: "900", fontSize: 12 },
    progressTrack: {
      marginTop: 10,
      borderWidth: 1,
      borderRadius: 999,
      overflow: "hidden",
      height: 9,
    },
    progressFill: { height: "100%", borderRadius: 999 },
    progressText: { marginTop: 6, color: colors.textMuted, fontWeight: "800", fontSize: 12 },
    emptyCard: {
      marginTop: 12,
      borderWidth: 1,
      borderRadius: 16,
      padding: 14,
    },
    emptyText: { color: colors.textMuted, fontWeight: "800" },
    goalCard: { borderWidth: 1, borderRadius: 16, padding: 12 },
    goalTop: { flexDirection: "row", alignItems: "center", gap: 6 },
    goalTitle: { color: colors.textTitle, fontWeight: "900", fontSize: 15 },
    goalAmounts: { color: colors.textBody, fontWeight: "800", marginTop: 3 },
    iconBtn: {
      width: 30,
      height: 30,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
    },
    notes: { marginTop: 6, color: colors.textMuted, fontWeight: "700" },
    quickActions: { marginTop: 8, flexDirection: "row", gap: 8 },
    quickBtn: {
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
      borderRadius: 10,
      paddingVertical: 7,
      paddingHorizontal: 10,
    },
    quickBtnText: { color: colors.textTitle, fontWeight: "900", fontSize: 12 },
    modalBackdrop: {
      flex: 1,
      padding: 18,
      backgroundColor: colors.overlay72,
      justifyContent: "center",
    },
    modalCard: { borderRadius: 16, borderWidth: 1, padding: 12 },
    modalTitle: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 15,
      marginBottom: 10,
    },
    input: {
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontWeight: "700",
      marginBottom: 8,
    },
    modalActions: { marginTop: 6, flexDirection: "row", gap: 10 },
    actionBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
      borderRadius: 12,
      paddingVertical: 10,
      alignItems: "center",
    },
    actionText: { color: colors.textTitle, fontWeight: "900" },
  });
}
