import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useContext } from "react";

import { GlobalStyles } from "../constants/styles";
import { LanguageContext } from "../context/LanguageContext";
import EventEditorScreen from "../screens/App/EventEditorScreen";
import PlannerScreen from "../screens/App/PlannerScreen";

const Stack = createNativeStackNavigator();

export default function PlannerStack() {
  const colors = GlobalStyles.colors;
  const { t } = useContext(LanguageContext);

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
      <Stack.Screen
        name="EventEditor"
        component={EventEditorScreen}
        options={{
          title: t("eventEditor.newTitle"),
          headerShown: true,
          presentation: "modal",
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.textTitle,
          contentStyle: {
            backgroundColor: colors.bg,
          },
        }}
      />
    </Stack.Navigator>
  );
}
