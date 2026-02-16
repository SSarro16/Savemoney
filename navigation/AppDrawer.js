import { Ionicons } from "@expo/vector-icons";
import { useContext } from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";

import PlannerStack from "./PlannerStack";
import SettingsStack from "./SettingsStack";
import { GlobalStyles } from "../constants/styles";
import { LanguageContext } from "../context/LanguageContext";

const Drawer = createDrawerNavigator();

export default function AppDrawer() {
  const colors = GlobalStyles.colors;
  const { t } = useContext(LanguageContext);

  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.textTitle,
        sceneStyle: {
          backgroundColor: colors.bg,
        },
        drawerStyle: {
          backgroundColor: colors.surface2,
        },
        drawerActiveTintColor: colors.textOnAccentStrong,
        drawerActiveBackgroundColor: colors.accent500,
        drawerInactiveTintColor: colors.textBody,
      }}
    >
      <Drawer.Screen
        name="Planner"
        component={PlannerStack}
        options={{
          title: t("drawer.planner"),
          headerShown: false,
          drawerIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsStack}
        options={{
          title: t("drawer.settings"),
          headerShown: false,
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" color={color} size={size} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}
