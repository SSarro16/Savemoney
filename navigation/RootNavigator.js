import { useContext } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";

import { GlobalStyles } from "../constants/styles";
import { AuthContext } from "../context/AuthContext";
import AppDrawer from "./AppDrawer";
import AuthStack from "./AuthStack";

export default function RootNavigator() {
  const colors = GlobalStyles.colors;
  const { isAuthenticated } = useContext(AuthContext);

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

  return (
    <NavigationContainer theme={navTheme}>
      {isAuthenticated ? <AppDrawer /> : <AuthStack />}
    </NavigationContainer>
  );
}
