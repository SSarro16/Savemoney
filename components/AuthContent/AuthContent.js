import { useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import FlatButton from "../ui/FlatButton";
import AuthForm from "./AuthForm";
import { GlobalStyles } from "../../constants/styles";

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
      <View style={styles.header}>
        <View style={styles.logo}>
          <Ionicons
            name="wallet-outline"
            size={26}
            color={colors.textOnAccentStrong}
          />
        </View>

        <Text style={styles.title}>
          {isLogin ? "Bentornato" : "Crea il tuo account"}
        </Text>
        <Text style={styles.subtitle}>
          {isLogin
            ? "Accedi per gestire spese e budget."
            : "Registrati in pochi secondi e inizia subito."}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={[styles.cardBlob, styles.cardBlobTop]} />
        <View style={[styles.cardBlob, styles.cardBlobBottom]} />
        <AuthForm
          isLogin={isLogin}
          onSubmit={submitHandler}
          credentialsInvalid={credentialsInvalid}
          onFieldChange={handleFieldChange}
        />

        <View style={styles.footer}>
          <FlatButton onPress={switchAuthModeHandler}>
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
      maxWidth: 520,
      alignSelf: "center",
    },

    header: {
      alignItems: "center",
      marginBottom: 14,
    },
    logo: {
      width: 54,
      height: 54,
      borderRadius: 18,
      backgroundColor: colors.accent500,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
      shadowColor: "black",
      shadowOpacity: 0.35,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
    title: {
      color: colors.textTitle,
      fontSize: 22,
      fontWeight: "900",
      textAlign: "center",
    },
    subtitle: {
      marginTop: 6,
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: "700",
      textAlign: "center",
      lineHeight: 18,
    },

    card: {
      backgroundColor: colors.primary700,
      borderRadius: 22,
      padding: 18,
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
    cardBlobTop: { width: 110, height: 110, right: -24, top: -30 },
    cardBlobBottom: { width: 64, height: 64, right: 30, bottom: -24 },
    footer: {
      marginTop: 10,
      alignItems: "center",
    },
  });
}
