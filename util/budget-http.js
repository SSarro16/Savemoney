import axios from "axios";

const BACKEND_URL =
  "https://react-native-section10-d8ef4-default-rtdb.europe-west1.firebasedatabase.app";

const DEFAULT_BUDGET = {
  total: 0,
  categories: {
    Risparmio: 0,
    Spese: 0,
    Svago: 0,
    Altro: 0,
  },
};

function requestConfig(token) {
  return {
    timeout: 15000,
  };
}

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

// ---------- Salva il budget ----------
export async function saveBudgetFirebase(userId, token, budgetData) {
  if (!userId || !token) {
    throw new Error("Utente non autenticato: impossibile salvare il budget!");
  }

  try {
    const payload = sanitizeBudgetData(budgetData);

    const response = await axios.put(
      `${BACKEND_URL}/budget/${userId}.json?auth=${encodeURIComponent(token)}`,
      payload,
      requestConfig(token),
    );

    if (response.status !== 200) {
      throw new Error("Errore nel salvataggio del budget su Firebase");
    }

    return response.data;
  } catch (err) {
    console.log("saveBudgetFirebase error:", err.response?.data || err.message);
    throw new Error("Impossibile salvare il budget!");
  }
}

// ---------- Recupera il budget ----------
export async function fetchBudgetFirebase(userId, token) {
  if (!userId || !token) {
    throw new Error("Utente non autenticato: impossibile recuperare il budget!");
  }

  try {
    const response = await axios.get(
      `${BACKEND_URL}/budget/${userId}.json?auth=${encodeURIComponent(token)}`,
      requestConfig(token),
    );

    if (response.status !== 200) {
      throw new Error("Errore nel recupero del budget da Firebase");
    }

    return sanitizeBudgetData(response.data || DEFAULT_BUDGET);
  } catch (err) {
    console.log("fetchBudgetFirebase error:", err.response?.data || err.message);
    throw new Error("Impossibile recuperare il budget!");
  }
}
