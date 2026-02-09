import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Animated,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemeContext } from "../../store/theme-context";
import { THEMES, GlobalStyles } from "../../constants/styles";

function ThemeButton({ label, icon, active, onPress, colors, styles }) {
  const pressAnim = useRef(new Animated.Value(0)).current;
  const scale = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.975],
  });

  const animateTo = (value) => {
    Animated.spring(pressAnim, {
      toValue: value,
      speed: 22,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => animateTo(1)}
      onPressOut={() => animateTo(0)}
      style={styles.themeBtnOuter}
    >
      <Animated.View
        style={[
          styles.themeBtn,
          { backgroundColor: colors.white08, borderColor: colors.white10 },
          active && {
            backgroundColor: colors.accent18,
            borderColor: colors.accent35,
          },
          { transform: [{ scale }] },
        ]}
      >
        <Ionicons name={icon} size={18} color={colors.textTitle} />
        <Text style={styles.themeBtnText}>{label}</Text>
        {active ? (
          <Ionicons name="checkmark-circle" size={18} color={colors.textTitle} />
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const THEME_GROUPS = [
  {
    title: "Temi base",
    options: [
      { key: "DARK", icon: "moon-outline" },
      { key: "OBSIDIAN", icon: "contrast-outline" },
      { key: "LIGHT", icon: "sunny-outline" },
      { key: "BLUE", icon: "water-outline" },
      { key: "GREEN", icon: "leaf-outline" },
      { key: "RED", icon: "flame-outline" },
      { key: "YELLOW", icon: "color-filter-outline" },
      { key: "MINT", icon: "flower-outline" },
      { key: "SAND", icon: "cafe-outline" },
    ],
  },
  {
    title: "Temi creativi",
    options: [
      { key: "PURPLE_GOLD", icon: "sparkles-outline" },
      { key: "OCEAN", icon: "planet-outline" },
      { key: "ROSE", icon: "rose-outline" },
      { key: "FOREST", icon: "flower-outline" },
      { key: "SUNSET", icon: "partly-sunny-outline" },
      { key: "SLATE", icon: "moon-outline" },
      { key: "MIDNIGHT_TEAL", icon: "color-wand-outline" },
      { key: "GRAPHITE_LIME", icon: "contrast-outline" },
      { key: "BORDEAUX", icon: "wine-outline" },
      { key: "NIGHT_COPPER", icon: "flame-outline" },
      { key: "AURORA", icon: "rainy-outline" },
      { key: "CHERRY_NIGHT", icon: "moon-outline" },
    ],
  },
];

export default function CustomizeScreen() {
  const { themeKey, setThemeKey } = useContext(ThemeContext);
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTranslateY = toastAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });

  useEffect(() => {
    Animated.timing(toastAnim, {
      toValue: toast.visible ? 1 : 0,
      duration: toast.visible ? 190 : 150,
      useNativeDriver: true,
    }).start();
  }, [toast.visible, toastAnim]);

  useEffect(() => {
    if (!toast.visible) return undefined;
    const timer = setTimeout(() => {
      setToast((current) => ({ ...current, visible: false }));
    }, 1400);
    return () => clearTimeout(timer);
  }, [toast.visible]);

  const showToast = (message) => {
    setToast({ visible: true, message });
  };

  const handleThemeSelect = (key) => {
    const label = THEMES[key]?.label || key;
    if (themeKey === key) {
      showToast(`Tema ${label} gia attivo`);
      return;
    }

    void setThemeKey(key);
    showToast(`Tema ${label} applicato`);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.primary800 }]}
        contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
      >
        <View style={styles.hero}>
          <View style={[styles.heroBlob, styles.heroBlobTop]} />
          <View style={[styles.heroBlob, styles.heroBlobBottom]} />
          <View style={styles.heroIcon}>
            <Ionicons
              name="color-palette-outline"
              size={18}
              color={colors.textTitle}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Personalizza</Text>
            <Text style={[styles.sub, { color: colors.textMuted }]}>
              Temi persistenti per cambiare il look dell'app.
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.white06, borderColor: colors.white10 },
          ]}
        >
          <Text style={[styles.section, { color: colors.textMuted }]}>Temi</Text>

          {THEME_GROUPS.map((group) => (
            <View key={group.title} style={styles.groupBlock}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              {group.options.map((opt) => (
                <ThemeButton
                  key={opt.key}
                  label={THEMES[opt.key]?.label || opt.key}
                  icon={opt.icon}
                  active={themeKey === opt.key}
                  onPress={() => handleThemeSelect(opt.key)}
                  colors={colors}
                  styles={styles}
                />
              ))}
            </View>
          ))}
        </View>

        <View
          style={[
            styles.preview,
            { backgroundColor: colors.white06, borderColor: colors.white10 },
          ]}
        >
          <Text style={styles.previewTitle}>Anteprima</Text>
          <View style={styles.swatches}>
            <View style={[styles.dot, { backgroundColor: colors.primary800 }]} />
            <View style={[styles.dot, { backgroundColor: colors.primary500 }]} />
            <View style={[styles.dot, { backgroundColor: colors.primary200 }]} />
            <View style={[styles.dot, { backgroundColor: colors.accent500 }]} />
          </View>
        </View>
      </ScrollView>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.toastWrap,
          {
            opacity: toastAnim,
            transform: [{ translateY: toastTranslateY }],
          },
        ]}
      >
        <View
          style={[
            styles.toastCard,
            { backgroundColor: colors.surface, borderColor: colors.accent30 },
          ]}
        >
          <Ionicons name="checkmark-circle" size={17} color={colors.textTitle} />
          <Text style={[styles.toastText, { color: colors.textTitle }]} numberOfLines={1}>
            {toast.message || "Tema aggiornato"}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    root: { flex: 1 },
    container: { flex: 1 },
    hero: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      padding: 12,
      marginBottom: 6,
      overflow: "hidden",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    heroBlob: {
      position: "absolute",
      borderRadius: 999,
      backgroundColor: colors.accent12,
      borderWidth: 1,
      borderColor: colors.accent18,
    },
    heroBlobTop: { width: 100, height: 100, right: -22, top: -22 },
    heroBlobBottom: { width: 56, height: 56, right: 28, bottom: -24 },
    heroIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.accent35,
      backgroundColor: colors.accent18,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { color: colors.textTitle, fontWeight: "900", fontSize: 26 },
    sub: { marginTop: 6, fontWeight: "700" },

    card: { marginTop: 16, borderRadius: 18, padding: 14, borderWidth: 1 },
    section: {
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      fontSize: 12,
    },
    groupBlock: { marginTop: 10 },
    groupTitle: {
      color: colors.textMuted,
      fontWeight: "800",
      fontSize: 12,
      marginBottom: 2,
      textTransform: "uppercase",
      letterSpacing: 0.2,
    },

    themeBtnOuter: { marginTop: 10, borderRadius: 14 },
    themeBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 14,
      borderWidth: 1,
      justifyContent: "space-between",
    },
    themeBtnText: { color: colors.textTitle, fontWeight: "900", flex: 1 },

    preview: { marginTop: 14, borderRadius: 18, padding: 14, borderWidth: 1 },
    previewTitle: { color: colors.textTitle, fontWeight: "900", marginBottom: 10 },
    swatches: { flexDirection: "row", gap: 10, alignItems: "center" },
    dot: { width: 18, height: 18, borderRadius: 999 },

    toastWrap: {
      position: "absolute",
      left: 16,
      right: 16,
      bottom: 16,
    },
    toastCard: {
      borderWidth: 1,
      borderRadius: 14,
      paddingVertical: 10,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    toastText: { fontWeight: "900", fontSize: 12, flex: 1 },
  });
}
