import {
  addDays,
  endOfDay as dateFnsEndOfDay,
  endOfMonth as dateFnsEndOfMonth,
  endOfWeek as dateFnsEndOfWeek,
  format,
  isSameDay as dateFnsIsSameDay,
  startOfDay as dateFnsStartOfDay,
  startOfMonth as dateFnsStartOfMonth,
  startOfWeek as dateFnsStartOfWeek,
} from "date-fns";

const WEEK_OPTIONS = { weekStartsOn: 1 };

export function toDate(value, fallback = new Date()) {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }
  return parsed;
}

export function startOfDay(value) {
  return dateFnsStartOfDay(toDate(value));
}

export function endOfDay(value) {
  return dateFnsEndOfDay(toDate(value));
}

export function startOfWeek(value) {
  return dateFnsStartOfWeek(toDate(value), WEEK_OPTIONS);
}

export function endOfWeek(value) {
  return dateFnsEndOfWeek(toDate(value), WEEK_OPTIONS);
}

export function startOfMonth(value) {
  return dateFnsStartOfMonth(toDate(value));
}

export function endOfMonth(value) {
  return dateFnsEndOfMonth(toDate(value));
}

export function formatDate(value, pattern = "yyyy-MM-dd") {
  return format(toDate(value), pattern);
}

export function formatDateTime(value, pattern = "dd MMM yyyy HH:mm") {
  return format(toDate(value), pattern);
}

export function formatTime(value, pattern = "HH:mm") {
  return format(toDate(value), pattern);
}

export function formatWeekRangeLabel(value) {
  const start = startOfWeek(value);
  const end = endOfWeek(value);
  return `${format(start, "MMM d")} - ${format(end, "d")}`;
}

export function isSameDay(a, b) {
  return dateFnsIsSameDay(toDate(a), toDate(b));
}

export function eachDayBetween(startValue, endValue, maxDays = 120) {
  const start = startOfDay(startValue);
  const end = startOfDay(toDate(endValue, start));

  const rangeStart = start <= end ? start : end;
  const rangeEnd = end >= start ? end : start;

  const days = [];
  let cursor = new Date(rangeStart);

  while (cursor <= rangeEnd && days.length < maxDays) {
    days.push(new Date(cursor));
    cursor = addDays(cursor, 1);
  }

  return days;
}
