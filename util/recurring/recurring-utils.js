// util/recurring/recurring-utils.js

// ✅ Export “standard”
export const RecurringType = {
  HABIT: "HABIT",
  SUBSCRIPTION: "SUBSCRIPTION",
};

export const Cadence = {
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
  YEARLY: "YEARLY",
};

// -------- helpers date --------
export function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function parseDateSafe(dateLike) {
  if (!dateLike) return null;
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (!d || isNaN(d.getTime())) return null;
  return d;
}

export function isDueTodayOrPast(nextDueLike) {
  const d = parseDateSafe(nextDueLike);
  if (!d) return false;
  return startOfDay(d).getTime() <= startOfDay(new Date()).getTime();
}

export function addCadence(dateLike, cadence) {
  const d = parseDateSafe(dateLike) || new Date();
  const next = new Date(d);

  switch (cadence) {
    case Cadence.DAILY:
      next.setDate(next.getDate() + 1);
      break;
    case Cadence.WEEKLY:
      next.setDate(next.getDate() + 7);
      break;
    case Cadence.YEARLY:
      next.setFullYear(next.getFullYear() + 1);
      break;
    case Cadence.MONTHLY:
    default:
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
}

// ✅ Questo è quello che ti serve per “spostare nel futuro” una ricorrenza scaduta
// Firma compatibile con il tuo codice: advanceToFuture(nextDue, cadence, now)
export function advanceToFuture(nextDueLike, cadence, nowLike = new Date()) {
  const now = parseDateSafe(nowLike) || new Date();
  let d = parseDateSafe(nextDueLike) || new Date(now);

  // Se è già nel futuro: ok
  if (startOfDay(d).getTime() > startOfDay(now).getTime()) return d;

  // Altrimenti “avanza” fino a superare oggi
  let guard = 0;
  while (startOfDay(d).getTime() <= startOfDay(now).getTime() && guard < 200) {
    d = addCadence(d, cadence);
    guard += 1;
  }
  return d;
}

// ✅ Serve per RecurringTimeline / modali (errore: undefined)
export function formatDateShortIT(dateLike) {
  const d = parseDateSafe(dateLike);
  if (!d) return "";
  const months = [
    "Gen",
    "Feb",
    "Mar",
    "Apr",
    "Mag",
    "Giu",
    "Lug",
    "Ago",
    "Set",
    "Ott",
    "Nov",
    "Dic",
  ];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}
