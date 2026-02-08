import { useEffect, useRef, useState } from "react";
import { StyleSheet, View, Text } from "react-native";

import Button from "../ui/CButton";
import Input from "./Input";
import { GlobalStyles } from "../../constants/styles";

function AuthForm({ isLogin, onSubmit, credentialsInvalid, onFieldChange }) {
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);

  const [enteredFirstName, setEnteredFirstName] = useState("");
  const [enteredLastName, setEnteredLastName] = useState("");
  const [enteredEmail, setEnteredEmail] = useState("");
  const [enteredConfirmEmail, setEnteredConfirmEmail] = useState("");
  const [enteredPassword, setEnteredPassword] = useState("");
  const [enteredConfirmPassword, setEnteredConfirmPassword] = useState("");

  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const confirmEmailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const {
    firstName: firstNameIsInvalid,
    lastName: lastNameIsInvalid,
    email: emailIsInvalid,
    confirmEmail: confirmEmailIsInvalid,
    password: passwordIsInvalid,
    confirmPassword: confirmPasswordIsInvalid,
  } = credentialsInvalid;

  function submitHandler() {
    onSubmit({
      firstName: enteredFirstName,
      lastName: enteredLastName,
      email: enteredEmail,
      confirmEmail: enteredConfirmEmail,
      password: enteredPassword,
      confirmPassword: enteredConfirmPassword,
    });
  }

  useEffect(() => {
    if (
      !firstNameIsInvalid &&
      !lastNameIsInvalid &&
      !emailIsInvalid &&
      !confirmEmailIsInvalid &&
      !passwordIsInvalid &&
      !confirmPasswordIsInvalid
    ) {
      return;
    }

    const t = setTimeout(() => {
      if (!isLogin && firstNameIsInvalid) {
        firstNameRef.current?.focus();
        return;
      }

      if (!isLogin && lastNameIsInvalid) {
        lastNameRef.current?.focus();
        return;
      }

      if (emailIsInvalid) {
        emailRef.current?.focus();
        return;
      }

      if (!isLogin && confirmEmailIsInvalid) {
        confirmEmailRef.current?.focus();
        return;
      }

      if (passwordIsInvalid) {
        passwordRef.current?.focus();
        return;
      }

      if (!isLogin && confirmPasswordIsInvalid) {
        confirmPasswordRef.current?.focus();
      }
    }, 120);

    return () => clearTimeout(t);
  }, [
    firstNameIsInvalid,
    lastNameIsInvalid,
    emailIsInvalid,
    confirmEmailIsInvalid,
    passwordIsInvalid,
    confirmPasswordIsInvalid,
    isLogin,
  ]);

  return (
    <View>
      <Text style={styles.title}>{isLogin ? "Accedi" : "Registrati"}</Text>

      {!isLogin && (
        <>
          <Input
            ref={firstNameRef}
            label="Nome"
            icon="person-outline"
            onUpdateValue={(t) => {
              setEnteredFirstName(t);
              onFieldChange?.("firstName");
            }}
            value={enteredFirstName}
            isInvalid={firstNameIsInvalid}
            placeholder="Mario"
            returnKeyType="next"
            autoFocus
            blurOnSubmit={false}
            onSubmitEditing={() => lastNameRef.current?.focus()}
          />

          <Input
            ref={lastNameRef}
            label="Cognome"
            icon="person-circle-outline"
            onUpdateValue={(t) => {
              setEnteredLastName(t);
              onFieldChange?.("lastName");
            }}
            value={enteredLastName}
            isInvalid={lastNameIsInvalid}
            placeholder="Rossi"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => emailRef.current?.focus()}
          />
        </>
      )}

      <Input
        ref={emailRef}
        label="Email"
        icon="mail-outline"
        onUpdateValue={(t) => {
          setEnteredEmail(t);
          onFieldChange?.("email");
        }}
        value={enteredEmail}
        keyboardType="email-address"
        isInvalid={emailIsInvalid}
        placeholder="nome@email.com"
        returnKeyType="next"
        autoFocus={isLogin}
        blurOnSubmit={false}
        onSubmitEditing={() => {
          if (isLogin) passwordRef.current?.focus();
          else confirmEmailRef.current?.focus();
        }}
      />

      {!isLogin && (
        <Input
          ref={confirmEmailRef}
          label="Conferma Email"
          icon="mail-open-outline"
          onUpdateValue={(t) => {
            setEnteredConfirmEmail(t);
            onFieldChange?.("confirmEmail");
          }}
          value={enteredConfirmEmail}
          keyboardType="email-address"
          isInvalid={confirmEmailIsInvalid}
          placeholder="nome@email.com"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
      )}

      <Input
        ref={passwordRef}
        label="Password"
        icon="lock-closed-outline"
        onUpdateValue={(t) => {
          setEnteredPassword(t);
          onFieldChange?.("password");
        }}
        secure
        value={enteredPassword}
        isInvalid={passwordIsInvalid}
        placeholder="Minimo 6 caratteri"
        returnKeyType={isLogin ? "done" : "next"}
        blurOnSubmit={isLogin}
        showToggleSecure
        onSubmitEditing={() => {
          if (isLogin) submitHandler();
          else confirmPasswordRef.current?.focus();
        }}
      />

      {!isLogin && (
        <Input
          ref={confirmPasswordRef}
          label="Conferma Password"
          icon="lock-open-outline"
          onUpdateValue={(t) => {
            setEnteredConfirmPassword(t);
            onFieldChange?.("confirmPassword");
          }}
          secure
          value={enteredConfirmPassword}
          isInvalid={confirmPasswordIsInvalid}
          placeholder="Ripeti password"
          returnKeyType="done"
          blurOnSubmit
          showToggleSecure
          onSubmitEditing={submitHandler}
        />
      )}

      <View style={styles.buttons}>
        <Button onPress={submitHandler}>
          {isLogin ? "Accedi" : "Crea account"}
        </Button>
      </View>
    </View>
  );
}

export default AuthForm;

function makeStyles(colors) {
  return StyleSheet.create({
    title: {
      color: colors.textTitle,
      fontSize: 20,
      fontWeight: "900",
      textAlign: "center",
      marginBottom: 12,
    },
    buttons: {
      marginTop: 14,
    },
  });
}
