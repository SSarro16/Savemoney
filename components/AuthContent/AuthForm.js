import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import Button from "../ui/CButton";
import Input from "./Input";
import CustomDatePicker from "../ui/DatePicker";
import { GlobalStyles } from "../../constants/styles";
import { useTranslation } from "../../store/language-context";

function AuthForm({ isLogin, onSubmit, credentialsInvalid, onFieldChange }) {
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);
  const { t } = useTranslation();

  const [enteredFirstName, setEnteredFirstName] = useState("");
  const [enteredLastName, setEnteredLastName] = useState("");
  const [enteredEmail, setEnteredEmail] = useState("");
  const [enteredPassword, setEnteredPassword] = useState("");
  const [enteredConfirmPassword, setEnteredConfirmPassword] = useState("");
  const [enteredGender, setEnteredGender] = useState("");
  const [enteredDateOfBirth, setEnteredDateOfBirth] = useState(new Date(2000, 0, 1));

  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const {
    email: emailIsInvalid,
    password: passwordIsInvalid,
    confirmPassword: confirmPasswordIsInvalid,
    dateOfBirth: dateOfBirthIsInvalid,
  } = credentialsInvalid;

  function submitHandler() {
    onSubmit({
      firstName: enteredFirstName,
      lastName: enteredLastName,
      email: enteredEmail,
      password: enteredPassword,
      confirmPassword: enteredConfirmPassword,
      gender: enteredGender,
      dateOfBirth: enteredDateOfBirth,
    });
  }

  useEffect(() => {
    if (
      !emailIsInvalid &&
      !passwordIsInvalid &&
      !confirmPasswordIsInvalid &&
      !dateOfBirthIsInvalid
    ) {
      return;
    }

    const t = setTimeout(() => {
      if (emailIsInvalid) {
        emailRef.current?.focus();
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
    emailIsInvalid,
    passwordIsInvalid,
    confirmPasswordIsInvalid,
    dateOfBirthIsInvalid,
    isLogin,
  ]);

  return (
    <View>
      <Text style={styles.title}>
        {isLogin ? t("auth.credentials") : t("auth.createCredentials")}
      </Text>
      <Text style={styles.subtitle}>
        {isLogin
          ? t("auth.credentialsHint")
          : t("auth.createCredentialsHint")}
      </Text>

      {!isLogin && (
        <>
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Input
                ref={firstNameRef}
                label={t("auth.firstNameOptional")}
                icon="person-outline"
                onUpdateValue={(t) => {
                  setEnteredFirstName(t);
                  onFieldChange?.("firstName");
                }}
                value={enteredFirstName}
                placeholder={t("auth.firstNamePlaceholder")}
                returnKeyType="next"
                autoFocus
                blurOnSubmit={false}
                onSubmitEditing={() => lastNameRef.current?.focus()}
              />
            </View>
            <View style={styles.rowItem}>
              <Input
                ref={lastNameRef}
                label={t("auth.lastNameOptional")}
                icon="person-circle-outline"
                onUpdateValue={(t) => {
                  setEnteredLastName(t);
                  onFieldChange?.("lastName");
                }}
                value={enteredLastName}
                placeholder={t("auth.lastNamePlaceholder")}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => emailRef.current?.focus()}
              />
            </View>
          </View>

          <View style={styles.genderWrap}>
            <Text style={styles.genderLabel}>{t("auth.genderOptional")}</Text>
            <View style={styles.genderRow}>
              {[
                { key: "MALE", label: t("auth.male") },
                { key: "FEMALE", label: t("auth.female") },
              ].map((option) => {
                const active = enteredGender === option.key;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => setEnteredGender(active ? "" : option.key)}
                    style={({ pressed }) => [
                      styles.genderBtn,
                      active && styles.genderBtnActive,
                      pressed && { opacity: 0.88 },
                    ]}
                  >
                    <Text style={[styles.genderText, active && styles.genderTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </>
      )}

      <Input
        ref={emailRef}
        label={t("auth.email")}
        icon="mail-outline"
        onUpdateValue={(t) => {
          setEnteredEmail(t);
          onFieldChange?.("email");
        }}
        value={enteredEmail}
        keyboardType="email-address"
        isInvalid={emailIsInvalid}
        placeholder={t("auth.emailPlaceholder")}
        returnKeyType="next"
        autoFocus={isLogin}
        blurOnSubmit={false}
        onSubmitEditing={() => passwordRef.current?.focus()}
      />

      <Input
        ref={passwordRef}
        label={t("auth.password")}
        icon="lock-closed-outline"
        onUpdateValue={(t) => {
          setEnteredPassword(t);
          onFieldChange?.("password");
        }}
        secure
        value={enteredPassword}
        isInvalid={passwordIsInvalid}
        placeholder={t("auth.passwordMinLength")}
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
          label={t("auth.confirmPassword")}
          icon="lock-open-outline"
          onUpdateValue={(t) => {
            setEnteredConfirmPassword(t);
            onFieldChange?.("confirmPassword");
          }}
          secure
          value={enteredConfirmPassword}
          isInvalid={confirmPasswordIsInvalid}
          placeholder={t("auth.repeatPassword")}
          returnKeyType="done"
          blurOnSubmit
          showToggleSecure
          onSubmitEditing={submitHandler}
        />
      )}

      {!isLogin && (
        <View style={styles.dateWrap}>
          <CustomDatePicker
            label={t("auth.birthDate")}
            value={enteredDateOfBirth}
            onChange={(date) => {
              setEnteredDateOfBirth(date);
              onFieldChange?.("dateOfBirth");
            }}
          />
          {dateOfBirthIsInvalid ? (
            <Text style={styles.errorText}>{t("auth.invalidBirthDate")}</Text>
          ) : null}
        </View>
      )}

      <View style={styles.buttons}>
        <Button onPress={submitHandler}>
          {isLogin ? t("auth.loginAction") : t("auth.signupAction")}
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
      fontSize: 18,
      fontWeight: "900",
      marginBottom: 4,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: "700",
      marginBottom: 8,
      lineHeight: 17,
    },
    row: {
      flexDirection: "row",
      gap: 8,
    },
    rowItem: {
      flex: 1,
    },
    genderWrap: {
      marginTop: 2,
      marginBottom: 8,
    },
    genderLabel: {
      color: colors.textBody,
      marginBottom: 6,
      fontWeight: "800",
      fontSize: 12,
      letterSpacing: 0.2,
    },
    genderRow: {
      flexDirection: "row",
      gap: 8,
    },
    genderBtn: {
      flex: 1,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.white12,
      backgroundColor: colors.primary800,
      paddingVertical: 10,
      alignItems: "center",
    },
    genderBtnActive: {
      borderColor: colors.accent35,
      backgroundColor: colors.accent18,
    },
    genderText: {
      color: colors.textMuted,
      fontWeight: "900",
      fontSize: 12,
    },
    genderTextActive: {
      color: colors.textTitle,
    },
    dateWrap: {
      marginTop: 4,
    },
    errorText: {
      marginTop: 6,
      color: colors.error500,
      fontWeight: "800",
      fontSize: 12,
    },
    buttons: {
      marginTop: 16,
    },
  });
}
