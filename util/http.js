import {
  dbUrl,
  firebaseApi as api,
  safeId,
  requestConfig,
  withLegacyFallback,
} from "./firebase-rest";

function primaryCollectionUrl(userId, token) {
  return dbUrl(`users/${safeId(userId)}/expenses`, token);
}

function legacyCollectionUrl(userId, token) {
  return dbUrl(`expenses/${safeId(userId)}`, token);
}

function primaryItemUrl(userId, token, id) {
  return dbUrl(`users/${safeId(userId)}/expenses/${safeId(id)}`, token);
}

function legacyItemUrl(userId, token, id) {
  return dbUrl(`expenses/${safeId(userId)}/${safeId(id)}`, token);
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
