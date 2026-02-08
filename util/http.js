import axios from "axios";

const BACKEND_URL =
  "https://react-native-section10-d8ef4-default-rtdb.europe-west1.firebasedatabase.app";

const api = axios.create({
  timeout: 15000,
});

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

function primaryCollectionUrl(userId, token) {
  return `${BACKEND_URL}/users/${safeId(userId)}/expenses.json?${authQuery(token)}`;
}

function legacyCollectionUrl(userId, token) {
  return `${BACKEND_URL}/expenses/${safeId(userId)}.json?${authQuery(token)}`;
}

function primaryItemUrl(userId, token, id) {
  return `${BACKEND_URL}/users/${safeId(userId)}/expenses/${safeId(id)}.json?${authQuery(token)}`;
}

function legacyItemUrl(userId, token, id) {
  return `${BACKEND_URL}/expenses/${safeId(userId)}/${safeId(id)}.json?${authQuery(token)}`;
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

function toFirebaseExpense(expenseData) {
  const methodType =
    expenseData?.methodType === "CARD" || expenseData?.payMethod === "CARD"
      ? "CARD"
      : "CASH";
  const methodId =
    methodType === "CARD"
      ? String(expenseData?.methodId || expenseData?.cardId || "").trim()
      : String(expenseData?.methodId || expenseData?.cashId || "").trim();

  return {
    amount: Number(expenseData?.amount || 0),
    date:
      expenseData?.date instanceof Date
        ? expenseData.date.toISOString()
        : new Date(expenseData?.date || new Date()).toISOString(),
    description: String(expenseData?.description || ""),
    icon: expenseData?.icon || "pricetag-outline",
    category: expenseData?.category || "",
    methodType,
    methodId,
    payMethod: methodType,
    cardId: methodType === "CARD" ? methodId : "",
    cashId: methodType === "CASH" ? methodId : "",
    budgetId: expenseData?.budgetId ?? null,
  };
}

export async function fetchExpenses(userId, token) {
  const response = await withLegacyFallback(
    () => api.get(primaryCollectionUrl(userId, token), requestConfig(token)),
    () => api.get(legacyCollectionUrl(userId, token), requestConfig(token)),
  );

  const data = response.data;
  if (!data) return [];

  const expenses = [];

  for (const key in data) {
    expenses.push({
      id: key,
      amount: data[key].amount,
      date: data[key].date,
      description: data[key].description,
      icon: data[key].icon,
      category: data[key].category,
      methodType: data[key].methodType || data[key].payMethod || "CASH",
      methodId: data[key].methodId || data[key].cardId || data[key].cashId || "",
      budgetId: data[key].budgetId ?? null,
    });
  }

  return expenses;
}

export async function storeExpense(userId, token, expenseData) {
  const payload = toFirebaseExpense(expenseData);
  const response = await withLegacyFallback(
    () => api.post(primaryCollectionUrl(userId, token), payload, requestConfig(token)),
    () => api.post(legacyCollectionUrl(userId, token), payload, requestConfig(token)),
  );
  return response.data.name;
}

export async function updateExpense(userId, token, id, expenseData) {
  const payload = toFirebaseExpense(expenseData);
  await withLegacyFallback(
    () => api.put(primaryItemUrl(userId, token, id), payload, requestConfig(token)),
    () => api.put(legacyItemUrl(userId, token, id), payload, requestConfig(token)),
  );
}

export async function patchExpense(userId, token, id, partial) {
  await withLegacyFallback(
    () => api.patch(primaryItemUrl(userId, token, id), partial, requestConfig(token)),
    () => api.patch(legacyItemUrl(userId, token, id), partial, requestConfig(token)),
  );
}

export async function deleteExpense(userId, token, id) {
  await withLegacyFallback(
    () => api.delete(primaryItemUrl(userId, token, id), requestConfig(token)),
    () => api.delete(legacyItemUrl(userId, token, id), requestConfig(token)),
  );
}

export async function upsertExpenseById(userId, token, id, expenseData) {
  const payload = toFirebaseExpense(expenseData);
  await withLegacyFallback(
    () => api.put(primaryItemUrl(userId, token, id), payload, requestConfig(token)),
    () => api.put(legacyItemUrl(userId, token, id), payload, requestConfig(token)),
  );
}
