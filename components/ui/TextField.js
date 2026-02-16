import { forwardRef, useContext, useImperativeHandle, useRef, useState } from "react";
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
import { CustomizationContext } from "../../context/CustomizationContext";

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
    helperText = "",
    errorText = "",
    autoCapitalize = "none",
    autoComplete = "off",
    textContentType = "none",
    autoCorrect = false,
  },
  ref,
) {
  const colors = GlobalStyles.colors;
  const { compactMode, textScale } = useContext(CustomizationContext);
  const styles = makeStyles(colors, compactMode, textScale);

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
  const feedbackText = invalid ? errorText : helperText;

  return (
    <View style={styles.inputContainer}>
      {!!label && <Text style={[styles.label, invalid && { color: colors.error500 }]}>{label}</Text>}

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
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          autoComplete={autoComplete}
          textContentType={textContentType}
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

      <View style={styles.feedbackRow}>
        {!!feedbackText && (
          <Text style={[styles.feedbackText, invalid && { color: colors.error500 }]}>{feedbackText}</Text>
        )}
      </View>
    </View>
  );
});

export default TextField;

function makeStyles(colors, compactMode, textScale) {
  return StyleSheet.create({
    inputContainer: {
      marginVertical: 4,
    },
    label: {
      color: colors.textBody,
      marginBottom: 5,
      fontWeight: "900",
      fontSize: 11 * textScale,
      letterSpacing: 0.3,
      textTransform: "uppercase",
    },
    field: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: compactMode ? 9 : 12,
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
      fontSize: 15 * textScale,
      fontWeight: "700",
    },
    inputMultiline: {
      minHeight: 88,
      textAlignVertical: "top",
    },
    pressed: {
      opacity: 0.85,
    },
    feedbackRow: {
      minHeight: 16,
      justifyContent: "center",
      marginTop: 5,
    },
    feedbackText: {
      color: colors.textFaint,
      fontSize: 10.5 * textScale,
      fontWeight: "700",
      lineHeight: 14 * textScale,
    },
  });
}
