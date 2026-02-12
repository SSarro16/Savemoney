import {
  dbUrl,
  firebaseApi as api,
  safeId,
  requestConfig,
  withLegacyFallback,
} from "./firebase-rest";

function ensureAuth(userId, token) {
  if (!userId || !token) {
    throw new Error("Auth non disponibile (token/userId mancanti).");
  }
}

function goalsPath(userId, token, legacy = false) {
  if (legacy) return dbUrl(`goals/${safeId(userId)}`, token);
  return dbUrl(`users/${safeId(userId)}/goals`, token);
}

function goalPath(userId, token, id, legacy = false) {
  if (legacy) return dbUrl(`goals/${safeId(userId)}/${safeId(id)}`, token);
  return dbUrl(`users/${safeId(userId)}/goals/${safeId(id)}`, token);
}

function normalizeGoalPeriod(value) {
  if (value === "WEEKLY") return "WEEKLY";
  if (value === "YEARLY") return "YEARLY";
  return "MONTHLY";
}

function normalizeGoal(raw, forcedId = "") {
  const nowIso = new Date().toISOString();
  return {
    id: String(forcedId || raw?.id || ""),
    title: String(raw?.title || "Nuovo obiettivo")
      .trim()
      .slice(0, 42),
    targetAmount: Number(raw?.targetAmount || 0),
    currentAmount: Number(raw?.currentAmount || 0),
    dueDate: raw?.dueDate ? String(raw.dueDate) : "",
    notes: String(raw?.notes || "")
      .trim()
      .slice(0, 180),
    period: normalizeGoalPeriod(raw?.period),
    createdAt: raw?.createdAt ? String(raw.createdAt) : nowIso,
    updatedAt: raw?.updatedAt ? String(raw.updatedAt) : nowIso,
  };
}

function sortGoals(goals) {
  return [...(goals || [])].sort((a, b) => {
    const pa = Number(a?.targetAmount || 0) > 0 ? Number(a?.currentAmount || 0) / Number(a?.targetAmount || 1) : 0;
    const pb = Number(b?.targetAmount || 0) > 0 ? Number(b?.currentAmount || 0) / Number(b?.targetAmount || 1) : 0;
    if (pb !== pa) return pb - pa;
    return String(a?.title || "").localeCompare(String(b?.title || ""));
  });
}

export async function fetchGoals(userId, token) {
  ensureAuth(userId, token);

  const response = await withLegacyFallback(
    () => api.get(goalsPath(userId, token), requestConfig(token)),
    () => api.get(goalsPath(userId, token, true), requestConfig(token)),
  );

  const data = response?.data || {};
  const list = Object.keys(data).map((id) => normalizeGoal(data[id], id));
  return sortGoals(list);
}

export async function upsertGoal(userId, token, goal) {
  ensureAuth(userId, token);

  const existingId = String(goal?.id || "");
  const clean = normalizeGoal(goal, existingId);
  clean.updatedAt = new Date().toISOString();
  if (!goal?.createdAt) clean.createdAt = clean.updatedAt;

  if (existingId) {
    await withLegacyFallback(
      () => api.put(goalPath(userId, token, existingId), clean, requestConfig(token)),
      () => api.put(goalPath(userId, token, existingId, true), clean, requestConfig(token)),
    );
    return existingId;
  }

  const response = await withLegacyFallback(
    () => api.post(goalsPath(userId, token), clean, requestConfig(token)),
    () => api.post(goalsPath(userId, token, true), clean, requestConfig(token)),
  );
  return String(response?.data?.name || "");
}

export async function removeGoal(userId, token, id) {
  ensureAuth(userId, token);
  if (!id) return;

  await withLegacyFallback(
    () => api.delete(goalPath(userId, token, id), requestConfig(token)),
    () => api.delete(goalPath(userId, token, id, true), requestConfig(token)),
  );
}
