import React, { useContext, useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import { ExpensesContext } from "../../store/expenses-context";
import { useTranslation } from "../../store/language-context";
import LoadingOverlay from "../../components/ui/LoadingOverlay";
import { formatDateIT } from "../../util/date";

function emptyCardDraft() {
  return { id: "", name: "", brand: "", last4: "", balance: "" };
}

function emptyCashDraft() {
  return { id: "", name: "", balance: "" };
}

function parseAmount(value) {
  const cleaned = String(value || "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function toUiErrorMessage(error, fallback, t) {
  const status = Number(error?.response?.status || 0);
  const rawError = error?.response?.data?.error;
  const raw =
    typeof rawError === "string"
      ? rawError.toLowerCase()
      : String(rawError?.message || "").toLowerCase();

  if (raw.includes("permission_denied") || raw.includes("permission denied")) {
    return t("payments.permissionDenied");
  }

  if (
    raw.includes("token expired") ||
    raw.includes("id token expired") ||
    raw.includes("invalid id token") ||
    raw.includes("invalid token")
  ) {
    return t("payments.sessionExpired");
  }

  if (status === 401 || status === 403) {
    return t("payments.unauthorized");
  }

  return error?.message || fallback;
}

function SectionHeader({ icon, title, subtitle, onAdd, colors, styles }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeadLeft}>
        <View style={styles.sectionIconWrap}>
          <Ionicons name={icon} size={18} color={colors.textTitle} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSub}>{subtitle}</Text>
        </View>
      </View>

      <Pressable
        onPress={onAdd}
        style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.9 }]}
      >
        <Ionicons name="add" size={18} color={colors.textOnAccentStrong} />
      </Pressable>
    </View>
  );
}

