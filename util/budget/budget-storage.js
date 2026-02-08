import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BACKEND_URL =
  "https://react-native-section10-d8ef4-default-rtdb.europe-west1.firebasedatabase.app";

const LEGACY_LOCAL_KEY = "BUDGETS_V1";
const ACTIVE_KEY = "BUDGETS_ACTIVE_ID_V1";
const MIGRATION_KEY_PREFIX = "BUDGETS_MIGRATED_TO_FIREBASE_V1_";
const DEFAULT_CATEGORIES = { Risparmio: 0, Spese: 0, Svago: 0, Altro: 0 };

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

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

function activeKey(userId) {
  return userId ? `${ACTIVE_KEY}_${String(userId)}` : ACTIVE_KEY;
}

function localBudgetsKey(userId) {
  return userId ? `${LEGACY_LOCAL_KEY}_${String(userId)}` : LEGACY_LOCAL_KEY;
}

function migrationKey(userId) {
  return `${MIGRATION_KEY_PREFIX}${String(userId || "anon")}`;
}

function ensureAuth(userId, token) {
  if (!userId || !token) {
    throw new Error("Auth non disponibile (token/userId mancanti).");
  }
}

function budgetsPath(userId, token) {
  return `${BACKEND_URL}/users/${safeId(userId)}/budgets.json?${authQuery(token)}`;
}

function budgetPath(userId, token, id) {
  return `${BACKEND_URL}/users/${safeId(userId)}/budgets/${safeId(id)}.json?${authQuery(token)}`;
}

