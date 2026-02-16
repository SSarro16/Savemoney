import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useContext } from "react";

import LoginScreen from "../screens/Auth/LoginScreen";
import SignupScreen from "../screens/Auth/SignupScreen";
import { GlobalStyles } from "../constants/styles";
import { LanguageContext } from "../context/LanguageContext";

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  const colors = GlobalStyles.colors;
  const { t } = useContext(LanguageContext);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.textTitle,
        contentStyle: {
          backgroundColor: colors.bg,
        },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: t("auth.login") }} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ title: t("auth.signup") }} />
    </Stack.Navigator>
  );
}
