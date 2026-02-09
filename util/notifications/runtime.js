import { Platform } from "react-native";
import Constants from "expo-constants";

export function isExpoGo() {
  return Constants.appOwnership === "expo";
}

export function canUseLocalNotifications() {
  if (Platform.OS === "web") return false;
  return !isExpoGo();
}
