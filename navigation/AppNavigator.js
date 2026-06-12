import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import {
  createBottomTabNavigator,
  SceneStyleInterpolators,
  TransitionSpecs,
} from "@react-navigation/bottom-tabs";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
} from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useContext, useMemo, useRef } from "react";
import {
  Alert,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import LoginScreen from "../screens/LoginLogoutScreens/LogInScreen";
import SignupScreen from "../screens/LoginLogoutScreens/SignUpScreen";
import ExpensesScreen from "../screens/HomeScreenStack/ExpensesScreen";
import ManageExpenses from "../screens/HomeScreenStack/ManageExpenses";
import QuickAddExpenseScreen from "../screens/HomeScreenStack/QuickAddExpenseScreen";
import InsightsScreen from "../screens/HomeScreenStack/InsightsScreen";
import ExpenseDetailScreen from "../screens/HomeScreenStack/ExpenseDetailScreen";

import BudgetScreen from "../screens/DrawerScreens/BudgetScreen";
import BudgetOverviewScreen from "../screens/DrawerScreens/BudgetOverviewScreen";
import BudgetsHubScreen from "../screens/DrawerScreens/BudgetsHubScreen";

import RecurringScreen from "../screens/DrawerScreens/RecurringScreen";
import CustomizeScreen from "../screens/DrawerScreens/CustomizeScreen";
import PaymentsScreen from "../screens/DrawerScreens/PaymentsScreen";
import PaymentMethodDetailScreen from "../screens/DrawerScreens/PaymentMethodDetailScreen";
import SettingsScreen from "../screens/DrawerScreens/SettingsScreen";
import QuickSettingsScreen from "../screens/DrawerScreens/QuickSettingsScreen";
import CategoriesManagerScreen from "../screens/DrawerScreens/CategoriesManagerScreen";
import UserProfileScreen from "../screens/DrawerScreens/UserProfileScreen";
import GoalsScreen from "../screens/DrawerScreens/GoalsScreen";

import { AuthContext } from "../store/auth-context";
import { ThemeContext } from "../store/theme-context";
import { useTranslation } from "../store/language-context";
import { CustomizationContext } from "../store/customization-context";

import IconButton from "../components/ui/IconButton";
import AppLogo from "../components/ui/AppLogo";
import { TAB_BAR_ICONS } from "../constants/navigation-icons";

const Stack = createStackNavigator();
const BottomTabs = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

function useNavTheme(colors) {
  return useMemo(() => {
    return {
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        background: colors.primary800,
        card: colors.primary800,
        text: colors.textTitle,
        border: colors.white10,
        primary: colors.accent500,
      },
    };
  }, [
    colors.primary800,
    colors.textTitle,
    colors.white10,
    colors.accent500,
  ]);
}

function screenHeader(colors, textScale = 1) {
  return {
    headerStyle: {
      backgroundColor: colors.primary800,
      height: 100,
    },
    headerTintColor: colors.textTitle,
    headerTitleStyle: {
      fontWeight: "900",
      fontSize: Math.round(16 * textScale),
    },
    headerLeftContainerStyle: { paddingLeft: 6 },
    headerRightContainerStyle: { paddingRight: 6 },
    headerShadowVisible: false,
    headerBackTitleVisible: false,
  };
}

function screenContent(colors) {
  return { contentStyle: { backgroundColor: colors.primary800 } };
}

function getFloatingGlassTabStyle(colors, insets) {
  const isDark = colors.textTitle === "#ffffff";
  return {
    position: "absolute",
    left: "12%",
    right: "12%",
    bottom: Math.max(insets.bottom + 10, 16),
    height: 58,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: isDark ? "rgba(10,18,32,0.26)" : "rgba(255,255,255,0.22)",
    borderWidth: 1,
    borderColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.54)",
    shadowColor: "#000000",
    shadowOpacity: isDark ? 0.34 : 0.22,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
    elevation: 26,
  };
}

