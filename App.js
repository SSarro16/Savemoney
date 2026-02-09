import "react-native-gesture-handler";
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
  DrawerItemList,
} from "@react-navigation/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
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

import LoginScreen from "./screens/LoginLogoutScreens/LogInScreen";
import SignupScreen from "./screens/LoginLogoutScreens/SignUpScreen";
import ExpensesScreen from "./screens/HomeScreenStack/ExpensesScreen";
import ManageExpenses from "./screens/HomeScreenStack/ManageExpenses";
import QuickAddExpenseScreen from "./screens/HomeScreenStack/QuickAddExpenseScreen";
import InsightsScreen from "./screens/HomeScreenStack/InsightsScreen";

import BudgetScreen from "./screens/DrawerScreens/BudgetScreen";
import BudgetOverviewScreen from "./screens/DrawerScreens/BudgetOverviewScreen";
import BudgetsHubScreen from "./screens/DrawerScreens/BudgetsHubScreen";

import RecurringScreen from "./screens/DrawerScreens/RecurringScreen";
import CustomizeScreen from "./screens/DrawerScreens/CustomizeScreen";
import PaymentsScreen from "./screens/DrawerScreens/PaymentsScreen";
import PaymentMethodDetailScreen from "./screens/DrawerScreens/PaymentMethodDetailScreen";
import SettingsScreen from "./screens/DrawerScreens/SettingsScreen";
import CategoriesManagerScreen from "./screens/DrawerScreens/CategoriesManagerScreen";
import UserProfileScreen from "./screens/DrawerScreens/UserProfileScreen";

import AuthContextProvider, { AuthContext } from "./store/auth-context";
import ExpensesContextProvider from "./store/expenses-context";
import ThemeContextProvider, { ThemeContext } from "./store/theme-context";
import BudgetContextProvider from "./store/budget-context";
import CustomizationContextProvider, {
  CustomizationContext,
} from "./store/customization-context";
import PaymentContextProvider from "./store/payment-context";
import ExpenseCategoriesContextProvider from "./store/expense-categories-context";

import IconButton from "./components/ui/IconButton";
import AppErrorBoundary from "./components/ui/AppErrorBoundary";
import { TAB_BAR_ICONS } from "./constants/navigation-icons";
import { initMonitoring } from "./util/monitoring";

const Stack = createStackNavigator();
const BottomTabs = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

initMonitoring();

function useNavTheme(colors, themeVersion) {
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
    themeVersion,
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
      paddingTop: 30,
      paddingBottom: 14,
      minHeight: "100%",
    },
    brandCard: {
      marginHorizontal: 12,
      marginBottom: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.white12,
      backgroundColor: colors.white06,
      paddingVertical: 12,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    brandCardPressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
    brandIcon: {
      width: 38,
      height: 38,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.accent30,
      backgroundColor: colors.accent16,
      alignItems: "center",
      justifyContent: "center",
    },
    brandTitle: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: Math.round(15 * textScale),
      lineHeight: Math.round(19 * textScale),
    },
    brandSub: {
      marginTop: 1,
      color: colors.textMuted,
      fontWeight: "700",
      fontSize: Math.round(11 * textScale),
    },
  });
}

