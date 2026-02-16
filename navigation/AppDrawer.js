import { Ionicons } from "@expo/vector-icons";
import { useContext, useState } from "react";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
} from "@react-navigation/drawer";

import PlannerStack from "./PlannerStack";
import SettingsStack from "./SettingsStack";
import { GlobalStyles } from "../constants/styles";
import { AuthContext } from "../context/AuthContext";
import { LanguageContext } from "../context/LanguageContext";

const Drawer = createDrawerNavigator();

function AppDrawerContent(props) {
  const colors = GlobalStyles.colors;
  const { user, logout } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      // RootNavigator reacts to auth state; ignore UI errors here.
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <DrawerItemList {...props} />
      <DrawerItem
        label={isLoggingOut ? t("common.loggingOut") : t("common.logout")}
        onPress={handleLogout}
        disabled={isLoggingOut || !user}
        icon={({ color, size }) => <Ionicons name="log-out-outline" color={color} size={size} />}
        style={{
          marginTop: "auto",
          borderTopWidth: 1,
          borderTopColor: colors.white10,
          paddingTop: 8,
        }}
        labelStyle={{ fontWeight: "800" }}
        activeTintColor={colors.textOnAccentStrong}
      />
    </DrawerContentScrollView>
  );
}

export default function AppDrawer() {
  const colors = GlobalStyles.colors;
  const { t } = useContext(LanguageContext);

  return (
    <Drawer.Navigator
      drawerContent={(props) => <AppDrawerContent {...props} />}
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
