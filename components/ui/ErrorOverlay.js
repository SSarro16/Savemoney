import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlobalStyles } from "../../constants/styles";

export default function ErrorOverlay({
  message,
  onRetry,
  retryLabel = "Riprova",
  retryDelayMs = 2000,
}) {
  const colors = GlobalStyles.colors;

  const [isRetrying, setIsRetrying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!isRetrying) return;

    const totalSeconds = Math.ceil(retryDelayMs / 1000);
    setSecondsLeft(totalSeconds);

    const tick = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    const run = setTimeout(async () => {
      try {
        await onRetry?.();
      } finally {
        setIsRetrying(false);
      }
    }, retryDelayMs);

    return () => {
      clearInterval(tick);
      clearTimeout(run);
    };
  }, [isRetrying, onRetry, retryDelayMs]);

  const handleRetry = () => {
    if (!onRetry || isRetrying) return;
    setIsRetrying(true);
  };

  const btnText = isRetrying
    ? secondsLeft > 0
      ? `Riprovo tra ${secondsLeft}s...`
      : "Riprovo..."
    : retryLabel;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface2, borderColor: colors.border },
        ]}
      >
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: colors.danger20, borderColor: colors.danger30 },
          ]}
        >
          <Ionicons
            name="alert-circle-outline"
            size={26}
            color={colors.textTitle}
          />
        </View>

        <Text style={[styles.title, { color: colors.textTitle }]}>
          Ops! Qualcosa è andato storto
        </Text>
        <Text style={[styles.message, { color: colors.textBody }]}>
          {message}
        </Text>

        {!!onRetry && (
          <Pressable
            onPress={handleRetry}
            disabled={isRetrying}
            style={({ pressed }) => [
              styles.retryBtn,
              {
                backgroundColor: colors.accent18,
                borderColor: colors.accent35,
                opacity: isRetrying ? 0.7 : 1,
              },
              pressed && !isRetrying && styles.pressed,
            ]}
          >
            <Ionicons
              name={isRetrying ? "time-outline" : "refresh-outline"}
              size={18}
              color={colors.textOnAccent}
            />
            <Text style={[styles.retryText, { color: colors.textOnAccent }]}>
              {btnText}
            </Text>
          </Pressable>
        )}

        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Se il problema persiste, controlla la connessione o riprova più tardi.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 6,
  },
  message: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
    marginBottom: 12,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  retryText: { fontWeight: "900", fontSize: 14 },
  pressed: { opacity: 0.85 },
  hint: { textAlign: "center", fontSize: 12, fontWeight: "700" },
});
