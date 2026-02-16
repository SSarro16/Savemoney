import { StyleSheet, Text } from "react-native";

import ScreenContainer from "../ScreenContainer";
import { GlobalStyles } from "../../constants/styles";

export default function SettingsScreen() {
  const colors = GlobalStyles.colors;

  return (
    <ScreenContainer title="Settings">
      <Text style={[styles.text, { color: colors.textBody }]}>Settings screen placeholder.</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    marginBottom: 12,
  },
});
