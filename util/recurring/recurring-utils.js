import { getCurrentLocaleTag } from "../../store/language-context";

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

export function startOfDay(dateLike) {
  const value = new Date(dateLike);
  value.setHours(0, 0, 0, 0);
  return value;
}

export function parseDateSafe(dateLike) {
  if (!dateLike) return null;
  const parsed = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (!parsed || Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function isDueTodayOrPast(nextDueLike) {
  const date = parseDateSafe(nextDueLike);
  if (!date) return false;
  return startOfDay(date).getTime() <= startOfDay(new Date()).getTime();
}

export function addCadence(dateLike, cadence) {
  const current = parseDateSafe(dateLike) || new Date();
  const next = new Date(current);

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

export function advanceToFuture(nextDueLike, cadence, nowLike = new Date()) {
  const now = parseDateSafe(nowLike) || new Date();
  let next = parseDateSafe(nextDueLike) || new Date(now);

  if (startOfDay(next).getTime() > startOfDay(now).getTime()) return next;

  let guard = 0;
  while (
    startOfDay(next).getTime() <= startOfDay(now).getTime() &&
    guard < 200
  ) {
    next = addCadence(next, cadence);
    guard += 1;
  }

  return next;
}

export function formatDateShortIT(dateLike) {
  const parsed = parseDateSafe(dateLike);
  if (!parsed) return "";
  return parsed
    .toLocaleDateString(getCurrentLocaleTag(), {
      day: "numeric",
      month: "short",
    })
    .replace(/,/g, "");
}
