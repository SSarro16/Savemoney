import { useContext } from "react";
import { StyleSheet, Text } from "react-native";

import { AuthContext } from "../../context/AuthContext";
import { Button } from "../../components/ui";
import ScreenContainer from "../ScreenContainer";
import { GlobalStyles } from "../../constants/styles";

export default function LoginScreen() {
  const { login } = useContext(AuthContext);
  const colors = GlobalStyles.colors;

  return (
    <ScreenContainer title="Savetime Login">
      <Text style={[styles.text, { color: colors.textBody }]}>Navigation auth stack is ready.</Text>
      <Button onPress={login}>Login (Mock)</Button>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    marginBottom: 12,
  },
});
