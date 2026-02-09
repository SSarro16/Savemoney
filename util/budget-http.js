import { dbUrl, firebaseApi as api, safeId, requestConfig } from "./firebase-rest";
import { logger } from "./logger";

const DEFAULT_BUDGET = {
  total: 0,
  categories: {
    Risparmio: 0,
    Spese: 0,
    Svago: 0,
    Altro: 0,
  },
};

function sanitizeBudgetData(budgetData) {
  const total = Number(budgetData?.total || 0);

  const incoming = budgetData?.categories || {};
  const categories = {
    ...DEFAULT_BUDGET.categories,
    ...incoming,
  };

  Object.keys(categories).forEach((k) => {
    categories[k] = Number(categories[k] || 0);
  });

  return { total, categories };
}

function legacyBudgetUrl(userId, token) {
  return dbUrl(`budget/${safeId(userId)}`, token);
}

export async function saveBudgetFirebase(userId, token, budgetData) {
  if (!userId || !token) {
    throw new Error("Utente non autenticato: impossibile salvare il budget!");
  }

  try {
    const payload = sanitizeBudgetData(budgetData);
    const response = await api.put(
      legacyBudgetUrl(userId, token),
      payload,
      requestConfig(token),
    );

    if (response.status !== 200) {
      throw new Error("Errore nel salvataggio del budget su Firebase");
    }

    return response.data;
  } catch (err) {
    logger.warn("saveBudgetFirebase error", err?.response?.data || err?.message || err);
    throw new Error("Impossibile salvare il budget!");
  }
}

export async function fetchBudgetFirebase(userId, token) {
  if (!userId || !token) {
    throw new Error("Utente non autenticato: impossibile recuperare il budget!");
  }

  try {
    const response = await api.get(legacyBudgetUrl(userId, token), requestConfig(token));

    if (response.status !== 200) {
      throw new Error("Errore nel recupero del budget da Firebase");
    }

    return sanitizeBudgetData(response.data || DEFAULT_BUDGET);
  } catch (err) {
    logger.warn("fetchBudgetFirebase error", err?.response?.data || err?.message || err);
    throw new Error("Impossibile recuperare il budget!");
  }
}
