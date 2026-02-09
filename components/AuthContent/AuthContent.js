import { useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import FlatButton from "../ui/FlatButton";
import AuthForm from "./AuthForm";
import { GlobalStyles } from "../../constants/styles";
import AppLogo from "../ui/AppLogo";
import { useTranslation } from "../../store/language-context";

function AuthContent({ isLogin, onAuthenticate }) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);

  const [credentialsInvalid, setCredentialsInvalid] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirmPassword: false,
    dateOfBirth: false,
  });

  function switchAuthModeHandler() {
    if (isLogin) navigation.replace("Signup");
    else navigation.replace("Login");
  }

  function submitHandler(credentials) {
    let {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      gender,
      dateOfBirth,
    } = credentials;

    firstName = String(firstName || "").trim();
    lastName = String(lastName || "").trim();
    email = String(email || "").trim();
    password = String(password || "").trim();
    confirmPassword = String(confirmPassword || "").trim();
    gender = String(gender || "").trim();
    const parsedDateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    const now = new Date();
    const dateOfBirthIsValid =
      !isLogin &&
      parsedDateOfBirth instanceof Date &&
      !Number.isNaN(parsedDateOfBirth.getTime()) &&
      parsedDateOfBirth <= now;

    const emailIsValid = email.includes("@");
    const passwordIsValid = password.length >= 6;
    const passwordsAreEqual = password === confirmPassword;

    if (
      !emailIsValid ||
      !passwordIsValid ||
      (!isLogin && (!passwordsAreEqual || !dateOfBirthIsValid))
    ) {
      setCredentialsInvalid({
        firstName: false,
        lastName: false,
        email: !emailIsValid,
        password: !passwordIsValid,
        confirmPassword: !isLogin && (!passwordIsValid || !passwordsAreEqual),
        dateOfBirth: !isLogin && !dateOfBirthIsValid,
      });
      return;
    }

    setCredentialsInvalid({
      firstName: false,
      lastName: false,
      email: false,
      password: false,
      confirmPassword: false,
      dateOfBirth: false,
    });

    onAuthenticate({
      email,
      password,
      firstName,
      lastName,
      gender,
      dateOfBirth: parsedDateOfBirth ? parsedDateOfBirth.toISOString() : "",
    });
  }

  function handleFieldChange(field) {
    setCredentialsInvalid((prev) => {
      if (field === "firstName" && !prev.firstName) return prev;
      if (field === "lastName" && !prev.lastName) return prev;
      if (field === "email" && !prev.email) return prev;
      if (field === "password" && !prev.password && !prev.confirmPassword) return prev;
      if (field === "confirmPassword" && !prev.confirmPassword) return prev;
      if (field === "dateOfBirth" && !prev.dateOfBirth) return prev;

      if (field === "firstName") return { ...prev, firstName: false };
      if (field === "lastName") return { ...prev, lastName: false };
      if (field === "email") return { ...prev, email: false };
      if (field === "password") return { ...prev, password: false, confirmPassword: false };
      if (field === "confirmPassword") return { ...prev, confirmPassword: false };
      if (field === "dateOfBirth") return { ...prev, dateOfBirth: false };
      return prev;
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.identityCard}>
        <View style={styles.identityLogoWrap}>
          <AppLogo size={58} borderRadius={22} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.identityEyebrow}>Savemoney</Text>
          <Text style={styles.identityTitle}>
            {isLogin ? t("auth.privateArea") : t("auth.newAccount")}
          </Text>
          <Text style={styles.identitySub}>{t("auth.premiumControl")}</Text>
        </View>
        <View style={styles.identityBadge}>
          <Ionicons
            name={isLogin ? "log-in-outline" : "sparkles-outline"}
            size={12}
            color={colors.textOnAccentStrong}
          />
          <Text style={styles.identityBadgeText}>
            {isLogin ? t("auth.loginBadge") : t("auth.signupBadge")}
          </Text>
        </View>
      </View>

      <Text style={styles.title}>
        {isLogin ? t("auth.welcomeBack") : t("auth.createYourSpace")}
      </Text>
      <Text style={styles.subtitle}>
        {isLogin
          ? t("auth.loginSubtitle")
          : t("auth.signupSubtitle")}
      </Text>

      <View style={styles.card}>
        <View style={[styles.cardBlob, styles.cardBlobTop]} />
        <View style={[styles.cardBlob, styles.cardBlobMid]} />
        <View style={[styles.cardBlob, styles.cardBlobBottom]} />

        <View style={styles.formHeader}>
          <View style={styles.formHeaderIcon}>
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.textTitle} />
          </View>
          <Text style={styles.formHeaderText}>
            {isLogin ? t("auth.secureAccess") : t("auth.secureOnboarding")}
          </Text>
        </View>
        <AuthForm
          isLogin={isLogin}
          onSubmit={submitHandler}
          credentialsInvalid={credentialsInvalid}
          onFieldChange={handleFieldChange}
        />

        <View style={styles.footer}>
          <FlatButton mode="primary" onPress={switchAuthModeHandler}>
            {isLogin
              ? t("auth.createNewAccount")
              : t("auth.alreadyHaveAccount")}
          </FlatButton>
        </View>
      </View>
    </View>
  );
}

export default AuthContent;

function makeStyles(colors) {
  return StyleSheet.create({
    container: {
      width: "100%",
      maxWidth: 560,
      alignSelf: "center",
      paddingVertical: 6,
    },
    identityCard: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      paddingVertical: 12,
      paddingHorizontal: 12,
      marginBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    identityLogoWrap: {
      width: 60,
      height: 60,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.accent30,
      backgroundColor: colors.white08,
    },
    identityEyebrow: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    identityTitle: {
      marginTop: 1,
      color: colors.textTitle,
      fontSize: 16,
      fontWeight: "900",
    },
    identitySub: {
      marginTop: 1,
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: "700",
    },
    identityBadge: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.accent30,
      backgroundColor: colors.accent500,
      paddingVertical: 5,
      paddingHorizontal: 9,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    identityBadgeText: {
      color: colors.textOnAccentStrong,
      fontWeight: "900",
      fontSize: 10,
      letterSpacing: 0.3,
    },
    title: {
      color: colors.textTitle,
      fontSize: 28,
      fontWeight: "900",
      lineHeight: 32,
    },
    subtitle: {
      marginTop: 4,
      marginBottom: 14,
      color: colors.textMuted,
      fontSize: 13.5,
      fontWeight: "700",
      lineHeight: 18,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.white10,
      overflow: "hidden",
      shadowColor: "black",
      shadowOpacity: 0.3,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
      elevation: 10,
    },
    cardBlob: {
      position: "absolute",
      borderRadius: 999,
      backgroundColor: colors.accent12,
      borderWidth: 1,
      borderColor: colors.accent18,
    },
    cardBlobTop: { width: 130, height: 130, right: -34, top: -40 },
    cardBlobMid: { width: 70, height: 70, right: 88, top: 18 },
    cardBlobBottom: { width: 84, height: 84, left: -30, bottom: -34 },
    formHeader: {
      marginBottom: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    formHeaderIcon: {
      width: 24,
      height: 24,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.white12,
      backgroundColor: colors.white08,
    },
    formHeaderText: {
      color: colors.textMuted,
      fontWeight: "900",
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    footer: {
      marginTop: 14,
      alignItems: "center",
    },
  });
}
