import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

import { logger } from "./logger";

const SECURE_AUTH_KEY = "authData";
const LEGACY_AUTH_KEY = "authData";
const LEGACY_KEYS = [LEGACY_AUTH_KEY, "token", "userId", "refreshToken", "expiryDate"];

function parseAuthData(raw) {
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  return parsed && typeof parsed === "object" ? parsed : null;
}

async function removeLegacyAuthData() {
  try {
    await AsyncStorage.multiRemove(LEGACY_KEYS);
  } catch (error) {
    logger.warn("Errore pulizia auth legacy", error);
  }
}

async function readLegacyAuthData() {
  const raw = await AsyncStorage.getItem(LEGACY_AUTH_KEY);
  if (raw) {
    return parseAuthData(raw);
  }

  const pairs = await AsyncStorage.multiGet(["token", "userId", "refreshToken", "expiryDate"]);
  const values = Object.fromEntries(pairs);
  if (!values.token || !values.userId) return null;

  return {
    token: values.token,
    userId: values.userId,
    refreshToken: values.refreshToken || undefined,
    expiryDate: values.expiryDate ? Number(values.expiryDate) : undefined,
  };
}

export async function setStoredAuthData(authData) {
  try {
    await SecureStore.setItemAsync(SECURE_AUTH_KEY, JSON.stringify(authData || {}));
    return true;
  } catch (error) {
    logger.warn("Errore salvataggio auth sicuro", error);
    return false;
  }
}

export async function clearStoredAuthData() {
  try {
    await SecureStore.deleteItemAsync(SECURE_AUTH_KEY);
  } catch (error) {
    logger.warn("Errore pulizia auth sicura", error);
  }

  await removeLegacyAuthData();
}

export async function migrateLegacyAuthDataIfNeeded() {
  try {
    const legacy = await readLegacyAuthData();
    if (!legacy?.token || !legacy?.userId) {
      await removeLegacyAuthData();
      return null;
    }

    const saved = await setStoredAuthData(legacy);
    if (saved) {
      await removeLegacyAuthData();
    }
    return legacy;
  } catch (error) {
    logger.warn("Errore migrazione auth legacy", error);
    await removeLegacyAuthData();
    return null;
  }
}

export async function getStoredAuthData() {
  try {
    const raw = await SecureStore.getItemAsync(SECURE_AUTH_KEY);
    const stored = parseAuthData(raw);
    if (stored?.token && stored?.userId) return stored;
    if (raw) await SecureStore.deleteItemAsync(SECURE_AUTH_KEY);
  } catch (error) {
    logger.warn("Errore lettura auth sicura", error);
  }

  return await migrateLegacyAuthDataIfNeeded();
}

