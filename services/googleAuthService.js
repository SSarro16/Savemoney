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

export function getGoogleAuthPlatformStatus(config, platform) {
  const safeConfig = config || {};
  const platformKey = String(platform || "").toLowerCase();

  if (platformKey === "ios") {
    const enabled = Boolean(safeConfig.iosClientId);
    return {
      enabled,
      reason: enabled ? null : "missing_ios_client_id",
    };
  }

  if (platformKey === "android") {
    const enabled = Boolean(safeConfig.androidClientId);
    return {
      enabled,
      reason: enabled ? null : "missing_android_client_id",
    };
  }

  if (platformKey === "web") {
    const enabled = Boolean(safeConfig.webClientId);
    return {
      enabled,
      reason: enabled ? null : "missing_web_client_id",
    };
  }

  const enabled = isGoogleAuthConfigured(safeConfig);
  return {
    enabled,
    reason: enabled ? null : "missing_client_id",
  };
}

export function extractGoogleIdToken(result) {
  return String(
    result?.authentication?.idToken
    || result?.params?.id_token
    || result?.params?.idToken
    || "",
  ).trim();
}

