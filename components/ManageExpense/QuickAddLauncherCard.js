import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { GlobalStyles } from "../../constants/styles";

function QuickAddLauncherCard() {
  const navigation = useNavigation();
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);

  return (
    <Pressable
      onPress={() => navigation.navigate("QuickAddExpense")}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <Ionicons name="flash-outline" size={18} color={colors.textOnAccentStrong} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Aggiunta Rapida</Text>
          <Text style={styles.sub} numberOfLines={1}>
            Aggiungi da preferiti e ricorrenze in un solo tap
          </Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export default QuickAddLauncherCard;

function makeStyles(colors) {
  return StyleSheet.create({
    card: {
      marginTop: 10,
      marginBottom: 6,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 18,
      backgroundColor: colors.white06,
      borderWidth: 1,
      borderColor: colors.white10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    pressed: {
      opacity: 0.9,
      transform: [{ scale: 0.99 }],
    },
    left: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 16,
      backgroundColor: colors.accent500,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 14,
      marginBottom: 2,
    },
    sub: {
      color: colors.textMuted,
      fontWeight: "700",
      fontSize: 12,
    },
  });
}
