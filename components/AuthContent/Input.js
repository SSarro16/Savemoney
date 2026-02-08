import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlobalStyles } from "../../constants/styles";

const Input = forwardRef(function Input(
  {
    label,
    icon,
    keyboardType,
    secure,
    onUpdateValue,
    value,
    isInvalid,
    placeholder,
    returnKeyType,
    onSubmitEditing,
    autoFocus,
    blurOnSubmit,
    showToggleSecure = false, // ✅ per password
  },
  ref,
) {
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const inputRef = useRef(null);
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  const anim = useRef(new Animated.Value(0)).current;

  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.white18, colors.accent500],
  });

  const start = (to) =>
    Animated.timing(anim, {
      toValue: to,
      duration: 160,
      useNativeDriver: false,
    }).start();

  const isSecure = !!secure && !showPassword;

  return (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, isInvalid && styles.labelInvalid]}>
        {label}
      </Text>

      <Animated.View
        style={[
          styles.field,
          { borderColor },
          focused && styles.fieldFocused,
          isInvalid && styles.fieldInvalid,
        ]}
      >
        {!!icon && (
          <Ionicons
            name={icon}
            size={18}
            color={isInvalid ? colors.error500 : colors.textMuted}
          />
        )}

        <TextInput
          ref={inputRef}
          style={styles.input}
          autoCapitalize="none"
          keyboardType={keyboardType}
          secureTextEntry={isSecure}
          onChangeText={onUpdateValue}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          autoFocus={autoFocus}
          blurOnSubmit={blurOnSubmit}
          onFocus={() => {
            setFocused(true);
            start(1);
          }}
          onBlur={() => {
            setFocused(false);
            start(0);
          }}
        />

        {/* ✅ Toggle show/hide password */}
        {showToggleSecure && !!secure && (
          <Pressable
            onPress={() => setShowPassword((p) => !p)}
            hitSlop={10}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
});

export default Input;

function makeStyles(colors) {
  return StyleSheet.create({
  inputContainer: {
    marginVertical: 8,
  },
  label: {
    color: colors.textBody,
    marginBottom: 6,
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.2,
  },
  labelInvalid: {
    color: colors.error500,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.primary800,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  fieldFocused: {
    transform: [{ translateY: -0.5 }],
  },
  fieldInvalid: {
    borderColor: colors.error500,
  },
  input: {
    flex: 1,
    color: colors.textTitle,
    fontSize: 16,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.85,
  },
  });
}
