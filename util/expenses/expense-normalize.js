import { EXPENSE_ICONS } from "../../constants/expense-icons";

export const ExpenseCategory = {
  FOOD: "FOOD",
  TRANSPORT: "TRANSPORT",
  HOME: "HOME",
  SHOPPING: "SHOPPING",
  HEALTH: "HEALTH",
  FUN: "FUN",
  STUDY_WORK: "STUDY_WORK",
  TECH: "TECH",
  FINANCE: "FINANCE",
  SERVICES: "SERVICES",
  OTHER: "OTHER",
};

export const PaymentMethod = {
  CASH: "CASH",
  CARD: "CARD",
};

export function isValidIonicon(name) {
  return typeof name === "string" && EXPENSE_ICONS.includes(name);
}

export const EMOJI_TO_ICON = {
  "\u{1F6D2}": "cart-outline",
  "\u{1F354}": "fast-food-outline",
  "\u{1F355}": "pizza-outline",
  "\u2615\uFE0F": "cafe-outline",
  "\u{1F697}": "car-outline",
  "\u{1F3E0}": "home-outline",
  "\u{1F3AE}": "game-controller-outline",
  "\u{1F48A}": "medkit-outline",
  "\u{1F4B3}": "card-outline",
  "\u{1F4B0}": "cash-outline",
  "\u{1F6AC}": "flame-outline",
};

export function isKnownEmoji(e) {
  return typeof e === "string" && Object.prototype.hasOwnProperty.call(EMOJI_TO_ICON, e);
}

export function isEmoji(value) {
  if (typeof value !== "string") return false;
  const v = value.trim();
  if (!v) return false;
  if (isValidIonicon(v)) return false;
  if (isKnownEmoji(v)) return true;

  // Fallback leggero per vecchi dati salvati con emoji.
  return /[\u2600-\u27BF]|[\uD83C-\uDBFF\uDC00-\uDFFF]/.test(v);
}

export function getCategoryFromIcon(icon) {
  const i = icon || "";

  if (["cart-outline", "fast-food-outline", "restaurant-outline", "pizza-outline", "cafe-outline"].includes(i)) {
    return ExpenseCategory.FOOD;
  }

  if (["car-outline", "bus-outline", "train-outline", "airplane-outline", "bicycle-outline", "subway-outline"].includes(i)) {
    return ExpenseCategory.TRANSPORT;
  }

  if (["home-outline", "bed-outline", "build-outline", "flash-outline", "water-outline", "construct-outline"].includes(i)) {
    return ExpenseCategory.HOME;
  }

  if (["shirt-outline", "watch-outline", "diamond-outline", "gift-outline", "bag-handle-outline"].includes(i)) {
    return ExpenseCategory.SHOPPING;
  }

  if (["medkit-outline", "fitness-outline", "heart-outline", "bandage-outline"].includes(i)) {
    return ExpenseCategory.HEALTH;
  }

  if (["game-controller-outline", "film-outline", "musical-notes-outline", "headset-outline"].includes(i)) {
    return ExpenseCategory.FUN;
  }

  if (["book-outline", "library-outline", "calculator-outline", "briefcase-outline", "school-outline"].includes(i)) {
    return ExpenseCategory.STUDY_WORK;
  }

  if (["phone-portrait-outline", "laptop-outline", "tv-outline", "camera-outline", "hardware-chip-outline"].includes(i)) {
    return ExpenseCategory.TECH;
  }

  if (["cash-outline", "card-outline", "wallet-outline", "pie-chart-outline", "stats-chart-outline"].includes(i)) {
    return ExpenseCategory.FINANCE;
  }

  if (["receipt-outline", "document-text-outline", "calendar-outline", "time-outline", "file-tray-full-outline"].includes(i)) {
    return ExpenseCategory.SERVICES;
  }

  return ExpenseCategory.OTHER;
}

export function normalizeIcon(rawIcon) {
  const v = typeof rawIcon === "string" ? rawIcon.trim() : rawIcon;
  if (!v) return "pricetag-outline";
  if (isEmoji(v)) return EMOJI_TO_ICON[v] || "pricetag-outline";
  if (!isValidIonicon(v)) return "pricetag-outline";
  return v;
}

export function normalizeExpense(exp) {
  let safeDate = exp?.date instanceof Date ? exp.date : new Date(exp?.date ?? Date.now());
  if (Number.isNaN(safeDate.getTime())) safeDate = new Date();

  const safeAmount = Number(exp?.amount ?? 0);

  const icon = normalizeIcon(exp?.icon);
  const category = exp?.category || getCategoryFromIcon(icon);

  const paymentMethod =
    exp?.methodType === PaymentMethod.CARD ||
    exp?.payMethod === PaymentMethod.CARD ||
    exp?.paymentMethod === PaymentMethod.CARD
      ? PaymentMethod.CARD
      : PaymentMethod.CASH;

  const methodId =
    paymentMethod === PaymentMethod.CARD
      ? String(exp?.methodId || exp?.cardId || "").trim()
      : String(exp?.methodId || exp?.cashId || "").trim();

  return {
    ...exp,
    amount: Number.isFinite(safeAmount) ? safeAmount : 0,
    date: safeDate,
    icon,
    category,
    paymentMethod,
    payMethod: paymentMethod,
    methodType: paymentMethod,
    methodId,
    cardId: paymentMethod === PaymentMethod.CARD ? methodId : "",
    cashId: paymentMethod === PaymentMethod.CASH ? methodId : "",
  };
}
