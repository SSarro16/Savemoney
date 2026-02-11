import AsyncStorage from "@react-native-async-storage/async-storage";
import { PAYMENT_METHOD } from "./expense-presets";

const LEGACY_KEY = "expenseTemplates_v1";
const KEY_PREFIX = "expenseTemplates_v2_";
const LEGACY_OWNER_KEY = "expense_templates_v1_owner_uid";
const MAX_TEMPLATES = 12;

function ensureAuth(userId, token) {
  if (!userId || !token) {
    throw new Error("Auth non disponibile (token/userId mancanti).");
  }
}

function keyForUser(userId) {
  return `${KEY_PREFIX}${String(userId || "").trim()}`;
}

function safeParse(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safePayMethod(input) {
  return input === PAYMENT_METHOD.CARD
    ? PAYMENT_METHOD.CARD
    : PAYMENT_METHOD.CASH;
}

function cleanTemplate(template) {
  const payMethod = safePayMethod(template?.payMethod);
  const cardId =
    payMethod === PAYMENT_METHOD.CARD
      ? String(template?.cardId || "").trim()
      : "";

  return {
    id: String(template?.id || Date.now()),
    title: String(template?.title || "").slice(0, 22),
    description: String(template?.description || "").slice(0, 40),
    icon: template?.icon || "pricetag-outline",
    category: String(template?.category || "").trim(),
    payMethod,
    cardId,
    ...(template?.amount != null && Number(template.amount) > 0
      ? { amount: Number(template.amount) }
      : {}),
  };
}

function migrateList(list) {
  // Legacy templates without payMethod are normalized to CASH.
  return (list || []).map((item) => {
    const payMethod = safePayMethod(item?.payMethod);
    return {
      ...item,
      payMethod,
      cardId:
        payMethod === PAYMENT_METHOD.CARD ? String(item?.cardId || "").trim() : "",
    };
  });
}

async function readScopedTemplates(userId, token) {
  ensureAuth(userId, token);

  const userKey = keyForUser(userId);
  const userRaw = await AsyncStorage.getItem(userKey);
  if (userRaw) {
    return migrateList(safeParse(userRaw));
  }

  // Legacy migration is allowed only when owner marker matches the account.
  // This prevents data leakage on shared devices across different accounts.
  const legacyOwner = String(
    (await AsyncStorage.getItem(LEGACY_OWNER_KEY)) || "",
  ).trim();
  if (!legacyOwner || legacyOwner !== String(userId).trim()) {
    return [];
  }

  const legacyRaw = await AsyncStorage.getItem(LEGACY_KEY);
  const legacyList = migrateList(safeParse(legacyRaw));

  if (legacyList.length) {
    await AsyncStorage.setItem(userKey, JSON.stringify(legacyList));
  }

  return legacyList;
}

export async function getExpenseTemplates(userId, token) {
  return await readScopedTemplates(userId, token);
}

export async function saveExpenseTemplates(userId, token, list) {
  ensureAuth(userId, token);
  const clean = migrateList(Array.isArray(list) ? list : []);
  await AsyncStorage.setItem(keyForUser(userId), JSON.stringify(clean));
}

export async function addExpenseTemplate(userId, token, template) {
  const list = await getExpenseTemplates(userId, token);
  const clean = cleanTemplate(template);

  const next = [clean, ...list.filter((item) => item.id !== clean.id)].slice(
    0,
    MAX_TEMPLATES,
  );

  await saveExpenseTemplates(userId, token, next);
  return next;
}

export async function removeExpenseTemplate(userId, token, id) {
  const list = await getExpenseTemplates(userId, token);
  const next = list.filter((item) => item.id !== id);
  await saveExpenseTemplates(userId, token, next);
  return next;
}
