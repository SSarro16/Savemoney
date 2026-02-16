import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useContext } from "react";

import { GlobalStyles } from "../constants/styles";
import { LanguageContext } from "../context/LanguageContext";
import IconButton from "../components/ui/IconButton";
import CustomizationScreen from "../screens/App/CustomizationScreen";
import SettingsScreen from "../screens/App/SettingsScreen";
import UserProfileScreen from "../screens/App/UserProfileScreen";

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
        options={({ navigation }) => ({
          title: t("settings.title"),
          headerLeft: () => (
            <IconButton
              icon="menu"
              size={22}
              color={colors.textTitle}
              onPress={() => navigation.getParent()?.openDrawer()}
            />
          ),
        })}
      />
      <Stack.Screen
        name="Customization"
        component={CustomizationScreen}
        options={{ title: t("customization.title") }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ title: t("profile.title") }}
      />
    </Stack.Navigator>
  );
}
