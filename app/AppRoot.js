import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import AppErrorBoundary from "../components/ui/AppErrorBoundary";
import AppNavigator from "../navigation/AppNavigator";
import { configureNotifications } from "../util/notifications/setup";
import AppProviders from "./AppProviders";

export default function AppRoot() {
  useEffect(() => {
    configureNotifications().catch(() => {});
  }, []);

  return (
    <AppErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppProviders>
          <AppNavigator />
        </AppProviders>
      </GestureHandlerRootView>
    </AppErrorBoundary>
  );
}
