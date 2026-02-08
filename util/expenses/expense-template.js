import AsyncStorage from "@react-native-async-storage/async-storage";
import { PAYMENT_METHOD } from "./expense-presets";

const KEY = "expenseTemplates_v1";

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

  const clean = {
    id: String(template?.id || Date.now()),
    title: String(template?.title || "").slice(0, 22),
    description: String(template?.description || "").slice(0, 40),
    icon: template?.icon || "pricetag-outline",
    category: String(template?.category || "").trim(),

    // ✅ nuovi campi (default CASH)
    payMethod,
    cardId,

    ...(template?.amount != null && Number(template.amount) > 0
      ? { amount: Number(template.amount) }
      : {}),
  };

  return clean;
}

function migrateList(list) {
  // se template vecchi non hanno payMethod → CASH
  return (list || []).map((t) => {
    const payMethod = safePayMethod(t?.payMethod);
    return {
      ...t,
      payMethod,
      cardId:
        payMethod === PAYMENT_METHOD.CARD ? String(t?.cardId || "").trim() : "",
    };
  });
}

export async function getExpenseTemplates() {
  const raw = await AsyncStorage.getItem(KEY);
  const list = migrateList(safeParse(raw));
  return list;
}

export async function saveExpenseTemplates(list) {
  const clean = migrateList(Array.isArray(list) ? list : []);
  await AsyncStorage.setItem(KEY, JSON.stringify(clean));
}

export async function addExpenseTemplate(template) {
  const list = await getExpenseTemplates();

  const clean = cleanTemplate(template);

  // max 12 template, newest first
  const next = [clean, ...list.filter((t) => t.id !== clean.id)].slice(0, 12);

  await saveExpenseTemplates(next);
  return next;
}

export async function removeExpenseTemplate(id) {
  const list = await getExpenseTemplates();
  const next = list.filter((t) => t.id !== id);
  await saveExpenseTemplates(next);
  return next;
}
