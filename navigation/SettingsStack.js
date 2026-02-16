import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useContext } from "react";

import { GlobalStyles } from "../constants/styles";
import { LanguageContext } from "../context/LanguageContext";
import CustomizationScreen from "../screens/App/CustomizationScreen";
import SettingsScreen from "../screens/App/SettingsScreen";

const Stack = createNativeStackNavigator();

export default function SettingsStack() {
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
      <Stack.Screen
        name="SettingsHome"
        component={SettingsScreen}
        options={{ title: t("settings.title") }}
      />
      <Stack.Screen
        name="Customization"
        component={CustomizationScreen}
        options={{ title: t("customization.title") }}
      />
    </Stack.Navigator>
  );
}
