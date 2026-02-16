import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { GlobalStyles } from "../../constants/styles";

const TextField = forwardRef(function TextField(
  {
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = "default",
    secureTextEntry = false,
    invalid = false,
    leftIcon,
    returnKeyType,
    onSubmitEditing,
    blurOnSubmit,
    autoFocus,
    multiline = false,
    numberOfLines = 1,
    showToggleSecure = false,
  },
  ref,
) {
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);

  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const inputRef = useRef(null);
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  const focusAnim = useRef(new Animated.Value(0)).current;
  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.white18, colors.accent500],
  });

  const animateFocus = (value) => {
    Animated.timing(focusAnim, {
      toValue: value,
      duration: 160,
      useNativeDriver: false,
    }).start();
  };

  const isSecure = secureTextEntry && !isPasswordVisible;

  return (
    <View style={styles.inputContainer}>
      {!!label && (
        <Text style={[styles.label, invalid && { color: colors.error500 }]}>
          {label}
        </Text>
      )}

      <Animated.View
        style={[
          styles.field,
          { borderColor },
          isFocused && styles.fieldFocused,
          invalid && { borderColor: colors.error500 },
          multiline && styles.fieldMultiline,
        ]}
      >
        {!!leftIcon && (
          <Ionicons
            name={leftIcon}
            size={18}
            color={invalid ? colors.error500 : colors.textMuted}
          />
        )}

        <TextInput
          ref={inputRef}
          style={[styles.input, multiline && styles.inputMultiline]}
          autoCapitalize="none"
          autoCorrect={false}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          keyboardType={keyboardType}
          secureTextEntry={isSecure}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={blurOnSubmit}
          autoFocus={autoFocus}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => {
            setIsFocused(true);
            animateFocus(1);
          }}
          onBlur={() => {
            setIsFocused(false);
            animateFocus(0);
          }}
        />

        {showToggleSecure && secureTextEntry && (
          <Pressable
            onPress={() => setIsPasswordVisible((previous) => !previous)}
            hitSlop={10}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Ionicons
              name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
});

export default TextField;

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
    fieldMultiline: {
      alignItems: "flex-start",
    },
    input: {
      flex: 1,
      color: colors.textTitle,
      fontSize: 16,
      fontWeight: "700",
    },
    inputMultiline: {
      minHeight: 88,
      textAlignVertical: "top",
    },
    pressed: {
      opacity: 0.85,
    },
  });
}
