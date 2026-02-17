function readEnv(name) {
  const value = process.env?.[name];
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

export function getGoogleAuthRequestConfig() {
  return {
    expoClientId: readEnv("EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID") || undefined,
    iosClientId: readEnv("EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID") || undefined,
    androidClientId: readEnv("EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID") || undefined,
    webClientId: readEnv("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID") || undefined,
    scopes: ["openid", "profile", "email"],
  };
}

export function isGoogleAuthConfigured(config) {
  const safeConfig = config || {};
  return Boolean(
    safeConfig.expoClientId
    || safeConfig.iosClientId
    || safeConfig.androidClientId
    || safeConfig.webClientId,
  );
}

export function extractGoogleIdToken(result) {
  return String(
    result?.authentication?.idToken
    || result?.params?.id_token
    || result?.params?.idToken
    || "",
  ).trim();
}