function FloatingGlassTabBar({
  state,
  descriptors,
  navigation,
  insets,
  colors,
  textScale,
}) {
  const activeColor = colors.accent500;
  const inactiveColor = colors.textMuted;
  const isDark = colors.textTitle === "#ffffff";

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View style={getFloatingGlassTabStyle(colors, insets)}>
        {Platform.OS === "ios" ? (
          <BlurView tint="light" intensity={86} style={StyleSheet.absoluteFill} />
        ) : null}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor:
                Platform.OS === "ios"
                  ? isDark
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(255,255,255,0.11)"
                  : isDark
                    ? "rgba(10,20,34,0.24)"
                    : "rgba(255,255,255,0.18)",
            },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            tabBarStyles.topShine,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.10)"
                : "rgba(255,255,255,0.64)",
            },
          ]}
        />

        <View style={tabBarStyles.row}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const { options } = descriptors[route.key];

            const rawLabel = options.tabBarLabel ?? options.title ?? route.name;
            const label = typeof rawLabel === "string" ? rawLabel : route.name;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({ type: "tabLongPress", target: route.key });
            };

            const badgeValue =
              typeof options.tabBarBadge === "number" ||
              typeof options.tabBarBadge === "string"
                ? options.tabBarBadge
                : null;

            return (
              <AnimatedGlassTabItem
                key={route.key}
                label={label}
                options={options}
                isFocused={isFocused}
                activeColor={activeColor}
                inactiveColor={inactiveColor}
                activeBgColor={colors.accent12}
                activeBorderColor={colors.accent28}
                textScale={textScale}
                badgeValue={badgeValue}
                onPress={onPress}
                onLongPress={onLongPress}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarButtonTestID}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

function AnimatedGlassTabItem({
  label,
  options,
  isFocused,
  activeColor,
  inactiveColor,
  activeBgColor,
  activeBorderColor,
  textScale,
  badgeValue,
  onPress,
  onLongPress,
  accessibilityLabel,
  testID,
}) {
  const pressAnim = useRef(new Animated.Value(0)).current;

  const iconColor = isFocused ? activeColor : inactiveColor;
  const icon =
    typeof options.tabBarIcon === "function"
      ? options.tabBarIcon({
          focused: isFocused,
          color: iconColor,
          size: 18,
        })
      : null;

  const scale = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.98],
  });
  const badge =
    badgeValue === null ||
    badgeValue === undefined ||
    (typeof badgeValue === "number" && badgeValue <= 0)
      ? null
      : String(badgeValue);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => {
        Animated.timing(pressAnim, {
          toValue: 1,
          duration: 90,
          useNativeDriver: true,
        }).start();
      }}
      onPressOut={() => {
        Animated.timing(pressAnim, {
          toValue: 0,
          duration: 130,
          useNativeDriver: true,
        }).start();
      }}
      style={tabBarStyles.pressable}
    >
      <Animated.View
        style={[
          tabBarStyles.item,
          isFocused && tabBarStyles.itemActive,
          { transform: [{ scale }] },
        ]}
      >
        {isFocused ? (
          <View
            pointerEvents="none"
            style={[
              tabBarStyles.activeFill,
              {
                backgroundColor: activeBgColor,
                borderColor: activeBorderColor,
              },
            ]}
          />
        ) : null}
        <View style={tabBarStyles.iconWrap}>
          {icon}
          {badge ? (
            <View style={tabBarStyles.badge}>
              <Text style={tabBarStyles.badgeText}>
                {badge.length > 2 ? "99+" : badge}
              </Text>
            </View>
          ) : null}
        </View>
        <Text
          numberOfLines={1}
          style={[
            tabBarStyles.label,
            {
              color: iconColor,
              fontSize: Math.max(8, Math.round(8.5 * textScale)),
            },
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const tabBarStyles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  topShine: {
    position: "absolute",
    top: 1,
    left: 24,
    right: 24,
    height: 1,
    borderRadius: 99,
    opacity: 0.9,
  },
  pressable: { height: "100%", flex: 1 },
  item: {
    minWidth: 72,
    height: "100%",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 2,
    paddingHorizontal: 6,
    position: "relative",
    overflow: "hidden",
    marginHorizontal: 2,
  },
  itemActive: {
    shadowColor: "#000000",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  activeFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 1,
  },
  iconWrap: {
    position: "relative",
    width: 24,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -1,
    right: -4,
    minWidth: 14,
    height: 14,
    paddingHorizontal: 3,
    borderRadius: 99,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.88)",
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "900",
    lineHeight: 10,
  },
  label: {
    marginTop: 1,
    fontWeight: "900",
    letterSpacing: 0.1,
  },
});

