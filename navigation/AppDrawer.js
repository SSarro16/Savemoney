import { Ionicons } from "@expo/vector-icons";
import { createDrawerNavigator } from "@react-navigation/drawer";

import PlannerStack from "./PlannerStack";
import SettingsScreen from "../screens/App/SettingsScreen";
import { GlobalStyles } from "../constants/styles";

const Drawer = createDrawerNavigator();

export default function AppDrawer() {
  const colors = GlobalStyles.colors;

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
          title: "Planner",
          headerShown: false,
          drawerIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Settings",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" color={color} size={size} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}