function AppDrawerContent(props) {
  const authCtx = useContext(AuthContext);
  const { colors } = useContext(ThemeContext);
  const { textScale } = useContext(CustomizationContext);
  const insets = useSafeAreaInsets();
  const styles = makeDrawerStyles(colors, textScale);

  const fullName = [authCtx.firstName, authCtx.lastName]
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .join(" ");

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: Math.max(42, insets.top + 48) },
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
        <View style={styles.brandIcon}>
          <Ionicons name="wallet-outline" size={20} color={colors.accent500} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.brandTitle}>Savemoney</Text>
          <Text style={styles.brandSub} numberOfLines={1}>
            {fullName || "Controllo spese personale"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </Pressable>

      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

function AuthStack() {
  const { colors } = useContext(ThemeContext);
  const { textScale } = useContext(CustomizationContext);

  return (
    <Stack.Navigator
      screenOptions={{
        ...screenHeader(colors, textScale),
        ...screenContent(colors),
      }}
    >
      <Stack.Screen
        name="Accedi"
        component={LoginScreen}
        options={{ title: "Accedi" }}
      />
      <Stack.Screen
        name="Registrazione"
        component={SignupScreen}
        options={{ title: "Crea account" }}
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
  const insets = useSafeAreaInsets();

  return (
    <BottomTabs.Navigator
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
          title: "Spese",
          tabBarLabel: "Spese",
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
          title: "Insights",
          tabBarLabel: "Insights",
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

  return (
    <Stack.Navigator
      screenOptions={{
        ...screenHeader(colors, textScale),
        ...screenContent(colors),
      }}
    >
      <Stack.Screen
        name="BudgetsHub"
        component={BudgetsHubScreen}
        options={({ navigation }) => ({
          title: "Budget",
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
          title: route?.params?.title ? `Budget - ${route.params.title}` : "Budget",
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
        options={{ title: "Modifica Budget" }}
      />
    </Stack.Navigator>
  );
}

function RecurringStack() {
  const { colors } = useContext(ThemeContext);
  const { textScale } = useContext(CustomizationContext);

  return (
    <Stack.Navigator
      screenOptions={{
        ...screenHeader(colors, textScale),
        ...screenContent(colors),
      }}
    >
      <Stack.Screen
        name="RecurringHome"
        component={RecurringScreen}
        options={({ navigation }) => ({
          title: "Abbonamenti/Abitudinali",
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

  return (
    <Stack.Navigator
      screenOptions={{
        ...screenHeader(colors, textScale),
        ...screenContent(colors),
      }}
    >
      <Stack.Screen
        name="PaymentsHome"
        component={PaymentsScreen}
        options={({ navigation }) => ({
          title: "Carte e Contanti",
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
              ? "Dettaglio Carta"
              : "Dettaglio Contanti",
        })}
      />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  const { colors } = useContext(ThemeContext);
  const { textScale } = useContext(CustomizationContext);

  return (
    <Stack.Navigator
      screenOptions={{
        ...screenHeader(colors, textScale),
        ...screenContent(colors),
      }}
    >
      <Stack.Screen
        name="SettingsHome"
        component={SettingsScreen}
        options={({ navigation }) => ({
          title: "Impostazioni",
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
        name="CustomizeHome"
        component={CustomizeScreen}
        options={{ title: "Personalizzazione" }}
      />
      <Stack.Screen
        name="CategoriesManager"
        component={CategoriesManagerScreen}
        options={{ title: "Gestione Categorie" }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={({ navigation }) => ({
          title: "Profilo Utente",
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

  return (
    <Drawer.Navigator
      drawerContent={(props) => <AppDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
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
          title: "Spese",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Budget"
        component={BudgetStack}
        options={{
          title: "Budget",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="cash-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Recurring"
        component={RecurringStack}
        options={{
          title: "Abbonamenti/Abitudinali",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="repeat-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Payments"
        component={PaymentsStack}
        options={{
          title: "Carte/Contanti",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="card-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Settings"
        component={SettingsStack}
        options={{
          title: "Impostazioni",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Logout"
        component={ExpensesTabs}
        options={{
          title: "Logout",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="exit-outline" size={size} color={color} />
          ),
        }}
        listeners={{
          drawerItemPress: (e) => {
            e.preventDefault();
            Alert.alert(
              "Conferma logout",
              "Vuoi uscire dal tuo account?",
              [
                { text: "Annulla", style: "cancel" },
                {
                  text: "Esci",
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

  return (
    <Stack.Navigator
      screenOptions={{
        ...screenHeader(colors, textScale),
        ...screenContent(colors),
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
        options={{ title: "Gestisci Spesa", presentation: "modal" }}
      />
    </Stack.Navigator>
  );
}

function Navigation() {
  const authCtx = useContext(AuthContext);
  const { colors, version, ready } = useContext(ThemeContext);
  const { ready: prefsReady } = useContext(CustomizationContext);
  const navTheme = useNavTheme(colors, version);

  if (!ready || !prefsReady) return null;

  return (
    <>
      <StatusBar style={colors.textTitle === "#ffffff" ? "light" : "dark"} />
      <NavigationContainer theme={navTheme} key={version}>
        {!authCtx.isAuthenticated ? <AuthStack /> : <AuthenticatedStack />}
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthContextProvider>
          <ThemeContextProvider>
            <CustomizationContextProvider>
              <ExpenseCategoriesContextProvider>
                <BudgetContextProvider>
                  <PaymentContextProvider>
                    <ExpensesContextProvider>
                      <Navigation />
                    </ExpensesContextProvider>
                  </PaymentContextProvider>
                </BudgetContextProvider>
              </ExpenseCategoriesContextProvider>
            </CustomizationContextProvider>
          </ThemeContextProvider>
        </AuthContextProvider>
      </GestureHandlerRootView>
    </AppErrorBoundary>
  );
}
