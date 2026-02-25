import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { useContext } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import LoadingOverlay from "./components/ui/LoadingOverlay";
import { GlobalStyles } from "./constants/styles";
import { AuthContextProvider } from "./context/AuthContext";
import {
  CustomizationContext,
  CustomizationContextProvider,
} from "./context/CustomizationContext";
import { ThemeContext, ThemeContextProvider } from "./context/ThemeContext";
import { LanguageContext, LanguageContextProvider } from "./context/LanguageContext";
import RootNavigator from "./navigation/RootNavigator";

function createPaperTheme(colors, isDark) {
  return {
    dark: isDark,
    roundness: 12,
    colors: {
      primary: colors.accent500,
      onPrimary: colors.textOnAccentStrong,
      primaryContainer: colors.accent18,
      onPrimaryContainer: colors.textBody,
      secondary: colors.primary500,
      onSecondary: colors.textBody,
      secondaryContainer: colors.white08,
      onSecondaryContainer: colors.textBody,
      tertiary: colors.accent500,
      onTertiary: colors.textOnAccentStrong,
      tertiaryContainer: colors.accent12,
      onTertiaryContainer: colors.textBody,
      error: colors.error500,
      onError: colors.textOnAccentStrong,
      errorContainer: colors.danger12,
      onErrorContainer: colors.error500,
      background: colors.bg,
      onBackground: colors.textBody,
      surface: colors.surface,
      onSurface: colors.textBody,
      surfaceVariant: colors.surface2,
      onSurfaceVariant: colors.textMuted,
      outline: colors.white20,
      outlineVariant: colors.white12,
      shadow: colors.overlay72,
      scrim: colors.overlay60,
      inverseSurface: colors.textTitle,
      inverseOnSurface: colors.bg,
      inversePrimary: colors.accent500,
      elevation: {
        level0: colors.surface,
        level1: colors.white06,
        level2: colors.white08,
        level3: colors.white10,
        level4: colors.white12,
        level5: colors.white14,
      },
    },
  };
}

export default function App() {
  return (
    <ThemeContextProvider>
      <LanguageContextProvider>
        <CustomizationContextProvider>
          <AppShell />
        </CustomizationContextProvider>
      </LanguageContextProvider>
    </ThemeContextProvider>
  );
}

function AppShell() {
  const { ready: themeReady, version } = useContext(ThemeContext);
  const { ready: languageReady, language } = useContext(LanguageContext);
  const { ready: customizationReady } = useContext(CustomizationContext);
  const colors = GlobalStyles.colors;
  const isDarkTheme = colors.textTitle === "#ffffff";
  const statusBarStyle = isDarkTheme ? "light" : "dark";
  const paperTheme = createPaperTheme(colors, isDarkTheme);

  if (!themeReady || !languageReady || !customizationReady) {
    return <LoadingOverlay message="Applying preferences..." />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <AuthContextProvider>
          <PaperProvider theme={paperTheme}>
            <StatusBar style={statusBarStyle} />
            <RootNavigator key={`nav-${version}-${language}`} />
          </PaperProvider>
        </AuthContextProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