function makeDrawerStyles(colors, textScale) {
  return StyleSheet.create({
    contentContainer: {
      paddingTop: 28,
      paddingBottom: 18,
      minHeight: "100%",
      paddingHorizontal: 12,
    },
    brandCard: {
      marginBottom: 16,
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
    brandCardPressed: { opacity: 0.92, transform: [{ scale: 0.994 }] },
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
    brandTitle: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: Math.round(16 * textScale),
      lineHeight: Math.round(20 * textScale),
    },
    brandSub: {
      marginTop: 2,
      color: colors.textMuted,
      fontWeight: "800",
      fontSize: Math.round(11.5 * textScale),
    },
    section: {
      marginBottom: 12,
    },
    sectionLabel: {
      color: colors.textMuted,
      fontWeight: "900",
      fontSize: Math.round(11 * textScale),
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
    drawerItem: {
      borderRadius: 14,
      marginVertical: 2,
      marginHorizontal: 2,
      paddingHorizontal: 4,
    },
    drawerLabel: {
      fontWeight: "900",
      fontSize: Math.round(13.5 * textScale),
      marginLeft: -10,
    },
    sectionDivider: {
      marginHorizontal: 4,
      marginTop: 8,
      marginBottom: 12,
      height: 1,
      backgroundColor: colors.white10,
    },
  });
}

const DRAWER_SECTIONS = [
  {
    key: "drawer.sectionOperations",
    routes: ["Spese", "Budget", "Recurring", "Payments"],
  },
  { key: "drawer.sectionOrganization", routes: ["Goals", "Settings"] },
  { key: "drawer.sectionAccount", routes: ["Logout"] },
];

function AppDrawerContent(props) {
  const authCtx = useContext(AuthContext);
  const { colors } = useContext(ThemeContext);
  const { textScale } = useContext(CustomizationContext);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const styles = makeDrawerStyles(colors, textScale);
  const state = props.state;

  const fullName = [authCtx.firstName, authCtx.lastName]
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .join(" ");
  const drawerDisplayName = fullName || t("drawer.defaultUserName");
  const drawerSubtitle = authCtx.profile?.email || t("drawer.defaultSubtitle");

  function renderDrawerItem(routeName) {
    const route = state.routes.find((item) => item.name === routeName);
    if (!route) return null;

    const descriptor = props.descriptors[route.key];
    const options = descriptor?.options || {};
    const isFocused = state.index === state.routes.findIndex((x) => x.key === route.key);
    const drawerLabel = options.drawerLabel;
    const title =
      typeof drawerLabel === "string"
        ? drawerLabel
        : typeof options.title === "string"
          ? options.title
          : route.name;

    const onPress = () => {
      const event = props.navigation.emit({
        type: "drawerItemPress",
        target: route.key,
        canPreventDefault: true,
      });

      if (!event.defaultPrevented) {
        props.navigation.navigate(route.name);
      }
    };

    const onLongPress = () => {
      props.navigation.emit({
        type: "drawerItemLongPress",
        target: route.key,
      });
    };

    const color = isFocused ? colors.textTitle : colors.white72;

    return (
      <DrawerItem
        key={route.key}
        label={title}
        icon={({ size }) =>
          typeof options.drawerIcon === "function"
            ? options.drawerIcon({ color, size, focused: isFocused })
            : null
        }
        focused={isFocused}
        activeTintColor={colors.textTitle}
        inactiveTintColor={colors.white72}
        activeBackgroundColor={colors.accent18}
        inactiveBackgroundColor="transparent"
        style={styles.drawerItem}
        labelStyle={styles.drawerLabel}
        onPress={onPress}
        onLongPress={onLongPress}
      />
    );
  }

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: Math.max(40, insets.top + 42) },
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
        <AppLogo size={44} />
        <View style={{ flex: 1 }}>
          <Text style={styles.brandTitle} numberOfLines={1}>
            {drawerDisplayName}
          </Text>
          <Text style={styles.brandSub} numberOfLines={1}>
            {drawerSubtitle}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </Pressable>

      {DRAWER_SECTIONS.map((section, index) => (
        <View key={section.key} style={styles.section}>
          <Text style={styles.sectionLabel}>{t(section.key)}</Text>
          <View style={styles.sectionBody}>
            {section.routes.map((routeName) => renderDrawerItem(routeName))}
          </View>
          {index !== DRAWER_SECTIONS.length - 1 ? (
            <View style={styles.sectionDivider} />
          ) : null}
        </View>
      ))}
    </DrawerContentScrollView>
  );
}

