import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { GlobalStyles } from "./constants/styles";
import { AuthContextProvider } from "./context/AuthContext";
import RootNavigator from "./navigation/RootNavigator";

export default function App() {
  const colors = GlobalStyles.colors;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <AuthContextProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </AuthContextProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
