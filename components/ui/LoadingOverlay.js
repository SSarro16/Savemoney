import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { GlobalStyles } from "../../constants/styles";

export default function LoadingOverlay({ message = "Loading..." }) {
  const colors = GlobalStyles.colors;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface2,
            borderColor: colors.border,
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.accent500} />
        <Text style={[styles.text, { color: colors.textBody }]}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
  },
  text: {
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
});