function AuthStack() {
  const { colors } = useContext(ThemeContext);
  const { textScale } = useContext(CustomizationContext);
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        ...screenHeader(colors, textScale),
        ...screenContent(colors),
        freezeOnBlur: false,
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: t("auth.loginTitle") }}
      />
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ title: t("auth.signupTitle") }}
      />
    </Stack.Navigator>
  );
}

function ExpensesTabs() {
  return <ExpensesTabsClassic />;
}

function ExpensesTabsClassic() {
  const { colors } = useContext(ThemeContext);
  const { textScale } = useContext(CustomizationContext);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <BottomTabs.Navigator
      lazy={false}
      detachInactiveScreens={false}
      tabBar={(props) => (
        <FloatingGlassTabBar
          {...props}
          insets={insets}
          colors={colors}
          textScale={textScale}
        />
      )}
      screenOptions={{
        ...screenHeader(colors, textScale),
        freezeOnBlur: false,
        animation: "shift",
        transitionSpec: TransitionSpecs.ShiftSpec,
        sceneStyleInterpolator: SceneStyleInterpolators.forShift,
        sceneStyle: {
          paddingBottom: Math.max(insets.bottom + 78, 90),
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <BottomTabs.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={({ navigation }) => ({
          title: t("drawer.expenses"),
          tabBarLabel: t("drawer.expenses"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={TAB_BAR_ICONS.EXPENSES.ionicon}
              color={color}
              size={focused ? Math.max(18, size - 1) : Math.max(17, size - 2)}
            />
          ),
          headerLeft: () => (
            <IconButton
              icon="menu"
              size={24}
              color={colors.textTitle}
              onPress={() => navigation.getParent()?.openDrawer()}
            />
          ),
          headerRight: ({ tintColor }) => (
            <IconButton
              icon="add"
              size={24}
              color={tintColor || colors.textTitle}
              onPress={() => navigation.navigate("ManageExpenses")}
            />
          ),
        })}
      />

      <BottomTabs.Screen
        name="Insights"
        component={InsightsScreen}
        options={({ navigation }) => ({
          title: t("navigation.insights"),
          tabBarLabel: t("navigation.insights"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={TAB_BAR_ICONS.INSIGHTS.ionicon}
              color={color}
              size={focused ? Math.max(18, size - 1) : Math.max(17, size - 2)}
            />
          ),
          headerLeft: () => (
            <IconButton
              icon="menu"
              size={24}
              color={colors.textTitle}
              onPress={() => navigation.getParent()?.openDrawer()}
            />
          ),
        })}
      />
    </BottomTabs.Navigator>
  );
}

function BudgetStack() {
  const { colors } = useContext(ThemeContext);
  const { textScale } = useContext(CustomizationContext);
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        ...screenHeader(colors, textScale),
        ...screenContent(colors),
        freezeOnBlur: false,
      }}
    >
      <Stack.Screen
        name="BudgetsHub"
        component={BudgetsHubScreen}
        options={({ navigation }) => ({
          title: t("drawer.budget"),
          headerLeft: () => (
            <IconButton
              icon="menu"
              size={24}
              color={colors.textTitle}
              onPress={() => navigation.getParent()?.openDrawer()}
            />
          ),
        })}
      />

      <Stack.Screen
        name="BudgetOverview"
        component={BudgetOverviewScreen}
        options={({ navigation, route }) => ({
          title: route?.params?.title
            ? t("navigation.budgetOverviewWithName", { name: route.params.title })
            : t("navigation.budgetOverviewTitle"),
          headerRight: () => (
            <IconButton
              icon="pencil"
              size={22}
              color={colors.textTitle}
              onPress={() =>
                navigation.navigate("BudgetScreen", {
                  budgetId: route?.params?.budgetId,
                })
              }
            />
          ),
        })}
      />

      <Stack.Screen
        name="BudgetScreen"
        component={BudgetScreen}
        options={{ title: t("navigation.editBudget") }}
      />
    </Stack.Navigator>
  );
}

