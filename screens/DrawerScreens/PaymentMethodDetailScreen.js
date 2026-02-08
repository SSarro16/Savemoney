import React, { useContext, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { GlobalStyles } from "../../constants/styles";
import { PaymentContext } from "../../store/payment-context";
import { ExpensesContext } from "../../store/expenses-context";
import { formatDateIT } from "../../util/date";

function AmountCard({ title, value, icon, colors, styles }) {
  return (
    <View style={styles.amountCard}>
      <View style={styles.amountIcon}>
        <Ionicons name={icon} size={16} color={colors.textTitle} />
      </View>
      <Text style={styles.amountTitle}>{title}</Text>
      <Text style={styles.amountValue}>{value}</Text>
    </View>
  );
}

export default function PaymentMethodDetailScreen({ route, navigation }) {
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);

  const paymentCtx = useContext(PaymentContext);
  const expensesCtx = useContext(ExpensesContext);

  const methodType = route?.params?.methodType === "CARD" ? "CARD" : "CASH";
  const methodId = String(route?.params?.methodId || "").trim();

  const target = useMemo(() => {
    if (!methodId) return null;
    if (methodType === "CARD") {
      return (paymentCtx.cards || []).find((c) => String(c.id) === methodId) || null;
    }
    return (
      (paymentCtx.cashWallets || []).find((w) => String(w.id) === methodId) || null
    );
  }, [methodType, methodId, paymentCtx.cards, paymentCtx.cashWallets]);

  const movements = useMemo(() => {
    return [...(expensesCtx.expenses || [])]
      .filter((e) => {
        const type = e?.methodType === "CARD" || e?.payMethod === "CARD" ? "CARD" : "CASH";
        if (type !== methodType) return false;
        const id = String(e?.methodId || e?.cardId || e?.cashId || "").trim();
        return id === methodId;
      })
      .sort((a, b) => new Date(b?.date || 0).getTime() - new Date(a?.date || 0).getTime());
  }, [expensesCtx.expenses, methodId, methodType]);

  const spent = useMemo(() => {
    return movements.reduce((sum, item) => sum + Number(item?.amount || 0), 0);
  }, [movements]);

  const balance = Number(target?.balance || 0);
  const isCard = methodType === "CARD";
  const title = target?.name || (isCard ? "Carta" : "Contanti");
  const subtitle = isCard
    ? `${target?.brand || "Virtual"}${target?.last4 ? ` • **** ${target.last4}` : ""}`
    : target?.isDefault
      ? "Wallet predefinito"
      : "Wallet contanti";

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: 14, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.visualCard}>
        <View style={[styles.blob, styles.blobOne]} />
        <View style={[styles.blob, styles.blobTwo]} />

        <View style={styles.visualTop}>
          <View style={styles.visualIcon}>
            <Ionicons
              name={isCard ? "card-outline" : "wallet-outline"}
              size={18}
              color={colors.textTitle}
            />
          </View>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85 }]}
          >
            <Ionicons name="chevron-back" size={18} color={colors.textTitle} />
          </Pressable>
        </View>

        <Text style={styles.visualTitle}>{title}</Text>
        <Text style={styles.visualSub}>{subtitle}</Text>

        <View style={styles.visualFooter}>
          <Text style={styles.visualLabel}>Saldo corrente</Text>
          <Text style={styles.visualAmount}>{balance.toFixed(2)} EUR</Text>
        </View>
      </View>

      <View style={styles.amountRow}>
        <AmountCard
          title="Spese totali"
          value={`${spent.toFixed(2)} EUR`}
          icon="trending-down-outline"
          colors={colors}
          styles={styles}
        />
        <AmountCard
          title="Movimenti"
          value={String(movements.length)}
          icon="receipt-outline"
          colors={colors}
          styles={styles}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ultimi movimenti</Text>
        <Text style={styles.sectionSub}>Transazioni collegate a questo metodo</Text>

        {!movements.length ? (
          <View style={styles.empty}>
            <Ionicons name="sparkles-outline" size={18} color={colors.textMuted} />
            <Text style={styles.emptyText}>Nessun movimento registrato.</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {movements.slice(0, 30).map((item) => (
              <View key={item.id} style={styles.row}>
                <View style={styles.rowIcon}>
                  <Ionicons name={item.icon || "pricetag-outline"} size={16} color={colors.textTitle} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {String(item?.description || "Spesa")}
                  </Text>
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {formatDateIT(item?.date)}
                  </Text>
                </View>
                <Text style={styles.rowAmount}>-{Number(item?.amount || 0).toFixed(2)} EUR</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    visualCard: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      padding: 16,
      overflow: "hidden",
      marginBottom: 12,
    },
    blob: {
      position: "absolute",
      borderRadius: 999,
      backgroundColor: colors.accent18,
      borderWidth: 1,
      borderColor: colors.accent30,
    },
    blobOne: { width: 140, height: 140, right: -52, top: -38 },
    blobTwo: { width: 100, height: 100, right: 42, bottom: -44 },
    visualTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    visualIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
    },
    visualTitle: { color: colors.textTitle, fontWeight: "900", fontSize: 20 },
    visualSub: { marginTop: 4, color: colors.textMuted, fontWeight: "800", fontSize: 12 },
    visualFooter: { marginTop: 26 },
    visualLabel: { color: colors.textMuted, fontWeight: "800", fontSize: 12 },
    visualAmount: { marginTop: 4, color: colors.textTitle, fontWeight: "900", fontSize: 24 },

    amountRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
    amountCard: {
      flex: 1,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      padding: 12,
    },
    amountIcon: {
      width: 30,
      height: 30,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white08,
      marginBottom: 8,
    },
    amountTitle: { color: colors.textMuted, fontWeight: "800", fontSize: 12 },
    amountValue: { marginTop: 3, color: colors.textTitle, fontWeight: "900" },

    section: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      padding: 12,
      gap: 10,
    },
    sectionTitle: { color: colors.textTitle, fontWeight: "900", fontSize: 14 },
    sectionSub: { color: colors.textMuted, fontWeight: "700", fontSize: 12 },
    empty: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    emptyText: { color: colors.textMuted, fontWeight: "800", flex: 1 },
    row: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      padding: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    rowIcon: {
      width: 32,
      height: 32,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
      alignItems: "center",
      justifyContent: "center",
    },
    rowTitle: { color: colors.textTitle, fontWeight: "900" },
    rowSub: { marginTop: 2, color: colors.textMuted, fontWeight: "700", fontSize: 12 },
    rowAmount: { color: colors.accent500, fontWeight: "900", fontSize: 12 },
  });
}
