import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { canUseLocalNotifications } from "./runtime";

let configured = false;

export async function configureNotifications() {
  if (configured) return;
  configured = true;
  if (!canUseLocalNotifications()) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}
