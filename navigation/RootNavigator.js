import { useContext } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";

import { LoadingOverlay } from "../components/ui";
import { GlobalStyles } from "../constants/styles";
import { AuthContext } from "../context/AuthContext";
import AppDrawer from "./AppDrawer";
import AuthStack from "./AuthStack";

export default function RootNavigator() {
  const colors = GlobalStyles.colors;
  const { isAuthenticated, isLoading } = useContext(AuthContext);

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.bg,
      card: colors.surface,
      text: colors.textTitle,
      border: colors.border,
      primary: colors.accent500,
    },
  };

  if (isLoading) {
    return <LoadingOverlay message="Checking session..." />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      {isAuthenticated ? <AppDrawer /> : <AuthStack />}
    </NavigationContainer>
  );
}
