import React, { useContext, useState } from "react";
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
import { useThemeRefresh } from "../../store/theme-context";
import { PaymentContext } from "../../store/payment-context";
import LoadingOverlay from "../../components/ui/LoadingOverlay";

function emptyDraft() {
  return { id: "", name: "", balance: "" };
}

function parseAmount(v) {
  const cleaned = String(v || "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export default function CashScreen() {
  useThemeRefresh();
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);
  const paymentCtx = useContext(PaymentContext);

  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setDraft(emptyDraft());
    setModalOpen(true);
  };

  const openEdit = (wallet) => {
    setDraft({
      id: String(wallet?.id || ""),
      name: String(wallet?.name || ""),
      balance: String(wallet?.balance ?? ""),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const saveWallet = async () => {
    const name = String(draft.name || "").trim();
    if (!name) {
      Alert.alert("Nome mancante", "Inserisci il nome del wallet contanti.");
      return;
    }
    const balance = parseAmount(draft.balance);

    setSaving(true);
    try {
      if (draft.id) {
        await paymentCtx.updateCashWallet(draft.id, { name, balance });
      } else {
        const shouldPredefinito = paymentCtx.cashWallets.length === 0;
        await paymentCtx.addCashWallet({ name, balance, isPredefinito: shouldPredefinito });
      }
      setModalOpen(false);
    } catch (e) {
      Alert.alert("Errore", e?.message || "Impossibile salvare il wallet.");
    } finally {
      setSaving(false);
    }
  };

  const removeWallet = (wallet) => {
    Alert.alert("Elimina wallet", `Eliminare "${wallet?.name || "Contanti"}"?`, [
      { text: "Annulla", style: "cancel" },
      {
        text: "Elimina",
        style: "destructive",
        onPress: async () => {
          try {
            await paymentCtx.deleteCashWallet(wallet.id);
          } catch (e) {
            Alert.alert(
              "Errore",
              e?.message || "Impossibile eliminare il wallet.",
            );
          }
        },
      },
    ]);
  };

  if (!paymentCtx.initialized && paymentCtx.loading && !paymentCtx.cashWallets.length) {
    return <LoadingOverlay message="Caricamento contanti..." />;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="cash-outline" size={18} color={colors.textTitle} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Contanti</Text>
          <Text style={styles.heroSub}>
            Gestisci wallet contanti e imposta quello predefinito.
          </Text>
        </View>
        <Pressable
          onPress={openCreate}
          style={({ pressed }) => [
            styles.addBtn,
            pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
          ]}
        >
          <Ionicons name="add" size={18} color={colors.textOnAccentStrong} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {!paymentCtx.cashWallets.length ? (
          <View style={styles.empty}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={colors.textMuted}
            />
            <Text style={styles.emptyText}>
              Nessun wallet contanti salvato.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {paymentCtx.cashWallets.map((wallet) => (
              <View key={wallet.id} style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>
                    {wallet.name || "Contanti"}
                    {wallet.isPredefinito ? " • Predefinito" : ""}
                  </Text>
                  <Text style={styles.cardSub}>
                    Saldo: {Number(wallet.balance || 0).toFixed(2)} €
                  </Text>
                </View>

                {!wallet.isPredefinito ? (
                  <Pressable
                    onPress={() => paymentCtx.setPredefinitoCashWallet(wallet.id)}
                    style={({ pressed }) => [
                      styles.iconBtn,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Ionicons
                      name="star-outline"
                      size={18}
                      color={colors.textTitle}
                    />
                  </Pressable>
                ) : null}

                <Pressable
                  onPress={() => openEdit(wallet)}
                  style={({ pressed }) => [
                    styles.iconBtn,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Ionicons
                    name="create-outline"
                    size={18}
                    color={colors.textTitle}
                  />
                </Pressable>

                <Pressable
                  onPress={() => removeWallet(wallet)}
                  style={({ pressed }) => [
                    styles.iconBtnDanger,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={colors.textTitle}
                  />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={modalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {draft.id ? "Modifica wallet" : "Nuovo wallet"}
            </Text>

            <Text style={styles.label}>Nome</Text>
            <TextInput
              value={draft.name}
              onChangeText={(v) => setDraft((p) => ({ ...p, name: v }))}
              placeholder="Es. Portafoglio"
              placeholderTextColor={colors.white45}
              style={styles.input}
            />

            <Text style={styles.label}>Saldo iniziale</Text>
            <TextInput
              value={draft.balance}
              onChangeText={(v) => setDraft((p) => ({ ...p, balance: v }))}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.white45}
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={closeModal}
                style={({ pressed }) => [
                  styles.btnGhost,
                  pressed && { opacity: 0.86 },
                ]}
              >
                <Text style={styles.btnGhostText}>Annulla</Text>
              </Pressable>

              <Pressable
                onPress={saveWallet}
                style={({ pressed }) => [
                  styles.btnPrimary,
                  pressed && { opacity: 0.86 },
                ]}
                disabled={saving}
              >
                <Text style={styles.btnPrimaryText}>
                  {saving ? "Salvataggio..." : "Salva"}
                </Text>
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
    screen: { flex: 1, backgroundColor: colors.bg, padding: 14 },
    hero: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      padding: 14,
      marginBottom: 12,
    },
    heroIcon: {
      width: 38,
      height: 38,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.white10,
    },
    heroTitle: { color: colors.textTitle, fontWeight: "900", fontSize: 16 },
    heroSub: {
      marginTop: 2,
      color: colors.textMuted,
      fontWeight: "700",
      fontSize: 12,
    },
    addBtn: {
      width: 42,
      height: 42,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.accent30,
      backgroundColor: colors.accent500,
    },
    empty: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    emptyText: { flex: 1, color: colors.textMuted, fontWeight: "800" },
    card: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    cardTitle: { color: colors.textTitle, fontWeight: "900" },
    cardSub: {
      marginTop: 2,
      color: colors.textMuted,
      fontWeight: "700",
      fontSize: 12,
    },
    iconBtn: {
      width: 38,
      height: 38,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white08,
    },
    iconBtnDanger: {
      width: 38,
      height: 38,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.danger30,
      backgroundColor: colors.danger20,
    },
    modalBackdrop: {
      flex: 1,
      justifyContent: "center",
      padding: 16,
      backgroundColor: colors.overlay60,
    },
    modalCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      padding: 14,
    },
    modalTitle: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 16,
      marginBottom: 10,
      textAlign: "center",
    },
    label: {
      color: colors.textMuted,
      fontWeight: "800",
      fontSize: 12,
      marginBottom: 6,
      marginTop: 4,
    },
    input: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
      color: colors.textTitle,
      fontWeight: "800",
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    modalActions: { flexDirection: "row", gap: 10, marginTop: 14 },
    btnGhost: {
      flex: 1,
      height: 46,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.white12,
      backgroundColor: colors.white06,
    },
    btnGhostText: { color: colors.textTitle, fontWeight: "900" },
    btnPrimary: {
      flex: 1,
      height: 46,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.accent30,
      backgroundColor: colors.accent500,
    },
    btnPrimaryText: { color: colors.textOnAccentStrong, fontWeight: "900" },
  });
}