export default function PaymentsScreen({ navigation }) {
  useThemeRefresh();
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);
  const paymentCtx = useContext(PaymentContext);
  const expensesCtx = useContext(ExpensesContext);
  const { t } = useTranslation();

  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardDraft, setCardDraft] = useState(emptyCardDraft());

  const [cashModalOpen, setCashModalOpen] = useState(false);
  const [cashDraft, setCashDraft] = useState(emptyCashDraft());

  const [saving, setSaving] = useState(false);

  const openMethodDetails = (methodType, methodId) => {
    const id = String(methodId || "").trim();
    if (!id) return;
    navigation.navigate("PaymentMethodDetails", { methodType, methodId: id });
  };

  const recentPayments = useMemo(() => {
    return [...(expensesCtx.expenses || [])]
      .sort((a, b) => new Date(b?.date || 0).getTime() - new Date(a?.date || 0).getTime())
      .slice(0, 20);
  }, [expensesCtx.expenses]);

  const spentByCard = useMemo(() => {
    const map = new Map();
    for (const exp of expensesCtx.expenses || []) {
      const type = exp?.methodType === "CARD" || exp?.payMethod === "CARD" ? "CARD" : "CASH";
      if (type !== "CARD") continue;
      const cardId = String(exp?.methodId || exp?.cardId || "").trim();
      if (!cardId) continue;
      const amount = Number(exp?.amount || 0);
      if (!Number.isFinite(amount) || amount <= 0) continue;
      map.set(cardId, Number((Number(map.get(cardId) || 0) + amount).toFixed(2)));
    }
    return map;
  }, [expensesCtx.expenses]);

  const spentByCashWallet = useMemo(() => {
    const map = new Map();
    for (const exp of expensesCtx.expenses || []) {
      const type = exp?.methodType === "CARD" || exp?.payMethod === "CARD" ? "CARD" : "CASH";
      if (type !== "CASH") continue;
      const walletId = String(exp?.methodId || exp?.cashId || "").trim();
      if (!walletId) continue;
      const amount = Number(exp?.amount || 0);
      if (!Number.isFinite(amount) || amount <= 0) continue;
      map.set(walletId, Number((Number(map.get(walletId) || 0) + amount).toFixed(2)));
    }
    return map;
  }, [expensesCtx.expenses]);

  const totalCardBalance = useMemo(
    () =>
      (paymentCtx.cards || []).reduce(
        (sum, card) => sum + Number(card?.balance || 0),
        0,
      ),
    [paymentCtx.cards],
  );

  const totalCashBalance = useMemo(
    () =>
      (paymentCtx.cashWallets || []).reduce(
        (sum, wallet) => sum + Number(wallet?.balance || 0),
        0,
      ),
    [paymentCtx.cashWallets],
  );

  const openCreateCard = () => {
    setCardDraft(emptyCardDraft());
    setCardModalOpen(true);
  };

  const openEditCard = (card) => {
    setCardDraft({
      id: String(card?.id || ""),
      name: String(card?.name || ""),
      brand: String(card?.brand || ""),
      last4: String(card?.last4 || ""),
      balance: String(card?.balance ?? ""),
    });
    setCardModalOpen(true);
  };

  const saveCard = async () => {
    const name = String(cardDraft.name || "").trim();
    const last4 = String(cardDraft.last4 || "")
      .replace(/[^\d]/g, "")
      .slice(-4);
    const balance = parseAmount(cardDraft.balance);

    if (!name) {
      Alert.alert(t("payments.missingCardNameTitle"), t("payments.missingCardNameMessage"));
      return;
    }

    setSaving(true);
    try {
      if (cardDraft.id) {
        await paymentCtx.updateCard(cardDraft.id, {
          name,
          brand: String(cardDraft.brand || "").trim(),
          last4,
          balance,
        });
      } else {
        await paymentCtx.addCard({
          name,
          brand: String(cardDraft.brand || "").trim(),
          last4,
          balance,
        });
      }
      setCardModalOpen(false);
      Keyboard.dismiss();
    } catch (error) {
      Alert.alert(t("common.error"), toUiErrorMessage(error, t("payments.saveCardFailed"), t));
    } finally {
      setSaving(false);
    }
  };

  const removeCard = (card) => {
    Alert.alert(
      t("payments.deleteCardTitle"),
      t("payments.deleteCardMessage", { name: card?.name || t("payments.cardFallback") }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await paymentCtx.deleteCard(card.id);
            } catch (error) {
              Alert.alert(
                t("common.error"),
                toUiErrorMessage(error, t("payments.deleteCardFailed"), t),
              );
            }
          },
        },
      ],
    );
  };

  const openCreateCash = () => {
    setCashDraft(emptyCashDraft());
    setCashModalOpen(true);
  };

  const openEditCash = (wallet) => {
    setCashDraft({
      id: String(wallet?.id || ""),
      name: String(wallet?.name || ""),
      balance: String(wallet?.balance ?? ""),
    });
    setCashModalOpen(true);
  };

  const saveCashWallet = async () => {
    const name = String(cashDraft.name || "").trim();
    if (!name) {
      Alert.alert(t("payments.missingWalletNameTitle"), t("payments.missingWalletNameMessage"));
      return;
    }
    const balance = parseAmount(cashDraft.balance);

    setSaving(true);
    try {
      if (cashDraft.id) {
        await paymentCtx.updateCashWallet(cashDraft.id, { name, balance });
      } else {
        const shouldDefault = paymentCtx.cashWallets.length === 0;
        await paymentCtx.addCashWallet({ name, balance, isDefault: shouldDefault });
      }
      setCashModalOpen(false);
      Keyboard.dismiss();
    } catch (error) {
      Alert.alert(t("common.error"), toUiErrorMessage(error, t("payments.saveWalletFailed"), t));
    } finally {
      setSaving(false);
    }
  };

  const removeCashWallet = (wallet) => {
    Alert.alert(
      t("payments.deleteWalletTitle"),
      t("payments.deleteWalletMessage", { name: wallet?.name || t("payments.cashFallback") }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await paymentCtx.deleteCashWallet(wallet.id);
            } catch (error) {
              Alert.alert(
                t("common.error"),
                toUiErrorMessage(error, t("payments.deleteWalletFailed"), t),
              );
            }
          },
        },
      ],
    );
  };

  if (
    !paymentCtx.initialized &&
    paymentCtx.loading &&
    !paymentCtx.cards.length &&
    !paymentCtx.cashWallets.length
  ) {
    return <LoadingOverlay message={t("payments.loadingMethods")} />;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <View style={[styles.heroBlob, styles.heroBlobTop]} />
        <View style={[styles.heroBlob, styles.heroBlobBottom]} />
        <View style={styles.heroIcon}>
          <Ionicons name="wallet-outline" size={18} color={colors.textTitle} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>{t("payments.heroTitle")}</Text>
          <Text style={styles.heroSub}>
            {t("payments.heroSubtitle")}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t("payments.cardsLabel")}</Text>
          <Text style={styles.statValue}>
            {(paymentCtx.cards || []).length} - {totalCardBalance.toFixed(2)} {t("common.currencyCode")}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t("payments.cashLabel")}</Text>
          <Text style={styles.statValue}>
            {(paymentCtx.cashWallets || []).length} - {totalCashBalance.toFixed(2)} {t("common.currencyCode")}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20, gap: 12 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <SectionHeader
            icon="card-outline"
            title={t("payments.cardsSectionTitle")}
            subtitle={t("payments.cardsSectionSub")}
            onAdd={openCreateCard}
            colors={colors}
            styles={styles}
          />

          {!paymentCtx.cards.length ? (
            <View style={styles.empty}>
              <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
              <Text style={styles.emptyText}>{t("payments.noCards")}</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {paymentCtx.cards.map((card) => (
                <Pressable
                  key={card.id}
                  onPress={() => openMethodDetails("CARD", card.id)}
                  style={({ pressed }) => [styles.cardRow, pressed && { opacity: 0.92 }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{card.name || t("payments.cardFallback")}</Text>
                    {!!(card.brand || card.last4) && (
                      <Text style={styles.cardSub}>
                        {card.brand ? `${card.brand}${card.last4 ? " - " : ""}` : ""}
                        {card.last4 ? `**** ${card.last4}` : ""}
                      </Text>
                    )}
                    <Text style={styles.cardSub}>
                      {t("payments.currentBalance")}: {Number(card.balance || 0).toFixed(2)} {t("common.currencyCode")}
                    </Text>
                    <Text style={styles.cardSub}>
                      {t("payments.recordedExpenses")}: {Number(spentByCard.get(String(card.id)) || 0).toFixed(2)} {t("common.currencyCode")}
                    </Text>
                    <Text style={styles.cardSubStrong}>
                      {t("payments.methodLabel")}: {t("expensesOutput.card")}
                    </Text>
                  </View>

                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation?.();
                      openEditCard(card);
                    }}
                    style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.85 }]}
                  >
                    <Ionicons name="create-outline" size={18} color={colors.textTitle} />
                  </Pressable>

                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation?.();
                      removeCard(card);
                    }}
                    style={({ pressed }) => [styles.iconBtnDanger, pressed && { opacity: 0.85 }]}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.textTitle} />
                  </Pressable>

                  <Ionicons name="chevron-forward" size={16} color={colors.white45} />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader
            icon="cash-outline"
            title={t("payments.cashSectionTitle")}
            subtitle={t("payments.cashSectionSub")}
            onAdd={openCreateCash}
            colors={colors}
            styles={styles}
          />

          {!paymentCtx.cashWallets.length ? (
            <View style={styles.empty}>
              <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
              <Text style={styles.emptyText}>{t("payments.noWallets")}</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {paymentCtx.cashWallets.map((wallet) => (
                <Pressable
                  key={wallet.id}
                  onPress={() => openMethodDetails("CASH", wallet.id)}
                  style={({ pressed }) => [styles.cardRow, pressed && { opacity: 0.92 }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>
                      {wallet.name || t("payments.cashFallback")}
                      {wallet.isDefault ? ` - ${t("payments.defaultLabel")}` : ""}
                    </Text>
                    <Text style={styles.cardSub}>
                      {t("payments.currentBalance")}: {Number(wallet.balance || 0).toFixed(2)} {t("common.currencyCode")}
                    </Text>
                    <Text style={styles.cardSub}>
                      {t("payments.recordedExpenses")}: {Number(spentByCashWallet.get(String(wallet.id)) || 0).toFixed(2)} {t("common.currencyCode")}
                    </Text>
                    <Text style={styles.cardSubStrong}>
                      {t("payments.methodLabel")}: {t("expensesOutput.cash")}
                    </Text>
                  </View>

                  {!wallet.isDefault ? (
                    <Pressable
                      onPress={(event) => {
                        event.stopPropagation?.();
                        paymentCtx.setDefaultCashWallet(wallet.id);
                      }}
                      style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.85 }]}
                    >
                      <Ionicons name="star-outline" size={18} color={colors.textTitle} />
                    </Pressable>
                  ) : null}

                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation?.();
                      openEditCash(wallet);
                    }}
                    style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.85 }]}
                  >
                    <Ionicons name="create-outline" size={18} color={colors.textTitle} />
                  </Pressable>

                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation?.();
                      removeCashWallet(wallet);
                    }}
                    style={({ pressed }) => [styles.iconBtnDanger, pressed && { opacity: 0.85 }]}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.textTitle} />
                  </Pressable>

                  <Ionicons name="chevron-forward" size={16} color={colors.white45} />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeadLeft}>
              <View style={styles.sectionIconWrap}>
                <Ionicons name="receipt-outline" size={18} color={colors.textTitle} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>{t("payments.recentPaymentsTitle")}</Text>
                <Text style={styles.sectionSub}>{t("payments.recentPaymentsSub")}</Text>
              </View>
            </View>
          </View>

          {!recentPayments.length ? (
            <View style={styles.empty}>
              <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
              <Text style={styles.emptyText}>{t("payments.noRecentPayments")}</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {recentPayments.map((expense) => {
                const methodLabel = paymentCtx.resolveMethodLabel?.(expense) || t("expensesOutput.cash");
                return (
                  <View key={expense.id} style={styles.paymentRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {String(expense?.description || t("payments.expenseFallback"))}
                      </Text>
                      <Text style={styles.cardSub} numberOfLines={1}>
                        {methodLabel} - {formatDateIT(expense?.date)}
                      </Text>
                    </View>
                    <Text style={styles.paymentAmount}>
                      -{Number(expense?.amount || 0).toFixed(2)} {t("common.currencyCode")}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={cardModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCardModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={Keyboard.dismiss} />

          <KeyboardAvoidingView
            style={styles.modalAvoid}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 24}
          >
            <ScrollView
              contentContainerStyle={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>{cardDraft.id ? t("payments.editCardTitle") : t("payments.newCardTitle")}</Text>

                <Text style={styles.label}>{t("payments.nameLabel")}</Text>
                <TextInput
                  value={cardDraft.name}
                  onChangeText={(value) => setCardDraft((prev) => ({ ...prev, name: value }))}
                  placeholder={t("payments.cardNamePlaceholder")}
                  placeholderTextColor={colors.white45}
                  style={styles.input}
                  returnKeyType="next"
                  blurOnSubmit={false}
                />

                <Text style={styles.label}>{t("payments.brandLabel")}</Text>
                <TextInput
                  value={cardDraft.brand}
                  onChangeText={(value) => setCardDraft((prev) => ({ ...prev, brand: value }))}
                  placeholder={t("payments.brandPlaceholder")}
                  placeholderTextColor={colors.white45}
                  style={styles.input}
                  returnKeyType="next"
                  blurOnSubmit={false}
                />

                <Text style={styles.label}>{t("payments.last4Label")}</Text>
                <TextInput
                  value={cardDraft.last4}
                  onChangeText={(value) =>
                    setCardDraft((prev) => ({
                      ...prev,
                      last4: String(value || "")
                        .replace(/[^\d]/g, "")
                        .slice(0, 4),
                    }))
                  }
                  keyboardType="number-pad"
                  placeholder="1234"
                  placeholderTextColor={colors.white45}
                  style={styles.input}
                  maxLength={4}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />

                <Text style={styles.label}>{t("payments.startBalanceLabel")}</Text>
                <TextInput
                  value={cardDraft.balance}
                  onChangeText={(value) => setCardDraft((prev) => ({ ...prev, balance: value }))}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.white45}
                  style={styles.input}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />

                <View style={styles.modalActions}>
                  <Pressable
                    onPress={() => !saving && setCardModalOpen(false)}
                    style={({ pressed }) => [styles.btnGhost, pressed && { opacity: 0.86 }]}
                  >
                    <Text style={styles.btnGhostText}>{t("common.cancel")}</Text>
                  </Pressable>

                  <Pressable
                    onPress={saveCard}
                    style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.86 }]}
                    disabled={saving}
                  >
                    <Text style={styles.btnPrimaryText}>{saving ? t("profile.saving") : t("common.save")}</Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={cashModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCashModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={Keyboard.dismiss} />

          <KeyboardAvoidingView
            style={styles.modalAvoid}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 24}
          >
            <ScrollView
              contentContainerStyle={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>{cashDraft.id ? t("payments.editWalletTitle") : t("payments.newWalletTitle")}</Text>

                <Text style={styles.label}>{t("payments.nameLabel")}</Text>
                <TextInput
                  value={cashDraft.name}
                  onChangeText={(value) => setCashDraft((prev) => ({ ...prev, name: value }))}
                  placeholder={t("payments.walletNamePlaceholder")}
                  placeholderTextColor={colors.white45}
                  style={styles.input}
                  returnKeyType="next"
                  blurOnSubmit={false}
                />

                <Text style={styles.label}>{t("payments.startBalanceLabel")}</Text>
                <TextInput
                  value={cashDraft.balance}
                  onChangeText={(value) => setCashDraft((prev) => ({ ...prev, balance: value }))}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.white45}
                  style={styles.input}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />

                <View style={styles.modalActions}>
                  <Pressable
                    onPress={() => !saving && setCashModalOpen(false)}
                    style={({ pressed }) => [styles.btnGhost, pressed && { opacity: 0.86 }]}
                  >
                    <Text style={styles.btnGhostText}>{t("common.cancel")}</Text>
                  </Pressable>

                  <Pressable
                    onPress={saveCashWallet}
                    style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.86 }]}
                    disabled={saving}
                  >
                    <Text style={styles.btnPrimaryText}>{saving ? t("profile.saving") : t("common.save")}</Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
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
      overflow: "hidden",
    },
    heroBlob: {
      position: "absolute",
      borderRadius: 999,
      backgroundColor: colors.accent16,
      borderWidth: 1,
      borderColor: colors.accent30,
    },
    heroBlobTop: { width: 110, height: 110, right: -30, top: -28 },
    heroBlobBottom: { width: 70, height: 70, right: 38, bottom: -28 },
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
    statsRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
    statCard: {
      flex: 1,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    statLabel: { color: colors.textMuted, fontWeight: "800", fontSize: 12 },
    statValue: { color: colors.textTitle, fontWeight: "900", marginTop: 4, fontSize: 12 },

    section: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      padding: 12,
      gap: 10,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      justifyContent: "space-between",
    },
    sectionHeadLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },
    sectionIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.white10,
    },
    sectionTitle: { color: colors.textTitle, fontWeight: "900", fontSize: 14 },
    sectionSub: { color: colors.textMuted, fontWeight: "700", fontSize: 12, marginTop: 2 },

    addBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.accent30,
      backgroundColor: colors.accent500,
    },

    empty: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    emptyText: { flex: 1, color: colors.textMuted, fontWeight: "800" },

    cardRow: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    paymentRow: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      paddingVertical: 11,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    paymentAmount: {
      color: colors.accent500,
      fontWeight: "900",
      fontSize: 12,
    },
    cardTitle: { color: colors.textTitle, fontWeight: "900" },
    cardSub: {
      marginTop: 2,
      color: colors.textMuted,
      fontWeight: "700",
      fontSize: 12,
    },
    cardSubStrong: {
      marginTop: 4,
      color: colors.textBody,
      fontWeight: "900",
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
      justifyContent: "flex-end",
      padding: 16,
      backgroundColor: colors.overlay60,
    },
    modalAvoid: {
      flex: 1,
      justifyContent: "flex-end",
    },
    modalScroll: {
      flexGrow: 1,
      justifyContent: "flex-end",
      paddingBottom: 12,
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
