import { useContext, useMemo, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppLogo from "../ui/AppLogo";
import { GlobalStyles } from "../../constants/styles";
import { CustomizationContext } from "../../context/CustomizationContext";
import { useTranslation } from "../../context/LanguageContext";
import Button from "../ui/Button";
import Card from "../ui/Card";
import TextField from "../ui/TextField";

export default function AuthContent({ isLogin, onAuthenticate, isSubmitting = false }) {
  const colors = GlobalStyles.colors;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { compactMode, textScale } = useContext(CustomizationContext);
  const { t } = useTranslation();

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
        ? t("auth.loginSubtitle")
        : t("auth.signupSubtitle"),
    [isLogin, t],
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
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable onPress={Keyboard.dismiss} style={styles.flex}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContainer,
              {
                paddingTop: Math.max(insets.top, 10),
                paddingBottom: Math.max(insets.bottom, 14),
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View style={[styles.brandingRow, { borderColor: colors.white10, backgroundColor: colors.surface }]}>
                <View style={[styles.brandingLogoWrap, { borderColor: colors.accent30, backgroundColor: colors.accent18 }]}>
                  <AppLogo size={36} borderRadius={13} />
                </View>
                <View style={styles.brandingTextWrap}>
                  <Text style={[styles.brandingTitle, { color: colors.textTitle }]}>Savetime</Text>
                  <Text style={[styles.brandingSubtitle, { color: colors.textMuted }]}>Il tempo e denaro</Text>
                </View>
                <View style={[styles.brandingBadge, { borderColor: colors.white10, backgroundColor: colors.surface2 }]}>
                  <Ionicons name="time-outline" size={14} color={colors.textTitle} />
                </View>
              </View>

              <Text style={[styles.title, { color: colors.textTitle, fontSize: 26 * textScale }]}>
                {isLogin ? t("auth.welcomeBack") : t("auth.createAccount")}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textMuted, fontSize: 13 * textScale }]}>
                {subtitle}
              </Text>
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

            <View style={[styles.actions, { marginTop: compactMode ? 8 : 12 }]}>
              <Button onPress={submitHandler} disabled={isSubmitting}>
                {isSubmitting
                  ? "Attendere..."
                  : isLogin
                    ? t("auth.login")
                    : t("auth.signup")}
              </Button>
            </View>

            <Pressable onPress={switchModeHandler} style={styles.switchWrap}>
              <Text style={[styles.switchText, { color: colors.textBody }]}> 
                {isLogin
                  ? t("auth.noAccount")
                  : t("auth.haveAccount")}
              </Text>
            </Pressable>
            </Card>
          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  brandingRow: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 10,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandingLogoWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  brandingTextWrap: {
    flex: 1,
  },
  brandingTitle: {
    fontSize: 14,
    fontWeight: "900",
  },
  brandingSubtitle: {
    marginTop: 1,
    fontSize: 11,
    fontWeight: "700",
  },
  brandingBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
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
