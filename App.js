import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { useContext } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
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
  const statusBarStyle = colors.textTitle === "#ffffff" ? "light" : "dark";

  if (!themeReady || !languageReady || !customizationReady) {
    return <LoadingOverlay message="Applying preferences..." />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <AuthContextProvider>
          <StatusBar style={statusBarStyle} />
          <RootNavigator key={`nav-${version}-${language}`} />
        </AuthContextProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
