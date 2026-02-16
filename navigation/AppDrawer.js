import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useContext, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
} from "@react-navigation/drawer";

import AppLogo from "../components/ui/AppLogo";
import InsightsScreen from "../screens/App/InsightsScreen";
import PlannerStack from "./PlannerStack";
import SettingsStack from "./SettingsStack";
import { GlobalStyles } from "../constants/styles";
import { AuthContext } from "../context/AuthContext";
import { LanguageContext } from "../context/LanguageContext";

const Drawer = createDrawerNavigator();

function AppDrawerContent(props) {
  const insets = useSafeAreaInsets();
  const colors = GlobalStyles.colors;
  const { user, profile, logout } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const styles = makeDrawerStyles(colors);
  const state = props.state;
  const profileFullName = `${String(profile?.firstName || "").trim()} ${String(profile?.lastName || "").trim()}`.trim();
  const fullName = String(user?.email || "").split("@")[0]?.trim();
  const drawerDisplayName = profileFullName || fullName || "Savetime";
  const drawerSubtitle = user?.email || t("common.motto");

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

  const renderRouteItem = (routeName) => {
    const route = state.routes.find((item) => item.name === routeName);
    if (!route) {
      return null;
    }

    const descriptor = props.descriptors[route.key];
    const options = descriptor?.options || {};
    const drawerLabel = options.drawerLabel;
    const title =
      typeof drawerLabel === "string"
        ? drawerLabel
        : typeof options.title === "string"
          ? options.title
          : route.name;
    const isFocused = state.index === state.routes.findIndex((x) => x.key === route.key);

    return (
      <DrawerItem
        key={route.key}
        label={title}
        icon={({ size }) =>
          typeof options.drawerIcon === "function"
            ? options.drawerIcon({
                color: isFocused ? colors.textTitle : colors.white72,
                size,
                focused: isFocused,
              })
            : null
        }
        focused={isFocused}
        activeTintColor={colors.textTitle}
        inactiveTintColor={colors.white72}
        activeBackgroundColor={colors.accent18}
        inactiveBackgroundColor="transparent"
        style={styles.drawerItem}
        labelStyle={styles.drawerLabel}
        onPress={() => props.navigation.navigate(route.name)}
        onLongPress={() =>
          props.navigation.emit({
            type: "drawerItemLongPress",
            target: route.key,
          })
        }
      />
    );
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: Math.max(insets.top + 16, 26) },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        onPress={() => {
          props.navigation.navigate("Settings", { screen: "UserProfile" });
          props.navigation.closeDrawer();
        }}
        style={({ pressed }) => [styles.brandCard, pressed && styles.brandCardPressed]}
      >
        <View style={[styles.brandOrb, styles.brandOrbTop]} />
        <View style={[styles.brandOrb, styles.brandOrbBottom]} />
        <AppLogo size={42} borderRadius={14} />
        <View style={styles.brandTextWrap}>
          <Text style={styles.brandTitle} numberOfLines={1}>
            {drawerDisplayName}
          </Text>
          <Text style={styles.brandSub} numberOfLines={1}>
            {drawerSubtitle}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </Pressable>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t("drawer.sectionMain")}</Text>
        <View style={styles.sectionBody}>
          {renderRouteItem("Planner")}
          {renderRouteItem("Insights")}
          {renderRouteItem("Settings")}
        </View>
      </View>

      <View style={styles.sectionDivider} />

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t("drawer.sectionAccount")}</Text>
        <View style={styles.sectionBody}>
          <DrawerItem
            label={isLoggingOut ? t("common.loggingOut") : t("common.logout")}
            onPress={handleLogout}
            disabled={isLoggingOut || !user}
            icon={({ color, size }) => (
              <Ionicons name="log-out-outline" color={color} size={size} />
            )}
            style={styles.drawerItem}
            labelStyle={styles.drawerLabel}
            activeTintColor={colors.textTitle}
            inactiveTintColor={colors.white72}
            activeBackgroundColor={colors.accent18}
          />
        </View>
      </View>
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
        drawerType: Platform.OS === "ios" ? "slide" : "front",
        overlayColor: colors.overlay60,
        swipeEdgeWidth: 80,
        swipeMinDistance: 24,
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.textTitle,
        sceneStyle: {
          backgroundColor: colors.bg,
        },
        drawerStyle: {
          backgroundColor: colors.surface2,
          width: 296,
          borderTopRightRadius: 28,
          borderBottomRightRadius: 28,
          borderRightWidth: 1,
          borderColor: colors.white12,
          overflow: "hidden",
        },
        drawerActiveTintColor: colors.textTitle,
        drawerActiveBackgroundColor: colors.accent18,
        drawerInactiveTintColor: colors.white72,
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
        name="Insights"
        component={InsightsScreen}
        options={{
          title: t("drawer.insights"),
          headerShown: false,
          drawerIcon: ({ color, size }) => (
            <Ionicons name="analytics-outline" color={color} size={size} />
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

function makeDrawerStyles(colors) {
  return StyleSheet.create({
    contentContainer: {
      minHeight: "100%",
      paddingBottom: 20,
      paddingHorizontal: 12,
    },
    brandCard: {
      marginBottom: 14,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.accent30,
      backgroundColor: colors.surface,
      paddingVertical: 14,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      overflow: "hidden",
    },
    brandCardPressed: {
      opacity: 0.92,
    },
    brandOrb: {
      position: "absolute",
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.accent18,
      backgroundColor: colors.accent12,
    },
    brandOrbTop: {
      width: 88,
      height: 88,
      top: -26,
      right: -24,
    },
    brandOrbBottom: {
      width: 56,
      height: 56,
      right: 36,
      bottom: -26,
    },
    brandTextWrap: {
      flex: 1,
    },
    brandTitle: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 16,
      lineHeight: 20,
    },
    brandSub: {
      marginTop: 2,
      color: colors.textMuted,
      fontWeight: "800",
      fontSize: 11.5,
    },
    section: {
      marginBottom: 12,
    },
    sectionLabel: {
      color: colors.textMuted,
      fontWeight: "900",
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginLeft: 4,
      marginBottom: 4,
    },
    sectionBody: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      paddingVertical: 4,
      paddingHorizontal: 3,
    },
    sectionDivider: {
      marginHorizontal: 4,
      marginTop: 2,
      marginBottom: 14,
      height: 1,
      backgroundColor: colors.white10,
    },
    drawerItem: {
      borderRadius: 14,
      marginVertical: 2,
      marginHorizontal: 2,
      paddingHorizontal: 4,
    },
    drawerLabel: {
      fontWeight: "900",
      fontSize: 13.5,
      marginLeft: -10,
    },
  });
}
