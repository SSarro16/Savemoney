const DEFAULT_FIREBASE_DB_URL =
  "https://react-native-section10-d8ef4-default-rtdb.europe-west1.firebasedatabase.app";

function readFirstEnv(keys) {
  for (const key of keys || []) {
    const value = String(process.env?.[key] || "").trim();
    if (value) return value;
  }
  return "";
}

function cleanDbUrl(value) {
  return String(value || "")
    .trim()
    .replace(/\/+$/, "");
}

export const FIREBASE_WEB_API_KEY = readFirstEnv([
  "EXPO_PUBLIC_FIREBASE_WEB_API_KEY",
  "EXPO_PUBLIC_FIREBASE_API_KEY",
]);

export const FIREBASE_DB_URL = cleanDbUrl(
  process.env.EXPO_PUBLIC_FIREBASE_DB_URL || DEFAULT_FIREBASE_DB_URL,
);

export const SENTRY_DSN = String(process.env.EXPO_PUBLIC_SENTRY_DSN || "").trim();