function RecurringStack() {
  const { colors } = useContext(ThemeContext);
  const { textScale } = useContext(CustomizationContext);
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        ...screenHeader(colors, textScale),
        ...screenContent(colors),
        freezeOnBlur: false,
      }}
    >
      <Stack.Screen
        name="RecurringHome"
        component={RecurringScreen}
        options={({ navigation }) => ({
          title: t("navigation.recurringHome"),
          headerLeft: () => (
            <IconButton
              icon="menu"
              size={24}
              color={colors.textTitle}
              onPress={() => navigation.getParent()?.openDrawer()}
            />
          ),
        })}
      />
    </Stack.Navigator>
  );
}

function PaymentsStack() {
  const { colors } = useContext(ThemeContext);
  const { textScale } = useContext(CustomizationContext);
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        ...screenHeader(colors, textScale),
        ...screenContent(colors),
        freezeOnBlur: false,
      }}
    >
      <Stack.Screen
        name="PaymentsHome"
        component={PaymentsScreen}
        options={({ navigation }) => ({
          title: t("navigation.paymentsHome"),
          headerLeft: () => (
            <IconButton
              icon="menu"
              size={24}
              color={colors.textTitle}
              onPress={() => navigation.getParent()?.openDrawer()}
            />
          ),
        })}
      />
      <Stack.Screen
        name="PaymentMethodDetails"
        component={PaymentMethodDetailScreen}
        options={({ route }) => ({
          title:
            route?.params?.methodType === "CARD"
              ? t("navigation.cardDetails")
              : t("navigation.cashDetails"),
        })}
      />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  const { colors } = useContext(ThemeContext);
  const { textScale } = useContext(CustomizationContext);
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        ...screenHeader(colors, textScale),
        ...screenContent(colors),
        freezeOnBlur: false,
      }}
    >
      <Stack.Screen
        name="SettingsHome"
        component={SettingsScreen}
        options={({ navigation }) => ({
          title: t("navigation.settings"),
          headerLeft: () => (
            <IconButton
              icon="menu"
              size={24}
              color={colors.textTitle}
              onPress={() => navigation.getParent()?.openDrawer()}
            />
          ),
        })}
      />
      <Stack.Screen
        name="QuickSettings"
        component={QuickSettingsScreen}
        options={{ title: t("navigation.quickSettings") }}
      />
      <Stack.Screen
        name="CustomizeHome"
        component={CustomizeScreen}
        options={{ title: t("navigation.customize") }}
      />
      <Stack.Screen
        name="CategoriesManager"
        component={CategoriesManagerScreen}
        options={{ title: t("navigation.categoriesManager") }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={({ navigation }) => ({
          title: t("navigation.profile"),
          headerLeft: () => (
            <IconButton
              icon="menu"
              size={24}
              color={colors.textTitle}
              onPress={() => navigation.getParent()?.openDrawer()}
            />
          ),
        })}
      />
    </Stack.Navigator>
  );
}

function GoalsStack() {
  const { colors } = useContext(ThemeContext);
  const { textScale } = useContext(CustomizationContext);
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        ...screenHeader(colors, textScale),
        ...screenContent(colors),
        freezeOnBlur: false,
      }}
    >
      <Stack.Screen
        name="GoalsHome"
        component={GoalsScreen}
        options={({ navigation }) => ({
          title: t("navigation.goals"),
          headerLeft: () => (
            <IconButton
              icon="menu"
              size={24}
              color={colors.textTitle}
              onPress={() => navigation.getParent()?.openDrawer()}
            />
          ),
        })}
      />
    </Stack.Navigator>
  );
}

