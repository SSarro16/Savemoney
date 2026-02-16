import { useContext } from "react";
import { StyleSheet, Text } from "react-native";

import { AuthContext } from "../../context/AuthContext";
import { Button } from "../../components/ui";
import ScreenContainer from "../ScreenContainer";
import { GlobalStyles } from "../../constants/styles";

export default function PlannerScreen() {
  const { logout } = useContext(AuthContext);
  const colors = GlobalStyles.colors;

  return (
    <ScreenContainer title="Planner">
      <Text style={[styles.text, { color: colors.textBody }]}>Drawer navigation is active.</Text>
      <Button variant="secondary" onPress={logout}>Logout (Mock)</Button>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    marginBottom: 12,
  },
});
