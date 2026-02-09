import { useContext, useState } from "react";
import {
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";

import AuthContent from "../../components/AuthContent/AuthContent";
import { createUser } from "../../util/auth";
import { saveUserProfile } from "../../util/profile-http";
import LoadingOverlay from "../../components/ui/LoadingOverlay";
import { AuthContext } from "../../store/auth-context";
import { GlobalStyles } from "../../constants/styles";
import { logger } from "../../util/logger";

function SignupScreen() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const authCtx = useContext(AuthContext);
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);

  async function signupHandler({ email, password, firstName, lastName }) {
    setIsAuthenticating(true);

    try {
      const response = await createUser(email, password);

      await authCtx.authenticate({
        ...response,
        profile: { firstName, lastName, email },
      });

      try {
        await saveUserProfile(response.userId, response.token, {
          firstName,
          lastName,
          email,
        });
      } catch (profileError) {
        logger.warn("saveUserProfile signup warning", profileError);
      }
    } catch (error) {
      Alert.alert("Registrazione fallita", error?.message || "Riprova piu tardi.");
    } finally {
      setIsAuthenticating(false);
    }
  }

  if (isAuthenticating) {
    return <LoadingOverlay message="Creazione account..." />;
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
        <AuthContent isLogin={false} onAuthenticate={signupHandler} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default SignupScreen;

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