function legacyBudgetPath(userId, token) {
  return `${BACKEND_URL}/budget/${safeId(userId)}.json?${authQuery(token)}`;
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

function normalizeBudget(raw) {
  const now = new Date().toISOString();
  const title = String(raw?.title || raw?.name || "Nuovo budget");

  const categories = {
    ...DEFAULT_CATEGORIES,
    ...(raw?.categories || {}),
  };
  Object.keys(categories).forEach((k) => {
    categories[k] = Number(categories[k] || 0);
  });

  return {
    id: String(raw?.id || uid()),
    title,
    name: title,
    total: Number(raw?.total || 0),
    categories,
    cashBalance: Number(raw?.cashBalance || 0),
    createdAt: raw?.createdAt || now,
    updatedAt: raw?.updatedAt || now,
  };
}

export function makeEmptyBudget({ title } = {}) {
  return normalizeBudget({
    id: uid(),
    title: String(title || "Nuovo budget"),
    total: 0,
    categories: DEFAULT_CATEGORIES,
    cashBalance: 0,
  });
}

function sortBudgets(list) {
  return [...(list || [])].sort((a, b) => {
    const ta = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
    const tb = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
    return (tb || 0) - (ta || 0);
  });
}

async function getLegacyBudgets(userId, token) {
  const response = await axios.get(legacyBudgetPath(userId, token), requestConfig(token));
  const legacy = response.data;
  if (!legacy || typeof legacy !== "object") return [];

  const normalized = normalizeBudget({
    ...legacy,
    id: legacy?.id || "legacy_budget",
  });
  return [normalized];
}

async function saveLegacyBudget(userId, token, budget) {
  const payload = normalizeBudget({ ...budget, id: budget?.id || "legacy_budget" });
  await axios.put(legacyBudgetPath(userId, token), payload, requestConfig(token));
}

async function getRemoteBudgets(userId, token) {
  try {
    const response = await axios.get(budgetsPath(userId, token), requestConfig(token));
    const data = response.data || {};
    const list = Object.keys(data).map((id) =>
      normalizeBudget({ ...(data[id] || {}), id }),
    );
    return sortBudgets(list);
  } catch (error) {
    if (!shouldTryLegacyPath(error)) throw error;
    const legacy = await getLegacyBudgets(userId, token);
    return sortBudgets(legacy);
  }
}

async function uploadBudgets(userId, token, list) {
  const safe = sortBudgets((list || []).map(normalizeBudget));

  try {
    await Promise.all(
      safe.map((b) =>
        axios.put(budgetPath(userId, token, b.id), b, requestConfig(token)),
      ),
    );
    return safe;
  } catch (error) {
    if (!shouldTryLegacyPath(error)) throw error;

    if (safe[0]) {
      await saveLegacyBudget(userId, token, safe[0]);
      return [safe[0]];
    }
    return [];
  }
}

async function migrateIfNeeded(userId, token) {
  ensureAuth(userId, token);
  const doneKey = migrationKey(userId);
  const done = await AsyncStorage.getItem(doneKey);
  if (done === "1") return;

  const remote = await getRemoteBudgets(userId, token);
  if (remote.length) {
    await AsyncStorage.setItem(doneKey, "1");
    return;
  }

  const rawLocal = await AsyncStorage.getItem(localBudgetsKey(userId));
  let localList = [];
  if (rawLocal) {
    try {
      const parsed = JSON.parse(rawLocal);
      localList = Array.isArray(parsed) ? parsed.map(normalizeBudget) : [];
    } catch {
      localList = [];
    }
  }

  if (localList.length) {
    await uploadBudgets(userId, token, localList);
    await AsyncStorage.setItem(doneKey, "1");
    return;
  }

  try {
    const legacy = await getLegacyBudgets(userId, token);
    if (legacy.length) {
      await uploadBudgets(userId, token, legacy);
    }
  } catch {
    // ignore
  }

  await AsyncStorage.setItem(doneKey, "1");
}

export async function getBudgets(userId, token) {
  ensureAuth(userId, token);
  await migrateIfNeeded(userId, token);
  return await getRemoteBudgets(userId, token);
}

export async function getBudgetById(userId, token, id) {
  ensureAuth(userId, token);
  if (!id) return null;

  const list = await getBudgets(userId, token);
  return list.find((b) => String(b.id) === String(id)) || null;
}

export async function getActiveBudgetId(userId) {
  return await AsyncStorage.getItem(activeKey(userId));
}

export async function setActiveBudgetId(id, userId) {
  if (!id) await AsyncStorage.removeItem(activeKey(userId));
  else await AsyncStorage.setItem(activeKey(userId), String(id));
}

export async function upsertBudget(userId, token, budget) {
  ensureAuth(userId, token);
  await migrateIfNeeded(userId, token);

  const incoming = normalizeBudget({
    ...budget,
    id: budget?.id || uid(),
    updatedAt: new Date().toISOString(),
  });

  try {
    await axios.put(budgetPath(userId, token, incoming.id), incoming, {
      ...requestConfig(token),
    });
  } catch (error) {
    if (!shouldTryLegacyPath(error)) throw error;
    await saveLegacyBudget(userId, token, incoming);
  }

  await setActiveBudgetId(incoming.id, userId);
  return await getRemoteBudgets(userId, token);
}

export async function removeBudget(userId, token, id) {
  ensureAuth(userId, token);
  await migrateIfNeeded(userId, token);

  if (id) {
    try {
      await axios.delete(budgetPath(userId, token, id), requestConfig(token));
    } catch (error) {
      if (!shouldTryLegacyPath(error)) throw error;
      await axios.delete(legacyBudgetPath(userId, token), requestConfig(token));
    }
  }

  const next = await getRemoteBudgets(userId, token);

  const active = await getActiveBudgetId(userId);
  if (active === id) {
    await setActiveBudgetId(next?.[0]?.id ?? "", userId);
  }

  return next;
}

export async function createBudget({ name, userId, token } = {}) {
  const budget = makeEmptyBudget({ title: name || "Nuovo budget" });
  const next = await upsertBudget(userId, token, budget);
  await setActiveBudgetId(budget.id, userId);

  if (!next.some((b) => b.id === budget.id)) {
    await upsertBudget(userId, token, budget);
  }
  return budget;
}

export async function updateBudgetMeta(userId, token, id, patch) {
  const current = await getBudgetById(userId, token, id);
  if (!current) return null;

  const merged = normalizeBudget({
    ...current,
    ...patch,
    id,
    updatedAt: new Date().toISOString(),
  });

  await upsertBudget(userId, token, merged);
  return merged;
}

export async function deleteBudget(userId, token, id) {
  await removeBudget(userId, token, id);
}
