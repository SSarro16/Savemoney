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
import {
  Button as PaperButton,
  HelperText,
  MD3DarkTheme,
  MD3LightTheme,
  PaperProvider,
  SegmentedButtons,
  Surface,
  TextInput,
} from "react-native-paper";

import AppLogo from "../ui/AppLogo";
import DateTimePickerModal from "../ui/DateTimePickerModal";
import { GlobalStyles } from "../../constants/styles";
import { CustomizationContext } from "../../context/CustomizationContext";
import { useTranslation } from "../../context/LanguageContext";

export default function AuthContent({
  isLogin,
  onAuthenticate,
  onGoogleAuthenticate = null,
  isSubmitting = false,
  isGoogleSubmitting = false,
  isGoogleEnabled = false,
  googleHintText = null,
}) {
  const colors = GlobalStyles.colors;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { textScale } = useContext(CustomizationContext);
  const { t, language } = useTranslation();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [firstNameInvalid, setFirstNameInvalid] = useState(false);
  const [lastNameInvalid, setLastNameInvalid] = useState(false);
  const [genderInvalid, setGenderInvalid] = useState(false);
  const [dateOfBirthInvalid, setDateOfBirthInvalid] = useState(false);
  const [emailInvalid, setEmailInvalid] = useState(false);
  const [passwordInvalid, setPasswordInvalid] = useState(false);
  const [confirmPasswordInvalid, setConfirmPasswordInvalid] = useState(false);

  const lastNameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  const isDarkTheme = colors.textTitle === "#ffffff";
  const basePaperTheme = isDarkTheme ? MD3DarkTheme : MD3LightTheme;
  const paperTheme = useMemo(
    () => ({
      ...basePaperTheme,
      roundness: 14,
      colors: {
        ...basePaperTheme.colors,
        primary: colors.accent500,
        onPrimary: colors.textOnAccentStrong,
        background: colors.bg,
        surface: colors.surface,
        surfaceVariant: colors.surface2,
        onSurface: colors.textTitle,
        onSurfaceVariant: colors.textMuted,
        outline: colors.white18,
        error: colors.error500,
      },
    }),
    [basePaperTheme, colors],
  );

  const subtitle = isLogin ? t("auth.loginSubtitle") : t("auth.signupSubtitle");
  const dateOfBirthLabel = dateOfBirth
    ? dateOfBirth.toLocaleDateString(language === "it" ? "it-IT" : "en-US")
    : t("auth.dateOfBirthPlaceholder");

  const validate = () => {
    const trimmedFirstName = String(firstName || "").trim();
    const trimmedLastName = String(lastName || "").trim();
    const normalizedGender = String(gender || "").trim().toLowerCase();
    const parsedDate = dateOfBirth instanceof Date ? dateOfBirth : null;
    const isValidDate = parsedDate && !Number.isNaN(parsedDate.getTime());
    const minBirthDate = new Date("1900-01-01T00:00:00.000Z");
    const maxBirthDate = new Date();
    const trimmedEmail = String(email || "").trim();
    const trimmedPassword = String(password || "").trim();
    const trimmedConfirmPassword = String(confirmPassword || "").trim();

    const nextFirstNameInvalid = !isLogin && trimmedFirstName.length === 0;
    const nextLastNameInvalid = !isLogin && trimmedLastName.length === 0;
    const nextGenderInvalid =
      !isLogin && !(normalizedGender === "male" || normalizedGender === "female");
    const nextDateOfBirthInvalid =
      !isLogin &&
      (!isValidDate || parsedDate > maxBirthDate || parsedDate < minBirthDate);
    const nextEmailInvalid = !trimmedEmail.includes("@");
    const nextPasswordInvalid = trimmedPassword.length < 6;
    const nextConfirmPasswordInvalid = !isLogin && trimmedPassword !== trimmedConfirmPassword;

    setFirstNameInvalid(nextFirstNameInvalid);
    setLastNameInvalid(nextLastNameInvalid);
    setGenderInvalid(nextGenderInvalid);
    setDateOfBirthInvalid(nextDateOfBirthInvalid);
    setEmailInvalid(nextEmailInvalid);
    setPasswordInvalid(nextPasswordInvalid);
    setConfirmPasswordInvalid(nextConfirmPasswordInvalid);

    return (
      !nextFirstNameInvalid &&
      !nextLastNameInvalid &&
      !nextGenderInvalid &&
      !nextDateOfBirthInvalid &&
      !nextEmailInvalid &&
      !nextPasswordInvalid &&
      !nextConfirmPasswordInvalid
    );
  };

  const submitHandler = async () => {
    if (!validate()) {
      return;
    }

    const payload = {
      email: String(email || "").trim(),
      password: String(password || "").trim(),
    };

    if (!isLogin) {
      payload.firstName = String(firstName || "").trim();
      payload.lastName = String(lastName || "").trim();
      payload.gender = String(gender || "").trim().toLowerCase();
      payload.dateOfBirth = dateOfBirth;
    }

    await onAuthenticate(payload);
  };

  const switchModeHandler = () => {
    if (isLogin) {
      navigation.replace("Signup");
      return;
    }
    navigation.replace("Login");
  };

  return (
    <PaperProvider theme={paperTheme}>
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
                  paddingBottom: Math.max(insets.bottom, 18),
                },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Surface
                elevation={0}
                style={[
                  styles.headerCard,
                  { borderColor: colors.accent30, backgroundColor: colors.surface },
                ]}
              >
                <View style={[styles.brandingLogoWrap, { borderColor: colors.accent30, backgroundColor: colors.accent18 }]}>
                  <AppLogo size={36} borderRadius={13} />
                </View>
                <View style={styles.brandingTextWrap}>
                  <Text style={[styles.brandingTitle, { color: colors.textTitle }]}>Savetime</Text>
                  <Text style={[styles.brandingSubtitle, { color: colors.textMuted }]}>{t("common.motto")}</Text>
                </View>
              </Surface>

              <Text style={[styles.title, { color: colors.textTitle, fontSize: 26 * textScale }]}>
                {isLogin ? t("auth.welcomeBack") : t("auth.createAccount")}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {subtitle}
              </Text>

              <Surface
                elevation={0}
                style={[styles.formCard, { borderColor: colors.white12, backgroundColor: colors.surface2 }]}
              >
                {!isLogin && (
                  <>
                    <TextInput
                      mode="outlined"
                      label={t("auth.firstNameLabel")}
                      value={firstName}
                      onChangeText={(value) => {
                        setFirstName(value);
                        if (firstNameInvalid) setFirstNameInvalid(false);
                      }}
                      error={firstNameInvalid}
                      autoCapitalize="words"
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => lastNameInputRef.current?.focus?.()}
                      left={<TextInput.Icon icon="account-outline" />}
                      style={styles.input}
                      textColor={colors.textTitle}
                    />
                    <HelperText type="error" visible={firstNameInvalid}>
                      {t("auth.firstNameInvalid")}
                    </HelperText>

                    <TextInput
                      ref={lastNameInputRef}
                      mode="outlined"
                      label={t("auth.lastNameLabel")}
                      value={lastName}
                      onChangeText={(value) => {
                        setLastName(value);
                        if (lastNameInvalid) setLastNameInvalid(false);
                      }}
                      error={lastNameInvalid}
                      autoCapitalize="words"
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => emailInputRef.current?.focus?.()}
                      left={<TextInput.Icon icon="account-multiple-outline" />}
                      style={styles.input}
                      textColor={colors.textTitle}
                    />
                    <HelperText type="error" visible={lastNameInvalid}>
                      {t("auth.lastNameInvalid")}
                    </HelperText>

                    <SegmentedButtons
                      value={gender}
                      onValueChange={(value) => {
                        setGender(value);
                        if (genderInvalid) setGenderInvalid(false);
                      }}
                      buttons={[
                        { value: "male", label: t("auth.genderMale") },
                        { value: "female", label: t("auth.genderFemale") },
                      ]}
                      style={styles.segmented}
                    />
                    <HelperText type="error" visible={genderInvalid}>
                      {t("auth.genderInvalid")}
                    </HelperText>

                    <Pressable
                      onPress={() => setIsDatePickerOpen(true)}
                      style={[
                        styles.dateField,
                        {
                          borderColor: dateOfBirthInvalid ? colors.error500 : colors.white18,
                          backgroundColor: colors.surface,
                        },
                      ]}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={18}
                        color={dateOfBirthInvalid ? colors.error500 : colors.textMuted}
                      />
                      <Text style={[styles.dateFieldText, { color: dateOfBirth ? colors.textTitle : colors.textMuted }]}>
                        {dateOfBirthLabel}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                    </Pressable>
                    <HelperText type={dateOfBirthInvalid ? "error" : "info"} visible>
                      {dateOfBirthInvalid ? t("auth.dateOfBirthInvalid") : t("auth.dateOfBirthHint")}
                    </HelperText>
                  </>
                )}

                <TextInput
                  ref={emailInputRef}
                  mode="outlined"
                  label={t("auth.emailLabel")}
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    if (emailInvalid) setEmailInvalid(false);
                  }}
                  error={emailInvalid}
                  keyboardType="email-address"
                  autoComplete="email"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => passwordInputRef.current?.focus?.()}
                  left={<TextInput.Icon icon="email-outline" />}
                  style={styles.input}
                  textColor={colors.textTitle}
                />
                <HelperText type="error" visible={emailInvalid}>
                  {t("auth.emailInvalid")}
                </HelperText>

                <TextInput
                  ref={passwordInputRef}
                  mode="outlined"
                  label={t("auth.passwordLabel")}
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    if (passwordInvalid) setPasswordInvalid(false);
                    if (confirmPasswordInvalid) setConfirmPasswordInvalid(false);
                  }}
                  error={passwordInvalid}
                  secureTextEntry
                  autoComplete="password"
                  returnKeyType={isLogin ? "done" : "next"}
                  blurOnSubmit={isLogin}
                  onSubmitEditing={() => {
                    if (isLogin) {
                      submitHandler();
                    } else {
                      confirmPasswordInputRef.current?.focus?.();
                    }
                  }}
                  left={<TextInput.Icon icon="lock-outline" />}
                  style={styles.input}
                  textColor={colors.textTitle}
                />
                <HelperText type="error" visible={passwordInvalid}>
                  {t("auth.passwordInvalid")}
                </HelperText>

                {!isLogin && (
                  <>
                    <TextInput
                      ref={confirmPasswordInputRef}
                      mode="outlined"
                      label={t("auth.confirmPasswordLabel")}
                      value={confirmPassword}
                      onChangeText={(value) => {
                        setConfirmPassword(value);
                        if (confirmPasswordInvalid) setConfirmPasswordInvalid(false);
                      }}
                      error={confirmPasswordInvalid}
                      secureTextEntry
                      autoComplete="password"
                      returnKeyType="done"
                      onSubmitEditing={submitHandler}
                      left={<TextInput.Icon icon="lock-check-outline" />}
                      style={styles.input}
                      textColor={colors.textTitle}
                    />
                    <HelperText type="error" visible={confirmPasswordInvalid}>
                      {t("auth.confirmPasswordInvalid")}
                    </HelperText>
                  </>
                )}

                <PaperButton
                  mode="contained"
                  onPress={submitHandler}
                  disabled={isSubmitting}
                  buttonColor={colors.accent500}
                  textColor={colors.textOnAccentStrong}
                  style={styles.primaryButton}
                >
                  {isSubmitting
                    ? t("auth.submitting")
                    : isLogin
                      ? t("auth.login")
                      : t("auth.signup")}
                </PaperButton>

                <PaperButton
                  mode="outlined"
                  icon="google"
                  onPress={onGoogleAuthenticate}
                  disabled={!onGoogleAuthenticate || isGoogleSubmitting || !isGoogleEnabled || isSubmitting}
                  style={styles.googleButton}
                  textColor={colors.textTitle}
                >
                  {isGoogleSubmitting ? t("auth.googleSubmitting") : t("auth.googleCta")}
                </PaperButton>

                {!isGoogleEnabled && (
                  <HelperText type="info" visible style={{ color: colors.textMuted }}>
                    {googleHintText || t("auth.googleSetupHint")}
                  </HelperText>
                )}
              </Surface>

              <Pressable onPress={switchModeHandler} style={styles.switchWrap} hitSlop={8}>
                <Text style={[styles.switchText, { color: colors.textBody }]}>
                  {isLogin ? t("auth.switchToSignup") : t("auth.switchToLogin")}
                </Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>

        <DateTimePickerModal
          visible={isDatePickerOpen}
          mode="date"
          value={dateOfBirth || new Date("2000-01-01T00:00:00.000Z")}
          title={t("auth.dateOfBirthTitle")}
          onCancel={() => setIsDatePickerOpen(false)}
          onConfirm={(selectedDate) => {
            setDateOfBirth(selectedDate);
            setDateOfBirthInvalid(false);
            setIsDatePickerOpen(false);
          }}
        />
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
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
  title: {
    fontWeight: "900",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
  },
  input: {
    marginTop: 2,
  },
  segmented: {
    marginTop: 4,
    marginBottom: 2,
  },
  dateField: {
    marginTop: 4,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateFieldText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  primaryButton: {
    marginTop: 8,
    borderRadius: 14,
  },
  googleButton: {
    marginTop: 8,
    borderRadius: 14,
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
