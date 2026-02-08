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

function ensureAuth(userId, token) {
  if (!userId || !token) {
    throw new Error("Auth non disponibile (token/userId mancanti).");
  }
}

function cardsUrl(userId, token, legacy = false) {
  if (legacy) {
    return `${BACKEND_URL}/cards/${safeId(userId)}.json?${authQuery(token)}`;
  }
  return `${BACKEND_URL}/users/${safeId(userId)}/cards.json?${authQuery(token)}`;
}

function cardUrl(userId, token, id, legacy = false) {
  if (legacy) {
    return `${BACKEND_URL}/cards/${safeId(userId)}/${safeId(id)}.json?${authQuery(token)}`;
  }
  return `${BACKEND_URL}/users/${safeId(userId)}/cards/${safeId(id)}.json?${authQuery(token)}`;
}

function cashUrl(userId, token, legacy = false) {
  if (legacy) {
    return `${BACKEND_URL}/cash/${safeId(userId)}.json?${authQuery(token)}`;
  }
  return `${BACKEND_URL}/users/${safeId(userId)}/cash.json?${authQuery(token)}`;
}

function cashItemUrl(userId, token, id, legacy = false) {
  if (legacy) {
    return `${BACKEND_URL}/cash/${safeId(userId)}/${safeId(id)}.json?${authQuery(token)}`;
  }
  return `${BACKEND_URL}/users/${safeId(userId)}/cash/${safeId(id)}.json?${authQuery(token)}`;
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

function normalizeCard(raw, id) {
  const nowIso = new Date().toISOString();
  return {
    id: String(id || raw?.id || ""),
    name: String(raw?.name || "Carta").trim().slice(0, 28),
    brand: String(raw?.brand || "").trim().slice(0, 16),
    last4: String(raw?.last4 || "")
      .replace(/[^\d]/g, "")
      .slice(-4),
    balance: Number(raw?.balance || 0),
    createdAt: raw?.createdAt ? String(raw.createdAt) : nowIso,
    updatedAt: raw?.updatedAt ? String(raw.updatedAt) : nowIso,
  };
}

function normalizeCash(raw, id) {
  const nowIso = new Date().toISOString();
  return {
    id: String(id || raw?.id || ""),
    name: String(raw?.name || "Contanti").trim().slice(0, 28),
    balance: Number(raw?.balance || 0),
    isDefault: !!raw?.isDefault || !!raw?.isPredefinito,
    createdAt: raw?.createdAt ? String(raw.createdAt) : nowIso,
    updatedAt: raw?.updatedAt ? String(raw.updatedAt) : nowIso,
  };
}

function sortByUpdatedAtDesc(list) {
  return [...(list || [])].sort((a, b) => {
    const ta = new Date(a?.updatedAt || 0).getTime();
    const tb = new Date(b?.updatedAt || 0).getTime();
    return (tb || 0) - (ta || 0);
  });
}

export async function fetchCards(userId, token) {
  ensureAuth(userId, token);
  const response = await withLegacyFallback(
    () => api.get(cardsUrl(userId, token), requestConfig(token)),
    () => api.get(cardsUrl(userId, token, true), requestConfig(token)),
  );
  const data = response.data || {};

  const list = Object.keys(data).map((id) => normalizeCard(data[id], id));
  return sortByUpdatedAtDesc(list);
}

export async function upsertCard(userId, token, card) {
  ensureAuth(userId, token);

  const id = card?.id ? String(card.id) : null;
  const clean = normalizeCard(card, id);
  clean.updatedAt = new Date().toISOString();
  if (!card?.createdAt) clean.createdAt = clean.updatedAt;

  if (id) {
    await withLegacyFallback(
      () => api.put(cardUrl(userId, token, id), clean, requestConfig(token)),
      () =>
        api.put(cardUrl(userId, token, id, true), clean, requestConfig(token)),
    );
    return id;
  }

  const response = await withLegacyFallback(
    () => api.post(cardsUrl(userId, token), clean, requestConfig(token)),
    () => api.post(cardsUrl(userId, token, true), clean, requestConfig(token)),
  );
  return String(response?.data?.name || "");
}

export async function removeCard(userId, token, id) {
  ensureAuth(userId, token);
  if (!id) return;
  await withLegacyFallback(
    () => api.delete(cardUrl(userId, token, id), requestConfig(token)),
    () => api.delete(cardUrl(userId, token, id, true), requestConfig(token)),
  );
}

export async function fetchCashWallets(userId, token) {
  ensureAuth(userId, token);
  const response = await withLegacyFallback(
    () => api.get(cashUrl(userId, token), requestConfig(token)),
    () => api.get(cashUrl(userId, token, true), requestConfig(token)),
  );
  const data = response.data || {};

  let list = Object.keys(data).map((id) => normalizeCash(data[id], id));
  if (!list.some((x) => x.isDefault) && list[0]) {
    list = list.map((x, idx) => ({ ...x, isDefault: idx === 0 }));
  }
  return sortByUpdatedAtDesc(list);
}

export async function upsertCashWallet(userId, token, wallet) {
  ensureAuth(userId, token);

  const id = wallet?.id ? String(wallet.id) : null;
  const clean = normalizeCash(wallet, id);
  clean.updatedAt = new Date().toISOString();
  if (!wallet?.createdAt) clean.createdAt = clean.updatedAt;

  if (id) {
    await withLegacyFallback(
      () =>
        api.put(cashItemUrl(userId, token, id), clean, requestConfig(token)),
      () =>
        api.put(
          cashItemUrl(userId, token, id, true),
          clean,
          requestConfig(token),
        ),
    );
    return id;
  }

  const response = await withLegacyFallback(
    () => api.post(cashUrl(userId, token), clean, requestConfig(token)),
    () => api.post(cashUrl(userId, token, true), clean, requestConfig(token)),
  );
  return String(response?.data?.name || "");
}

export async function removeCashWallet(userId, token, id) {
  ensureAuth(userId, token);
  if (!id) return;
  await withLegacyFallback(
    () => api.delete(cashItemUrl(userId, token, id), requestConfig(token)),
    () =>
      api.delete(cashItemUrl(userId, token, id, true), requestConfig(token)),
  );
}

export async function setDefaultCashWallet(userId, token, walletId, wallets) {
  ensureAuth(userId, token);
  const list = Array.isArray(wallets) ? wallets : [];
  if (!list.length) return;

  await Promise.all(
    list.map((w) =>
      withLegacyFallback(
        () =>
          api.patch(cashItemUrl(userId, token, w.id), {
            isDefault: String(w.id) === String(walletId),
            updatedAt: new Date().toISOString(),
          }, requestConfig(token)),
        () =>
          api.patch(cashItemUrl(userId, token, w.id, true), {
            isDefault: String(w.id) === String(walletId),
            updatedAt: new Date().toISOString(),
          }, requestConfig(token)),
      ),
    ),
  );
}
