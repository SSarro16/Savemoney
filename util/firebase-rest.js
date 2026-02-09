import axios from "axios";
import { FIREBASE_DB_URL } from "./env";

export const API_TIMEOUT_MS = 15000;

export const firebaseApi = axios.create({
  timeout: API_TIMEOUT_MS,
});

export function safeId(value) {
  return encodeURIComponent(String(value || "").trim());
}

export function authQuery(token) {
  return `auth=${encodeURIComponent(String(token || ""))}`;
}

export function requestConfig() {
  return { timeout: API_TIMEOUT_MS };
}

export function dbUrl(path, token) {
  const cleanPath = String(path || "").replace(/^\/+/, "");
  return `${FIREBASE_DB_URL}/${cleanPath}.json?${authQuery(token)}`;
}

export function shouldTryLegacyPath(error) {
  const status = Number(error?.response?.status || 0);
  const rawError = error?.response?.data?.error;
  const raw =
    typeof rawError === "string"
      ? rawError.toLowerCase()
      : String(rawError?.message || "").toLowerCase();

  if (status === 404 || status === 401 || status === 403) return true;
  if (
    raw.includes("permission_denied") ||
    raw.includes("permission denied") ||
    raw.includes("access denied") ||
    raw.includes("unauthorized")
  ) {
    return true;
  }
  return false;
}

export async function withLegacyFallback(runPrimary, runLegacy) {
  try {
    return await runPrimary();
  } catch (error) {
    if (!shouldTryLegacyPath(error)) throw error;
    return await runLegacy();
  }
}
