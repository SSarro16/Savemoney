import { useMemo, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import { GlobalStyles } from "../../constants/styles";
import { Button, Card, TextField } from "../ui";

export default function AuthContent({ isLogin, onAuthenticate, isSubmitting = false }) {
  const colors = GlobalStyles.colors;
  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailInvalid, setEmailInvalid] = useState(false);
  const [passwordInvalid, setPasswordInvalid] = useState(false);
  const [confirmPasswordInvalid, setConfirmPasswordInvalid] = useState(false);

  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  const subtitle = useMemo(
    () =>
      isLogin
        ? "Accedi per gestire il tuo planner tempo/eventi."
        : "Crea un account per iniziare a pianificare.",
    [isLogin],
  );

  const validate = () => {
    const trimmedEmail = String(email || "").trim();
    const trimmedPassword = String(password || "").trim();
    const trimmedConfirmPassword = String(confirmPassword || "").trim();

    const nextEmailInvalid = !trimmedEmail.includes("@");
    const nextPasswordInvalid = trimmedPassword.length < 6;
    const nextConfirmPasswordInvalid = !isLogin && trimmedPassword !== trimmedConfirmPassword;

    setEmailInvalid(nextEmailInvalid);
    setPasswordInvalid(nextPasswordInvalid);
    setConfirmPasswordInvalid(nextConfirmPasswordInvalid);

    return !nextEmailInvalid && !nextPasswordInvalid && !nextConfirmPasswordInvalid;
  };

  const submitHandler = async () => {
    if (!validate()) {
      return;
    }

    await onAuthenticate({
      email: String(email || "").trim(),
      password: String(password || "").trim(),
    });
  };

  const switchModeHandler = () => {
    if (isLogin) {
      navigation.replace("Signup");
      return;
    }
    navigation.replace("Login");
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Pressable onPress={Keyboard.dismiss} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textTitle }]}>
              {isLogin ? "Bentornato su Savetime" : "Crea il tuo account"}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
          </View>

          <Card style={{ backgroundColor: colors.surface2 }}>
            <TextField
              label="Email"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (emailInvalid) {
                  setEmailInvalid(false);
                }
              }}
              invalid={emailInvalid}
              keyboardType="email-address"
              leftIcon="mail-outline"
              placeholder="name@example.com"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => passwordInputRef.current?.focus()}
              autoFocus
            />

            <TextField
              ref={passwordInputRef}
              label="Password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                if (passwordInvalid) {
                  setPasswordInvalid(false);
                }
                if (confirmPasswordInvalid) {
                  setConfirmPasswordInvalid(false);
                }
              }}
              invalid={passwordInvalid}
              secureTextEntry
              showToggleSecure
              leftIcon="lock-closed-outline"
              placeholder="Min. 6 caratteri"
              returnKeyType={isLogin ? "done" : "next"}
              blurOnSubmit={isLogin}
              onSubmitEditing={() => {
                if (isLogin) {
                  submitHandler();
                } else {
                  confirmPasswordInputRef.current?.focus();
                }
              }}
            />

            {!isLogin && (
              <TextField
                ref={confirmPasswordInputRef}
                label="Conferma password"
                value={confirmPassword}
                onChangeText={(value) => {
                  setConfirmPassword(value);
                  if (confirmPasswordInvalid) {
                    setConfirmPasswordInvalid(false);
                  }
                }}
                invalid={confirmPasswordInvalid}
                secureTextEntry
                showToggleSecure
                leftIcon="lock-open-outline"
                placeholder="Ripeti password"
                returnKeyType="done"
                onSubmitEditing={submitHandler}
              />
            )}

            <View style={styles.actions}>
              <Button onPress={submitHandler} disabled={isSubmitting}>
                {isSubmitting
                  ? "Attendere..."
                  : isLogin
                    ? "Login"
                    : "Crea account"}
              </Button>
            </View>

            <Pressable onPress={switchModeHandler} style={styles.switchWrap}>
              <Text style={[styles.switchText, { color: colors.textBody }]}> 
                {isLogin
                  ? "Non hai un account? Registrati"
                  : "Hai gia un account? Accedi"}
              </Text>
            </Pressable>
          </Card>
        </ScrollView>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 22,
  },
  header: {
    marginBottom: 14,
  },
  title: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "900",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  actions: {
    marginTop: 12,
  },
  switchWrap: {
    marginTop: 12,
    alignItems: "center",
  },
  switchText: {
    fontSize: 13,
    fontWeight: "800",
  },
});
