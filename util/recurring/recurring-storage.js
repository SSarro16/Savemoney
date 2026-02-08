import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalizeIcon } from "../expenses/expense-normalize";

const BACKEND_URL =
  "https://react-native-section10-d8ef4-default-rtdb.europe-west1.firebasedatabase.app";

const LEGACY_KEY = "recurringItems_v1";
const KEY_PREFIX = "recurringItems_v2_";
const MIGRATION_DONE_KEY_PREFIX = "recurring_items_migrated_firebase_v1_";

function safeId(value) {
  return encodeURIComponent(String(value || "").trim());
}

function authQuery(token) {
  return `auth=${encodeURIComponent(String(token || ""))}`;
}

function requestConfig(token) {
  return {
    timeout: 15000,
  };
}

function keyForUser(userId) {
  const uid = userId ? String(userId) : "anon";
  return `${KEY_PREFIX}${uid}`;
}

function migrationKey(userId) {
  return `${MIGRATION_DONE_KEY_PREFIX}${String(userId || "anon")}`;
}

function ensureAuth(userId, token) {
  if (!userId || !token) {
    throw new Error("Auth non disponibile (token/userId mancanti).");
  }
}

function recurringPath(userId, token, legacy = false) {
  if (legacy) {
    return `${BACKEND_URL}/recurring/${safeId(userId)}.json?${authQuery(token)}`;
  }
  return `${BACKEND_URL}/users/${safeId(userId)}/recurring.json?${authQuery(token)}`;
}

function recurringItemPath(userId, token, id, legacy = false) {
  if (legacy) {
    return `${BACKEND_URL}/recurring/${safeId(userId)}/${safeId(id)}.json?${authQuery(token)}`;
  }
  return `${BACKEND_URL}/users/${safeId(userId)}/recurring/${safeId(id)}.json?${authQuery(token)}`;
}

function shouldTryLegacyPath(error) {
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

async function withLegacyFallback(runPrimary, runLegacy) {
  try {
    return await runPrimary();
  } catch (error) {
    if (!shouldTryLegacyPath(error)) throw error;
    return await runLegacy();
  }
}

function normalizeRecurring(item, forcedId) {
  const id = forcedId ? String(forcedId) : item?.id ? String(item.id) : "";
  const nowIso = new Date().toISOString();
  const payMethod =
    item?.methodType === "CARD" || item?.payMethod === "CARD" ? "CARD" : "CASH";
  const methodId =
    payMethod === "CARD"
      ? String(item?.methodId || item?.cardId || "").trim()
      : String(item?.methodId || item?.cashId || "").trim();

  return {
    ...item,
    id,
    type: item?.type === "SUBSCRIPTION" ? "SUBSCRIPTION" : "HABIT",
    title: String(item?.title || "")
      .trim()
      .slice(0, 28),
    description: String(item?.description || "")
      .trim()
      .slice(0, 80),
    amount: Number(item?.amount || 0),
    icon: normalizeIcon(item?.icon || "repeat-outline"),
    category: String(item?.category || "").trim(),
    cadence: item?.cadence || "MONTHLY",
    nextDue: item?.nextDue ? String(item.nextDue) : nowIso,
    updatedAt: item?.updatedAt ? String(item.updatedAt) : nowIso,
    createdAt: item?.createdAt ? String(item.createdAt) : nowIso,
    lastAddedAt: item?.lastAddedAt ? String(item.lastAddedAt) : null,
    lastPaidAt: item?.lastPaidAt ? String(item.lastPaidAt) : null,
    methodType: payMethod,
    methodId,
    payMethod,
    cardId: payMethod === "CARD" ? methodId : "",
    cashId: payMethod === "CASH" ? methodId : "",
  };
}

function sortRecurring(list) {
  return [...(list || [])].sort((a, b) => {
    const ta = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
    const tb = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
    return (tb || 0) - (ta || 0);
  });
}

async function fetchRemoteRecurring(userId, token) {
  const response = await withLegacyFallback(
    () => axios.get(recurringPath(userId, token), requestConfig(token)),
    () => axios.get(recurringPath(userId, token, true), requestConfig(token)),
  );
  const data = response.data || {};
  const list = Object.keys(data).map((id) => normalizeRecurring(data[id], id));
  return sortRecurring(list);
}

async function migrateIfNeeded(userId, token) {
  ensureAuth(userId, token);

  const doneKey = migrationKey(userId);
  const done = await AsyncStorage.getItem(doneKey);
  if (done === "1") return;

  const remoteList = await fetchRemoteRecurring(userId, token);
  if (remoteList.length) {
    await AsyncStorage.setItem(doneKey, "1");
    return;
  }

  const userLocal = await AsyncStorage.getItem(keyForUser(userId));
  const legacyLocal = await AsyncStorage.getItem(LEGACY_KEY);
  const raw = userLocal || legacyLocal;

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const list = Array.isArray(parsed) ? parsed : [];
      await Promise.all(
        list.map((item) => {
          const clean = normalizeRecurring(item, item?.id || undefined);
          if (!clean.id) clean.id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;

          return withLegacyFallback(
            () =>
              axios.put(recurringItemPath(userId, token, clean.id), clean, {
                ...requestConfig(token),
              }),
            () =>
              axios.put(recurringItemPath(userId, token, clean.id, true), clean, {
                ...requestConfig(token),
              }),
          );
        }),
      );
    } catch {
      // ignore migration parsing errors
    }
  }

  await AsyncStorage.setItem(doneKey, "1");
}

