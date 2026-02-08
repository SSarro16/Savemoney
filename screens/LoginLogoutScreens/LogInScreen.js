import { useContext, useState } from "react";
import {
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";

import AuthContent from "../../components/AuthContent/AuthContent";
import { login } from "../../util/auth";
import { fetchUserProfile } from "../../util/profile-http";
import LoadingOverlay from "../../components/ui/LoadingOverlay";
import { AuthContext } from "../../store/auth-context";
import { GlobalStyles } from "../../constants/styles";

function LoginScreen() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const authCtx = useContext(AuthContext);
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);

  async function loginHandler({ email, password }) {
    setIsAuthenticating(true);

    try {
      const response = await login(email, password);
      const profile = await fetchUserProfile(response.userId, response.token);

      await authCtx.authenticate({
        ...response,
        profile: {
          firstName: profile?.firstName || "",
          lastName: profile?.lastName || "",
          email: profile?.email || email,
        },
      });
    } catch (error) {
      Alert.alert("Accesso fallito", error?.message || "Riprova piu tardi.");
    } finally {
      setIsAuthenticating(false);
    }
  }

  if (isAuthenticating) {
    return <LoadingOverlay message="Accesso in corso..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <View style={[styles.bgBubble, styles.bgBubbleTop]} />
      <View style={[styles.bgBubble, styles.bgBubbleBottom]} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AuthContent isLogin onAuthenticate={loginHandler} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default LoginScreen;

function makeStyles(colors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.primary800,
    },
    bgBubble: {
      position: "absolute",
      borderRadius: 999,
      backgroundColor: colors.accent12,
      borderWidth: 1,
      borderColor: colors.accent18,
    },
    bgBubbleTop: {
      width: 260,
      height: 260,
      top: -120,
      right: -80,
    },
    bgBubbleBottom: {
      width: 170,
      height: 170,
      bottom: 40,
      left: -70,
    },
    scroll: {
      flexGrow: 1,
      justifyContent: "center",
      padding: 16,
    },
  });
}
