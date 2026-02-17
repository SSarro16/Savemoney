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
import DateTimePickerModal from "../ui/DateTimePickerModal";
import { GlobalStyles } from "../../constants/styles";
import { CustomizationContext } from "../../context/CustomizationContext";
import { useTranslation } from "../../context/LanguageContext";
import Button from "../ui/Button";
import Card from "../ui/Card";
import TextField from "../ui/TextField";

export default function AuthContent({
  isLogin,
  onAuthenticate,
  onGoogleAuthenticate = null,
  isSubmitting = false,
  isGoogleSubmitting = false,
  isGoogleEnabled = false,
}) {
  const colors = GlobalStyles.colors;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { compactMode, textScale } = useContext(CustomizationContext);
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
  const firstNameError = firstNameInvalid ? t("auth.firstNameInvalid") : "";
  const lastNameError = lastNameInvalid ? t("auth.lastNameInvalid") : "";
  const genderError = genderInvalid ? t("auth.genderInvalid") : "";
  const dateOfBirthError = dateOfBirthInvalid ? t("auth.dateOfBirthInvalid") : "";
  const emailError = emailInvalid ? t("auth.emailInvalid") : "";
  const passwordError = passwordInvalid ? t("auth.passwordInvalid") : "";
  const confirmPasswordError = confirmPasswordInvalid ? t("auth.confirmPasswordInvalid") : "";
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
      !isLogin && (
        !isValidDate
        || parsedDate > maxBirthDate
        || parsedDate < minBirthDate
      );
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
      !nextFirstNameInvalid
      && !nextLastNameInvalid
      && !nextGenderInvalid
      && !nextDateOfBirthInvalid
      && !nextEmailInvalid
      && !nextPasswordInvalid
      && !nextConfirmPasswordInvalid
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
            {!isLogin && (
              <>
                <TextField
                  label={t("auth.firstNameLabel")}
                  value={firstName}
                  onChangeText={(value) => {
                    setFirstName(value);
                    if (firstNameInvalid) {
                      setFirstNameInvalid(false);
                    }
                  }}
                  invalid={firstNameInvalid}
                  errorText={firstNameError}
                  helperText={t("auth.firstNameHint")}
                  leftIcon="person-outline"
                  placeholder={t("auth.firstNamePlaceholder")}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => lastNameInputRef.current?.focus()}
                  autoCapitalize="words"
                  textContentType="givenName"
                  autoFocus={!isLogin}
                />

                <TextField
                  ref={lastNameInputRef}
                  label={t("auth.lastNameLabel")}
                  value={lastName}
                  onChangeText={(value) => {
                    setLastName(value);
                    if (lastNameInvalid) {
                      setLastNameInvalid(false);
                    }
                  }}
                  invalid={lastNameInvalid}
                  errorText={lastNameError}
                  helperText={t("auth.lastNameHint")}
                  leftIcon="people-outline"
                  placeholder={t("auth.lastNamePlaceholder")}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => emailInputRef.current?.focus()}
                  autoCapitalize="words"
                  textContentType="familyName"
                />

                <View style={styles.selectionGroup}>
                  <Text style={[styles.selectionLabel, { color: genderInvalid ? colors.error500 : colors.textBody }]}>
                    {t("auth.genderLabel")}
                  </Text>
                  <View style={styles.genderRow}>
                    {["male", "female"].map((option) => {
                      const isSelected = gender === option;
                      const textKey = option === "male" ? "auth.genderMale" : "auth.genderFemale";

                      return (
                        <Pressable
                          key={option}
                          onPress={() => {
                            setGender(option);
                            if (genderInvalid) {
                              setGenderInvalid(false);
                            }
                          }}
                          style={[
                            styles.genderChip,
                            isSelected
                              ? {
                                  borderColor: colors.accent35,
                                  backgroundColor: colors.accent12,
                                }
                              : {
                                  borderColor: colors.white12,
                                  backgroundColor: colors.primary800,
                                },
                          ]}
                        >
                          <Text
                            style={[
                              styles.genderChipText,
                              { color: isSelected ? colors.textTitle : colors.textBody },
                            ]}
                          >
                            {t(textKey)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {!!genderError && (
                    <Text style={[styles.selectionFeedback, { color: colors.error500 }]}>{genderError}</Text>
                  )}
                </View>

                <View style={styles.selectionGroup}>
                  <Text style={[styles.selectionLabel, { color: dateOfBirthInvalid ? colors.error500 : colors.textBody }]}>
                    {t("auth.dateOfBirthLabel")}
                  </Text>
                  <Pressable
                    onPress={() => setIsDatePickerOpen(true)}
                    style={[
                      styles.dateField,
                      dateOfBirthInvalid
                        ? { borderColor: colors.error500 }
                        : { borderColor: colors.white18 },
                      { backgroundColor: colors.primary800 },
                    ]}
                  >
                    <Ionicons name="calendar-outline" size={18} color={dateOfBirthInvalid ? colors.error500 : colors.textMuted} />
                    <Text style={[styles.dateFieldText, { color: dateOfBirth ? colors.textTitle : colors.textMuted }]}>
                      {dateOfBirthLabel}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                  </Pressable>
                  <Text style={[styles.selectionFeedback, { color: dateOfBirthInvalid ? colors.error500 : colors.textFaint }]}>
                    {dateOfBirthInvalid ? dateOfBirthError : t("auth.dateOfBirthHint")}
                  </Text>
                </View>
              </>
            )}

            <TextField
              ref={emailInputRef}
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
              autoFocus={isLogin}
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
                  ? t("auth.submitting")
                  : isLogin
                    ? t("auth.login")
                    : t("auth.signup")}
              </Button>
            </View>
            <View style={styles.altAuthWrap}>
              <View style={[styles.altAuthDivider, { backgroundColor: colors.white12 }]} />
              <Text style={[styles.altAuthLabel, { color: colors.textMuted }]}>{t("auth.orDivider")}</Text>
              <View style={[styles.altAuthDivider, { backgroundColor: colors.white12 }]} />
            </View>
            <Pressable
              onPress={onGoogleAuthenticate}
              disabled={!onGoogleAuthenticate || isGoogleSubmitting || !isGoogleEnabled || isSubmitting}
              style={[
                styles.googleButton,
                {
                  borderColor: colors.white12,
                  backgroundColor: colors.surface,
                },
                (!onGoogleAuthenticate || isGoogleSubmitting || !isGoogleEnabled || isSubmitting)
                  ? styles.googleButtonDisabled
                  : null,
              ]}
            >
              <Ionicons name="logo-google" size={16} color={colors.textTitle} />
              <Text style={[styles.googleButtonText, { color: colors.textTitle }]}>
                {isGoogleSubmitting ? t("auth.googleSubmitting") : t("auth.googleCta")}
              </Text>
            </Pressable>
            {!isGoogleEnabled && (
              <Text style={[styles.googleHintText, { color: colors.textMuted }]}>
                {t("auth.googleSetupHint")}
              </Text>
            )}

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
  selectionGroup: {
    marginVertical: 4,
  },
  selectionLabel: {
    marginBottom: 5,
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  genderRow: {
    flexDirection: "row",
    gap: 8,
  },
  genderChip: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  genderChipText: {
    fontSize: 13,
    fontWeight: "800",
  },
  dateField: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateFieldText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  selectionFeedback: {
    minHeight: 16,
    marginTop: 5,
    fontSize: 10.5,
    fontWeight: "700",
    lineHeight: 14,
  },
  actions: {
    marginTop: 12,
  },
  altAuthWrap: {
    marginTop: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  altAuthDivider: {
    flex: 1,
    height: 1,
  },
  altAuthLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  googleButton: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  googleButtonText: {
    fontSize: 13,
    fontWeight: "900",
  },
  googleButtonDisabled: {
    opacity: 0.55,
  },
  googleHintText: {
    marginTop: 6,
    textAlign: "center",
    fontSize: 10.5,
    fontWeight: "700",
    lineHeight: 14,
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