export async function getRecurringItems(userId, token) {
  ensureAuth(userId, token);
  await migrateIfNeeded(userId, token);
  return await fetchRemoteRecurring(userId, token);
}

export async function saveRecurringItems(userId, token, list) {
  ensureAuth(userId, token);
  const safe = sortRecurring((list || []).map((x) => normalizeRecurring(x, x?.id)));
  const map = safe.reduce((acc, item) => {
    if (!item.id) return acc;
    acc[item.id] = item;
    return acc;
  }, {});

  await withLegacyFallback(
    () => axios.put(recurringPath(userId, token), map, requestConfig(token)),
    () => axios.put(recurringPath(userId, token, true), map, requestConfig(token)),
  );
  return safe;
}

export async function upsertRecurringItem(userId, token, item) {
  ensureAuth(userId, token);
  await migrateIfNeeded(userId, token);

  const existingId = item?.id ? String(item.id) : "";
  const clean = normalizeRecurring(item, existingId);
  clean.updatedAt = new Date().toISOString();
  if (!clean.createdAt) clean.createdAt = clean.updatedAt;

  if (existingId) {
    await withLegacyFallback(
      () =>
        axios.put(recurringItemPath(userId, token, existingId), clean, {
          ...requestConfig(token),
        }),
      () =>
        axios.put(recurringItemPath(userId, token, existingId, true), clean, {
          ...requestConfig(token),
        }),
    );
    return await fetchRemoteRecurring(userId, token);
  }

  const response = await withLegacyFallback(
    () =>
      axios.post(recurringPath(userId, token), clean, {
        ...requestConfig(token),
      }),
    () =>
      axios.post(recurringPath(userId, token, true), clean, {
        ...requestConfig(token),
      }),
  );

  const newId = String(response?.data?.name || "");
  if (newId) {
    await withLegacyFallback(
      () =>
        axios.patch(
          recurringItemPath(userId, token, newId),
          { id: newId },
          requestConfig(token),
        ),
      () =>
        axios.patch(
          recurringItemPath(userId, token, newId, true),
          { id: newId },
          requestConfig(token),
        ),
    );
  }
  return await fetchRemoteRecurring(userId, token);
}

export async function removeRecurringItem(userId, token, id) {
  ensureAuth(userId, token);
  await migrateIfNeeded(userId, token);

  await withLegacyFallback(
    () => axios.delete(recurringItemPath(userId, token, id), requestConfig(token)),
    () =>
      axios.delete(recurringItemPath(userId, token, id, true), requestConfig(token)),
  );
  return await fetchRemoteRecurring(userId, token);
}
