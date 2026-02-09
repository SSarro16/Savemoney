import { useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import FlatButton from "../ui/FlatButton";
import AuthForm from "./AuthForm";
import { GlobalStyles } from "../../constants/styles";
import AppLogo from "../ui/AppLogo";

function AuthContent({ isLogin, onAuthenticate }) {
  const navigation = useNavigation();
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);

  const [credentialsInvalid, setCredentialsInvalid] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirmEmail: false,
    confirmPassword: false,
  });

  function switchAuthModeHandler() {
    if (isLogin) navigation.replace("Registrazione");
    else navigation.replace("Accedi");
  }

  function submitHandler(credentials) {
    let {
      firstName,
      lastName,
      email,
      confirmEmail,
      password,
      confirmPassword,
    } = credentials;

    firstName = String(firstName || "").trim();
    lastName = String(lastName || "").trim();
    email = String(email || "").trim();
    password = String(password || "").trim();
    confirmEmail = String(confirmEmail || "").trim();
    confirmPassword = String(confirmPassword || "").trim();

    const firstNameIsValid = firstName.length >= 2;
    const lastNameIsValid = lastName.length >= 2;
    const emailIsValid = email.includes("@");
    const passwordIsValid = password.length >= 6;
    const emailsAreEqual = email === confirmEmail;
    const passwordsAreEqual = password === confirmPassword;

    if (
      !emailIsValid ||
      !passwordIsValid ||
      (!isLogin &&
        (!firstNameIsValid ||
          !lastNameIsValid ||
          !emailsAreEqual ||
          !passwordsAreEqual))
    ) {
      setCredentialsInvalid({
        firstName: !isLogin && !firstNameIsValid,
        lastName: !isLogin && !lastNameIsValid,
        email: !emailIsValid,
        confirmEmail: !isLogin && (!emailIsValid || !emailsAreEqual),
        password: !passwordIsValid,
        confirmPassword: !isLogin && (!passwordIsValid || !passwordsAreEqual),
      });
      return;
    }

    setCredentialsInvalid({
      firstName: false,
      lastName: false,
      email: false,
      password: false,
      confirmEmail: false,
      confirmPassword: false,
    });

    onAuthenticate({
      email,
      password,
      firstName,
      lastName,
    });
  }

  function handleFieldChange(field) {
    setCredentialsInvalid((prev) => {
      if (field === "firstName" && !prev.firstName) return prev;
      if (field === "lastName" && !prev.lastName) return prev;
      if (field === "email" && !prev.email && !prev.confirmEmail) return prev;
      if (field === "confirmEmail" && !prev.confirmEmail) return prev;
      if (field === "password" && !prev.password && !prev.confirmPassword) return prev;
      if (field === "confirmPassword" && !prev.confirmPassword) return prev;

      if (field === "firstName") return { ...prev, firstName: false };
      if (field === "lastName") return { ...prev, lastName: false };
      if (field === "email") return { ...prev, email: false, confirmEmail: false };
      if (field === "confirmEmail") return { ...prev, confirmEmail: false };
      if (field === "password") return { ...prev, password: false, confirmPassword: false };
      if (field === "confirmPassword") return { ...prev, confirmPassword: false };
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
            {isLogin ? "Area Privata" : "Nuovo Account"}
          </Text>
          <Text style={styles.identitySub}>Controllo spese con stile premium</Text>
        </View>
        <View style={styles.identityBadge}>
          <Ionicons
            name={isLogin ? "log-in-outline" : "sparkles-outline"}
            size={12}
            color={colors.textOnAccentStrong}
          />
          <Text style={styles.identityBadgeText}>
            {isLogin ? "LOGIN" : "SIGNUP"}
          </Text>
        </View>
      </View>

      <Text style={styles.title}>
        {isLogin ? "Bentornato." : "Crea il tuo spazio."}
      </Text>
      <Text style={styles.subtitle}>
        {isLogin
          ? "Accedi e continua a monitorare entrate e uscite."
          : "Registrati e inizia a tracciare spese, budget e obiettivi."}
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
            {isLogin ? "Accesso sicuro" : "Onboarding protetto"}
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
            {isLogin ? "Crea un nuovo account" : "Hai gia un account? Accedi"}
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
