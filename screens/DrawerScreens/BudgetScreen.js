import React, { useContext, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlobalStyles } from "../../constants/styles";
import ManageBudget from "../../components/ManageBudget/ManageBudget";
import { BudgetContext } from "../../store/budget-context";

export default function BudgetScreen({ navigation, route }) {
  const colors = GlobalStyles.colors;
  const budgetCtx = useContext(BudgetContext);

  useEffect(() => {
    const budgetId = route?.params?.budgetId;
    if (!budgetId) return;
    budgetCtx.selectBudget?.(budgetId).catch(() => {});
  }, [route?.params?.budgetId, budgetCtx]);

  const title = String(
    budgetCtx.activeBudgetMeta?.title ||
      budgetCtx.activeBudgetMeta?.name ||
      "Nuovo budget",
  );
  const styles = makeStyles(colors);

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="wallet-outline" size={18} color={colors.textTitle} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.heroSub}>Regola totale e categorie del budget</Text>
        </View>
      </View>

      <View style={styles.formWrap}>
        <ManageBudget onSave={() => navigation.goBack()} />
      </View>
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg, padding: 12, gap: 10 },
    hero: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    heroIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
      alignItems: "center",
      justifyContent: "center",
    },
    heroTitle: { color: colors.textTitle, fontWeight: "900", fontSize: 15 },
    heroSub: { marginTop: 2, color: colors.textMuted, fontWeight: "700", fontSize: 12 },
    formWrap: {
      flex: 1,
      borderRadius: 18,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.white08,
    },
  });
}
