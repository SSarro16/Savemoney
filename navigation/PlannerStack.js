import { createNativeStackNavigator } from "@react-navigation/native-stack";

import PlannerScreen from "../screens/App/PlannerScreen";
import { GlobalStyles } from "../constants/styles";

const Stack = createNativeStackNavigator();

export default function PlannerStack() {
  const colors = GlobalStyles.colors;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.bg,
        },
      }}
    >
      <Stack.Screen name="PlannerHome" component={PlannerScreen} />
    </Stack.Navigator>
  );
}
