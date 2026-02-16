import { useContext, useMemo, useRef, useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

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
  const scheduleRows = useMemo(
    () => [t("auth.scheduleRowOne"), t("auth.scheduleRowTwo"), t("auth.scheduleRowThree")],
    [t],
  );
  const emailError = emailInvalid ? t("auth.emailInvalid") : "";
  const passwordError = passwordInvalid ? t("auth.passwordInvalid") : "";
  const confirmPasswordError = confirmPasswordInvalid ? t("auth.confirmPasswordInvalid") : "";

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
                paddingTop: Math.max(insets.top, 8),
                paddingBottom: Math.max(insets.bottom, 18),
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View style={[styles.brandingRow, { borderColor: colors.accent30, backgroundColor: colors.surface }]}>
                <View style={[styles.brandOrb, styles.brandOrbTop, { borderColor: colors.accent18, backgroundColor: colors.accent12 }]} />
                <View style={[styles.brandOrb, styles.brandOrbBottom, { borderColor: colors.white10, backgroundColor: colors.white08 }]} />
                <View style={[styles.brandingLogoWrap, { borderColor: colors.accent30, backgroundColor: colors.accent18 }]}>
                  <AppLogo size={36} borderRadius={13} />
                </View>
                <View style={styles.brandingTextWrap}>
                  <Text style={[styles.brandingTitle, { color: colors.textTitle }]}>Savetime</Text>
                  <Text style={[styles.brandingSubtitle, { color: colors.textMuted }]}>{t("common.motto")}</Text>
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

            <View style={[styles.scheduleCard, { borderColor: colors.white10, backgroundColor: colors.surface }]}>
              <View style={styles.scheduleHeaderRow}>
                <View style={[styles.scheduleIconWrap, { borderColor: colors.white10, backgroundColor: colors.surface2 }]}>
                  <Ionicons name="calendar-outline" size={14} color={colors.accent500} />
                </View>
                <Text style={[styles.scheduleTitle, { color: colors.textTitle }]}>{t("auth.scheduleCardTitle")}</Text>
              </View>
              {scheduleRows.map((item) => (
                <View key={item} style={styles.scheduleRow}>
                  <View style={[styles.scheduleDot, { backgroundColor: colors.accent500 }]} />
                  <Text style={[styles.scheduleRowText, { color: colors.textBody }]}>{item}</Text>
                </View>
              ))}
            </View>

            <Card style={[styles.formCard, { backgroundColor: colors.surface2 }]}>
            <Text style={[styles.formLegend, { color: colors.textMuted }]}>{t("auth.formLegend")}</Text>
            <TextField
              label={t("auth.emailLabel")}
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (emailInvalid) {
                  setEmailInvalid(false);
                }
              }}
              invalid={emailInvalid}
              errorText={emailError}
              helperText={t("auth.emailHint")}
              keyboardType="email-address"
              leftIcon="mail-outline"
              placeholder="name@example.com"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => passwordInputRef.current?.focus()}
              autoComplete="email"
              textContentType="username"
              autoFocus
            />

            <TextField
              ref={passwordInputRef}
              label={t("auth.passwordLabel")}
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
              errorText={passwordError}
              helperText={t("auth.passwordHint")}
              secureTextEntry
              showToggleSecure
              leftIcon="lock-closed-outline"
              placeholder={t("auth.passwordHint")}
              returnKeyType={isLogin ? "done" : "next"}
              blurOnSubmit={isLogin}
              autoComplete="password"
              textContentType="password"
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
                label={t("auth.confirmPasswordLabel")}
                value={confirmPassword}
                onChangeText={(value) => {
                  setConfirmPassword(value);
                  if (confirmPasswordInvalid) {
                    setConfirmPasswordInvalid(false);
                  }
                }}
                invalid={confirmPasswordInvalid}
                errorText={confirmPasswordError}
                helperText={t("auth.confirmPasswordHint")}
                secureTextEntry
                showToggleSecure
                leftIcon="lock-open-outline"
                placeholder={t("auth.confirmPasswordHint")}
                returnKeyType="done"
                autoComplete="password"
                textContentType="password"
                onSubmitEditing={submitHandler}
              />
            )}

            <View style={[styles.actions, { marginTop: compactMode ? 8 : 10 }]}>
              <Button onPress={submitHandler} disabled={isSubmitting}>
                {isSubmitting
                  ? "Attendere..."
                  : isLogin
                    ? t("auth.login")
                    : t("auth.signup")}
              </Button>
            </View>

            <Pressable onPress={switchModeHandler} style={styles.switchWrap} hitSlop={8}>
              <Text style={[styles.switchText, { color: colors.textBody }]}> 
                {isLogin
                  ? t("auth.switchToSignup")
                  : t("auth.switchToLogin")}
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
    paddingVertical: 18,
  },
  header: {
    marginBottom: 12,
  },
  brandingRow: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandOrb: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
  },
  brandOrbTop: {
    width: 80,
    height: 80,
    right: -20,
    top: -30,
  },
  brandOrbBottom: {
    width: 56,
    height: 56,
    left: 54,
    bottom: -30,
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
  scheduleCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 10,
    gap: 8,
  },
  scheduleHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scheduleIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scheduleTitle: {
    fontSize: 12,
    fontWeight: "900",
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  scheduleDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  scheduleRowText: {
    fontSize: 11,
    fontWeight: "800",
  },
  formCard: {
    paddingBottom: 12,
  },
  formLegend: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 4,
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
