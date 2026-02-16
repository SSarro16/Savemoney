import { useContext } from "react";
import { StyleSheet, Text } from "react-native";

import { AuthContext } from "../../context/AuthContext";
import { Button } from "../../components/ui";
import ScreenContainer from "../ScreenContainer";
import { GlobalStyles } from "../../constants/styles";

export default function SignupScreen() {
  const { signup } = useContext(AuthContext);
  const colors = GlobalStyles.colors;

  return (
    <ScreenContainer title="Create account">
      <Text style={[styles.text, { color: colors.textBody }]}>Signup screen placeholder for TASK05.</Text>
      <Button onPress={signup}>Signup (Mock)</Button>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    marginBottom: 12,
  },
});
