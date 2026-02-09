const DEFAULT_FIREBASE_DB_URL =
  "https://react-native-section10-d8ef4-default-rtdb.europe-west1.firebasedatabase.app";

function cleanDbUrl(value) {
  return String(value || "")
    .trim()
    .replace(/\/+$/, "");
}

export const FIREBASE_WEB_API_KEY = String(
  process.env.EXPO_PUBLIC_FIREBASE_WEB_API_KEY || "",
).trim();

export const FIREBASE_DB_URL = cleanDbUrl(
  process.env.EXPO_PUBLIC_FIREBASE_DB_URL || DEFAULT_FIREBASE_DB_URL,
);

export const SENTRY_DSN = String(process.env.EXPO_PUBLIC_SENTRY_DSN || "").trim();
