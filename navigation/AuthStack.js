import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../screens/Auth/LoginScreen";
import SignupScreen from "../screens/Auth/SignupScreen";
import { GlobalStyles } from "../constants/styles";

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  const colors = GlobalStyles.colors;

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
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Login" }} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ title: "Signup" }} />
    </Stack.Navigator>
  );
}