function AppDrawer() {
  const authCtx = useContext(AuthContext);
  const { colors } = useContext(ThemeContext);
  const { textScale } = useContext(CustomizationContext);
  const { t } = useTranslation();

  return (
    <Drawer.Navigator
      lazy={false}
      detachInactiveScreens={false}
      drawerContent={(props) => <AppDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        freezeOnBlur: false,
        drawerType: Platform.OS === "ios" ? "slide" : "front",
        overlayColor: "rgba(0,0,0,0.34)",
        drawerHideStatusBarOnOpen: Platform.OS === "ios",
        drawerStatusBarAnimation: "fade",
        swipeEdgeWidth: 80,
        swipeMinDistance: 24,
        drawerStyle: {
          backgroundColor: colors.primary800,
          width: 296,
          borderTopRightRadius: 28,
          borderBottomRightRadius: 28,
          borderRightWidth: 1,
          borderColor: colors.white12,
          overflow: "hidden",
        },
        drawerActiveTintColor: colors.textTitle,
        drawerInactiveTintColor: colors.white70,
        drawerActiveBackgroundColor: colors.accent18,
        drawerLabelStyle: {
          fontWeight: "900",
          marginLeft: -6,
          fontSize: Math.round(14 * textScale),
        },
        drawerItemStyle: {
          borderRadius: 16,
          marginHorizontal: 12,
          marginVertical: 3,
          paddingHorizontal: 4,
        },
        sceneContainerStyle: { backgroundColor: colors.primary800 },
      }}
    >
      <Drawer.Screen
        name="Spese"
        component={ExpensesTabs}
        options={{
          title: t("drawer.expenses"),
          drawerIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Budget"
        component={BudgetStack}
        options={{
          title: t("drawer.budget"),
          drawerIcon: ({ color, size }) => (
            <Ionicons name="cash-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Recurring"
        component={RecurringStack}
        options={{
          title: t("drawer.recurring"),
          drawerIcon: ({ color, size }) => (
            <Ionicons name="repeat-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Payments"
        component={PaymentsStack}
        options={{
          title: t("drawer.payments"),
          drawerIcon: ({ color, size }) => (
            <Ionicons name="card-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Goals"
        component={GoalsStack}
        options={{
          title: t("drawer.goals"),
          drawerIcon: ({ color, size }) => (
            <Ionicons name="flag-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Settings"
        component={SettingsStack}
        options={{
          title: t("drawer.settings"),
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Logout"
        component={ExpensesTabs}
        options={{
          title: t("drawer.logout"),
          drawerIcon: ({ color, size }) => (
            <Ionicons name="exit-outline" size={size} color={color} />
          ),
        }}
        listeners={{
          drawerItemPress: (e) => {
            e.preventDefault();
            Alert.alert(
              t("navigation.logoutConfirmTitle"),
              t("navigation.logoutConfirmMessage"),
              [
                { text: t("common.cancel"), style: "cancel" },
                {
                  text: t("navigation.logoutAction"),
                  style: "destructive",
                  onPress: () => authCtx.logout(),
                },
              ],
            );
          },
        }}
      />
    </Drawer.Navigator>
  );
}

function AuthenticatedStack() {
  const { colors } = useContext(ThemeContext);
  const { textScale } = useContext(CustomizationContext);
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        ...screenHeader(colors, textScale),
        ...screenContent(colors),
        freezeOnBlur: false,
      }}
    >
      <Stack.Screen
        name="Drawer"
        component={AppDrawer}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="QuickAddExpense"
        component={QuickAddExpenseScreen}
        options={{
          headerShown: false,
          presentation: "transparentModal",
          cardStyle: { backgroundColor: "transparent" },
        }}
      />

      <Stack.Screen
        name="ManageExpenses"
        component={ManageExpenses}
        options={{ title: t("navigation.manageExpense"), presentation: "modal" }}
      />
      <Stack.Screen
        name="ExpenseDetail"
        component={ExpenseDetailScreen}
        options={{ title: t("navigation.expenseDetail") }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const authCtx = useContext(AuthContext);
  const { colors, ready } = useContext(ThemeContext);
  const { ready: prefsReady } = useContext(CustomizationContext);
  const {
    ready: languageReady,
    version: languageVersion,
  } = useTranslation();
  const navTheme = useNavTheme(colors);

  if (!ready || !prefsReady || !languageReady) return null;

  return (
    <>
      <StatusBar style={colors.textTitle === "#ffffff" ? "light" : "dark"} />
      <NavigationContainer theme={navTheme} key={`lang-${languageVersion}`}>
        {!authCtx.isAuthenticated ? <AuthStack /> : <AuthenticatedStack />}
      </NavigationContainer>
    </>
  );
}
