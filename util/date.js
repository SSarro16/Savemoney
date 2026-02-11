import { getCurrentLocaleTag } from "../store/language-context";

function safeDate(dateLike) {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (!d || Number.isNaN(d.getTime())) return null;
  return d;
}

// Keep function name for backward compatibility, but output follows current app locale.
export function formatDateIT(dateLike) {
  const d = safeDate(dateLike);
  if (!d) return "";
  return d.toLocaleDateString(getCurrentLocaleTag(), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateYMD(dateLike) {
  const d = safeDate(dateLike);
  if (!d) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toISODateSafe(dateLike) {
  const d = safeDate(dateLike);
  if (!d) return new Date().toISOString();
  try {
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export function getDateMinusDays(dateLike, days) {
  const d = safeDate(dateLike) || new Date();
  const out = new Date(d);
  out.setDate(out.getDate() - Number(days || 0));
  return out;
}

export function startOfDay(dateLike) {
  const d = safeDate(dateLike) || new Date();
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

export function endOfDay(dateLike) {
  const d = safeDate(dateLike) || new Date();
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
}
