import { StyleSheet, View } from "react-native";

import { GlobalStyles } from "../../constants/styles";

export default function Card({ children, style }) {
  const colors = GlobalStyles.colors;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.white10,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "black",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
});
