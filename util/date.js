function safeDate(dateLike) {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (!d || isNaN(d.getTime())) return null;
  return d;
}

// ✅ per UI: 05/02/2026
export function formatDateIT(dateLike) {
  const d = safeDate(dateLike);
  if (!d) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// ✅ per UI (se vuoi stile "2026-02-05")
export function formatDateYMD(dateLike) {
  const d = safeDate(dateLike);
  if (!d) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ✅ per salvataggio: ISO sempre safe (non crasha mai)
export function toISODateSafe(dateLike) {
  const d = safeDate(dateLike);
  if (!d) return new Date().toISOString();
  try {
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

// ✅ per filtri: sottrai giorni
export function getDateMinusDays(dateLike, days) {
  const d = safeDate(dateLike) || new Date();
  const out = new Date(d);
  out.setDate(out.getDate() - Number(days || 0));
  return out;
}

// ✅ util per filtri (opzionale)
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
