import {
  Timestamp,
  addDoc,
  collection,
  deleteField,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { db } from "./firebase";

const RECURRENCE_FREQUENCIES = ["daily", "weekly", "monthly"];
const MAX_OCCURRENCES_PER_RANGE = 400;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const EVENTS_ERROR_MESSAGES = {
  fallback: "Operazione sugli eventi non riuscita. Riprova.",
  permission: "Permessi insufficienti per questa operazione sugli eventi.",
  auth: "Sessione utente non valida. Effettua di nuovo l'accesso.",
  notFound: "Evento non trovato.",
};

function normalizeFirestoreErrorCode(error) {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();

  if (code.includes("permission-denied") || message.includes("permission-denied")) {
    return "permission-denied";
  }

  if (code.includes("unauthenticated") || code.includes("auth") || message.includes("missing uid")) {
    return "unauthenticated";
  }

  if (code.includes("not-found") || message.includes("not found")) {
    return "not-found";
  }

  return code;
}

function toEventsError(error, fallbackMessage = EVENTS_ERROR_MESSAGES.fallback) {
  if (error instanceof Error && error.message?.startsWith("MISSING_UID")) {
    return new Error(EVENTS_ERROR_MESSAGES.auth);
  }

  const code = normalizeFirestoreErrorCode(error);

  if (code === "permission-denied") {
    return new Error(EVENTS_ERROR_MESSAGES.permission);
  }

  if (code === "unauthenticated") {
    return new Error(EVENTS_ERROR_MESSAGES.auth);
  }

  if (code === "not-found") {
    return new Error(EVENTS_ERROR_MESSAGES.notFound);
  }

  if (error instanceof Error && error.message) {
    return error;
  }

  return new Error(fallbackMessage);
}

function ensureUid(uid) {
  const normalized = String(uid || "").trim();
  if (!normalized) {
    throw new Error("MISSING_UID");
  }
  return normalized;
}

function assertOwnership(_raw = {}, uid) {
  ensureUid(uid);
}

function toDate(value, fallback) {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }
  return parsed;
}

function toExpectedDuration(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }
  return Math.round(numeric);
}

function toTrackedDurationSeconds(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return 0;
  }
  return Math.round(numeric);
}

function toDateKey(value) {
  const date = toDate(value, new Date());
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(baseDate, days) {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(baseDate, months) {
  const next = new Date(baseDate);
  next.setMonth(next.getMonth() + months);
  return next;
}

function toPositiveInt(value, fallback = 1) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.max(1, Math.round(parsed));
}

function toRecurrence(recurrence, startAt) {
  if (!recurrence || typeof recurrence !== "object") {
    return null;
  }

  const frequency = String(recurrence.frequency || "").toLowerCase();
  if (!RECURRENCE_FREQUENCIES.includes(frequency)) {
    return null;
  }

  const interval = toPositiveInt(recurrence.interval, 1);
  const untilRaw = recurrence.untilAt || recurrence.until || null;
  const untilDate = untilRaw ? toDate(untilRaw, null) : null;
  const normalizedUntil =
    untilDate && startAt && untilDate < startAt
      ? new Date(startAt)
      : untilDate;

  return {
    frequency,
    interval,
    untilAt: normalizedUntil,
  };
}

function toRecurrencePayload(recurrence, startAt) {
  const normalized = toRecurrence(recurrence, startAt);
  if (!normalized) {
    return null;
  }

  return {
    frequency: normalized.frequency,
    interval: normalized.interval,
    untilAt: normalized.untilAt ? Timestamp.fromDate(normalized.untilAt) : null,
  };
}

function fromRecurrencePayload(recurrencePayload, startAt) {
  if (!recurrencePayload || typeof recurrencePayload !== "object") {
    return null;
  }

  const untilAt = recurrencePayload.untilAt?.toDate?.() || recurrencePayload.untilAt || null;
  return toRecurrence(
    {
      frequency: recurrencePayload.frequency,
      interval: recurrencePayload.interval,
      untilAt,
    },
    startAt,
  );
}

function normalizeRecurrenceExceptions(input) {
  if (!input || typeof input !== "object") {
    return {};
  }

  const normalized = {};
  Object.entries(input).forEach(([key, value]) => {
    if (!key) {
      return;
    }
    if (value && typeof value === "object" && value.type === "skip") {
      normalized[key] = { type: "skip" };
    }
  });

  return normalized;
}

function normalizeRecurrenceOverrides(overrides = {}) {
  if (!overrides || typeof overrides !== "object") {
    return {};
  }

  const normalized = {};
  Object.entries(overrides).forEach(([key, value]) => {
    if (!key || !value || typeof value !== "object") {
      return;
    }

    const startAt = value.startAt?.toDate?.() || toDate(value.startAt, null);
    const endAt = value.endAt?.toDate?.() || toDate(value.endAt, startAt);
    if (!startAt || !endAt) {
      return;
    }

    normalized[key] = {
      title: String(value.title || "").trim(),
      startAt,
      endAt: endAt < startAt ? startAt : endAt,
      allDay: Boolean(value.allDay),
      category: String(value.category || "General").trim() || "General",
      notes: String(value.notes || "").trim(),
      location: String(value.location || "").trim(),
      expectedDurationMinutes: toExpectedDuration(value.expectedDurationMinutes),
    };
  });

  return normalized;
}

function toRecurrenceOverridePayload(payload = {}) {
  const startAt = toDate(payload.startAt, new Date());
  const endAt = toDate(payload.endAt, startAt);
  const expectedDurationMinutes = toExpectedDuration(payload.expectedDurationMinutes);

  return {
    title: String(payload.title || "").trim(),
    startAt: Timestamp.fromDate(startAt),
    endAt: Timestamp.fromDate(endAt < startAt ? startAt : endAt),
    expectedDurationMinutes,
    allDay: Boolean(payload.allDay),
    category: String(payload.category || "General").trim() || "General",
    notes: String(payload.notes || "").trim(),
    location: String(payload.location || "").trim(),
  };
}

function addRecurrenceStep(baseStart, recurrence) {
  if (!recurrence) {
    return baseStart;
  }

  if (recurrence.frequency === "daily") {
    return addDays(baseStart, recurrence.interval);
  }

  if (recurrence.frequency === "weekly") {
    return addDays(baseStart, recurrence.interval * 7);
  }

  return addMonths(baseStart, recurrence.interval);
}

function calculateElapsedSeconds(startedAt, now = new Date()) {
  const safeStart = toDate(startedAt, now);
  const safeNow = toDate(now, safeStart);
  const diffMs = safeNow.getTime() - safeStart.getTime();
  if (!Number.isFinite(diffMs) || diffMs <= 0) {
    return 0;
  }
  return Math.floor(diffMs / 1000);
}

function calculateDerivedDurations(startAt, endAt, expectedDurationMinutes) {
  const safeStart = toDate(startAt, new Date());
  const safeEnd = toDate(endAt, safeStart);
  const scheduledDurationMinutes = Math.max(
    0,
    Math.round((safeEnd.getTime() - safeStart.getTime()) / (1000 * 60)),
  );

  if (!expectedDurationMinutes) {
    return {
      scheduledDurationMinutes,
      expectedEndAt: null,
      timeLostMinutes: null,
    };
  }

  const expectedEndAt = new Date(safeStart.getTime() + expectedDurationMinutes * 60 * 1000);
  const timeLostMinutes = scheduledDurationMinutes - expectedDurationMinutes;

  return {
    scheduledDurationMinutes,
    expectedEndAt,
    timeLostMinutes,
  };
}

function toEventPayload(payload = {}) {
  const now = new Date();
  const startDate = toDate(payload.startAt || payload.startDate, now);
  const endDate = toDate(payload.endAt || payload.endDate, startDate);

  const safeEndDate = endDate < startDate ? startDate : endDate;
  const expectedDurationMinutes = toExpectedDuration(payload.expectedDurationMinutes);
  const recurrence = toRecurrencePayload(payload.recurrence, startDate);

  return {
    title: String(payload.title || "").trim(),
    startAt: Timestamp.fromDate(startDate),
    endAt: Timestamp.fromDate(safeEndDate),
    expectedDurationMinutes,
    allDay: Boolean(payload.allDay),
    category: String(payload.category || "General").trim() || "General",
    notes: String(payload.notes || "").trim(),
    location: String(payload.location || "").trim(),
    recurrence,
  };
}

function buildEventFromRaw(id, raw = {}, extra = {}) {
  const startAt = raw.startAt?.toDate?.() || toDate(raw.startAt, null);
  const endAt = raw.endAt?.toDate?.() || toDate(raw.endAt, startAt);
  const expectedDurationMinutes = toExpectedDuration(raw.expectedDurationMinutes);
  const timerStartedAt = raw.timerStartedAt?.toDate?.() || toDate(raw.timerStartedAt, null);
  const trackedDurationSeconds = toTrackedDurationSeconds(raw.trackedDurationSeconds);
  const liveTrackedDurationSeconds =
    trackedDurationSeconds + (timerStartedAt ? calculateElapsedSeconds(timerStartedAt) : 0);
  const actualDurationMinutes = Math.round(liveTrackedDurationSeconds / 60);
  const derived = calculateDerivedDurations(startAt, endAt, expectedDurationMinutes);
  const recurrence = fromRecurrencePayload(raw.recurrence, startAt);
  const recurrenceExceptions = normalizeRecurrenceExceptions(raw.recurrenceExceptions);
  const recurrenceOverrides = normalizeRecurrenceOverrides(raw.recurrenceOverrides);

  return {
    id,
    title: String(raw.title || "").trim(),
    startAt,
    endAt: endAt && startAt && endAt < startAt ? startAt : endAt,
    expectedDurationMinutes,
    scheduledDurationMinutes: derived.scheduledDurationMinutes,
    expectedEndAt: derived.expectedEndAt,
    timeLostMinutes: derived.timeLostMinutes,
    trackedDurationSeconds,
    liveTrackedDurationSeconds,
    actualDurationMinutes,
    isTimerRunning: Boolean(timerStartedAt),
    timerStartedAt,
    plannedVsActualMinutes: actualDurationMinutes - derived.scheduledDurationMinutes,
    expectedVsActualMinutes:
      expectedDurationMinutes === null ? null : actualDurationMinutes - expectedDurationMinutes,
    recurrence,
    recurrenceExceptions,
    recurrenceOverrides,
    allDay: Boolean(raw.allDay),
    category: raw.category || "General",
    notes: raw.notes || "",
    location: raw.location || "",
    createdAt: raw.createdAt?.toDate?.() || null,
    updatedAt: raw.updatedAt?.toDate?.() || null,
    parentRecurringEventId: extra.parentRecurringEventId || null,
    isRecurringOccurrence: Boolean(extra.isRecurringOccurrence),
    occurrenceDateKey: extra.occurrenceDateKey || null,
  };
}

function fromEventDoc(snapshot) {
  return buildEventFromRaw(snapshot.id, snapshot.data());
}

function expandRecurringEvent(masterEvent, rangeStart, rangeEnd) {
  if (!masterEvent?.recurrence || !masterEvent.startAt || !masterEvent.endAt) {
    return [masterEvent];
  }

  const occurrences = [];
  const durationMs = Math.max(0, masterEvent.endAt.getTime() - masterEvent.startAt.getTime());
  const recurrence = masterEvent.recurrence;
  const untilAt = recurrence.untilAt ? toDate(recurrence.untilAt, null) : null;
  const untilAtInclusive = untilAt
    ? new Date(
        untilAt.getFullYear(),
        untilAt.getMonth(),
        untilAt.getDate(),
        23,
        59,
        59,
        999,
      )
    : null;

  let cursorStart = new Date(masterEvent.startAt);
  let iterations = 0;

  if (recurrence.frequency === "daily" || recurrence.frequency === "weekly") {
    const stepDays = recurrence.frequency === "daily" ? recurrence.interval : recurrence.interval * 7;
    if (rangeStart > cursorStart) {
      const diffDays = Math.floor((rangeStart.getTime() - cursorStart.getTime()) / DAY_IN_MS);
      const jumpSteps = Math.max(0, Math.floor(diffDays / stepDays));
      cursorStart = addDays(cursorStart, jumpSteps * stepDays);
    }
  }

  while (iterations < MAX_OCCURRENCES_PER_RANGE) {
    iterations += 1;
    const occurrenceStart = new Date(cursorStart);
    const occurrenceEnd = new Date(occurrenceStart.getTime() + durationMs);

    if (untilAtInclusive && occurrenceStart > untilAtInclusive) {
      break;
    }

    if (occurrenceStart > rangeEnd) {
      break;
    }

    const occurrenceDateKey = toDateKey(occurrenceStart);
    const hasSkipException = masterEvent.recurrenceExceptions?.[occurrenceDateKey]?.type === "skip";
    const override = masterEvent.recurrenceOverrides?.[occurrenceDateKey] || null;

    if (!hasSkipException && occurrenceEnd >= rangeStart) {
      if (override) {
        const overrideEvent = buildEventFromRaw(
          `${masterEvent.id}::${occurrenceDateKey}`,
          {
            ...masterEvent,
            ...override,
            recurrence: null,
            recurrenceExceptions: {},
            recurrenceOverrides: {},
          },
          {
            parentRecurringEventId: masterEvent.id,
            isRecurringOccurrence: true,
            occurrenceDateKey,
          },
        );
        occurrences.push(overrideEvent);
      } else {
        const generatedOccurrence = buildEventFromRaw(
          `${masterEvent.id}::${occurrenceDateKey}`,
          {
            ...masterEvent,
            startAt: occurrenceStart,
            endAt: occurrenceEnd,
            recurrence: null,
            recurrenceExceptions: {},
            recurrenceOverrides: {},
          },
          {
            parentRecurringEventId: masterEvent.id,
            isRecurringOccurrence: true,
            occurrenceDateKey,
          },
        );
        occurrences.push(generatedOccurrence);
      }
    }

    cursorStart = addRecurrenceStep(cursorStart, recurrence);
  }

  return occurrences;
}

function eventsCollection(uid) {
  return collection(db, "users", ensureUid(uid), "events");
}

function eventDocument(uid, eventId) {
  return doc(db, "users", ensureUid(uid), "events", String(eventId || "").trim());
}

export async function createEvent(uid, payload) {
  const safeUid = ensureUid(uid);

  try {
    const eventPayload = toEventPayload(payload);
    if (!eventPayload.title) {
      throw new Error("Il titolo evento e obbligatorio.");
    }

    const derived = calculateDerivedDurations(
      eventPayload.startAt.toDate(),
      eventPayload.endAt.toDate(),
      eventPayload.expectedDurationMinutes,
    );
    const now = new Date();

    const docRef = await addDoc(eventsCollection(safeUid), {
      ...eventPayload,
      recurrenceExceptions: {},
      recurrenceOverrides: {},
      trackedDurationSeconds: 0,
      timerStartedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      ...payload,
      ...eventPayload,
      startAt: eventPayload.startAt.toDate(),
      endAt: eventPayload.endAt.toDate(),
      scheduledDurationMinutes: derived.scheduledDurationMinutes,
      expectedEndAt: derived.expectedEndAt,
      timeLostMinutes: derived.timeLostMinutes,
      trackedDurationSeconds: 0,
      liveTrackedDurationSeconds: 0,
      actualDurationMinutes: 0,
      isTimerRunning: false,
      timerStartedAt: null,
      plannedVsActualMinutes: -derived.scheduledDurationMinutes,
      expectedVsActualMinutes:
        eventPayload.expectedDurationMinutes === null ? null : -eventPayload.expectedDurationMinutes,
      recurrence: eventPayload.recurrence
        ? {
            ...eventPayload.recurrence,
            untilAt: eventPayload.recurrence.untilAt?.toDate?.() || null,
          }
        : null,
      recurrenceExceptions: {},
      recurrenceOverrides: {},
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    throw toEventsError(error, "Impossibile creare l'evento.");
  }
}

export async function updateEvent(uid, eventId, payload) {
  const safeUid = ensureUid(uid);

  try {
    const eventPayload = toEventPayload(payload);
    if (!eventPayload.title) {
      throw new Error("Il titolo evento e obbligatorio.");
    }

    const derived = calculateDerivedDurations(
      eventPayload.startAt.toDate(),
      eventPayload.endAt.toDate(),
      eventPayload.expectedDurationMinutes,
    );

    const docRef = eventDocument(safeUid, eventId);
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(docRef);
      if (!snapshot.exists()) {
        throw new Error("Evento non trovato.");
      }

      const currentData = snapshot.data();
      assertOwnership(currentData, safeUid);

      const nextData = {
        ...eventPayload,
        updatedAt: serverTimestamp(),
      };

      if (!eventPayload.recurrence) {
        nextData.recurrence = null;
        nextData.recurrenceExceptions = {};
        nextData.recurrenceOverrides = {};
      }

      transaction.update(docRef, nextData);
    });

    return {
      id: eventId,
      ...payload,
      ...eventPayload,
      startAt: eventPayload.startAt.toDate(),
      endAt: eventPayload.endAt.toDate(),
      scheduledDurationMinutes: derived.scheduledDurationMinutes,
      expectedEndAt: derived.expectedEndAt,
      timeLostMinutes: derived.timeLostMinutes,
      recurrence: eventPayload.recurrence
        ? {
            ...eventPayload.recurrence,
            untilAt: eventPayload.recurrence.untilAt?.toDate?.() || null,
          }
        : null,
    };
  } catch (error) {
    throw toEventsError(error, "Impossibile aggiornare l'evento.");
  }
}

export async function deleteEvent(uid, eventId) {
  const safeUid = ensureUid(uid);

  try {
    const docRef = eventDocument(safeUid, eventId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      throw new Error("Evento non trovato.");
    }

    const currentData = snapshot.data();
    assertOwnership(currentData, safeUid);

    await deleteDoc(docRef);
  } catch (error) {
    throw toEventsError(error, "Impossibile eliminare l'evento.");
  }
}

export async function getEventById(uid, eventId) {
  const safeUid = ensureUid(uid);

  try {
    const docRef = eventDocument(safeUid, eventId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      throw new Error("Evento non trovato.");
    }

    assertOwnership(snapshot.data(), safeUid);
    return fromEventDoc(snapshot);
  } catch (error) {
    throw toEventsError(error, "Impossibile leggere l'evento.");
  }
}

export async function getEventsByRange(uid, startDate, endDate) {
  const safeUid = ensureUid(uid);

  try {
    const normalizedStart = toDate(startDate, new Date());
    const normalizedEnd = toDate(endDate, normalizedStart);

    const rangeStart = normalizedStart <= normalizedEnd ? normalizedStart : normalizedEnd;
    const rangeEnd = normalizedEnd >= normalizedStart ? normalizedEnd : normalizedStart;
    const rangeEndTimestamp = Timestamp.fromDate(rangeEnd);

    const eventsQuery = query(
      eventsCollection(safeUid),
      where("startAt", "<=", rangeEndTimestamp),
      orderBy("startAt", "asc"),
    );

    const snapshot = await getDocs(eventsQuery);

    const ownedDocs = snapshot.docs.filter((docSnapshot) => {
      try {
        assertOwnership(docSnapshot.data(), safeUid);
        return true;
      } catch {
        return false;
      }
    });

    return ownedDocs
      .map(fromEventDoc)
      .flatMap((event) => {
        if (event.recurrence) {
          return expandRecurringEvent(event, rangeStart, rangeEnd);
        }
        return [event];
      })
      .filter((event) => {
        if (!event.startAt || !event.endAt) {
          return false;
        }

        return event.endAt >= rangeStart && event.startAt <= rangeEnd;
      })
      .sort((a, b) => {
        const aTime = a.startAt?.getTime?.() || 0;
        const bTime = b.startAt?.getTime?.() || 0;
        return aTime - bTime;
      });
  } catch (error) {
    throw toEventsError(error, "Impossibile caricare gli eventi.");
  }
}

export async function skipRecurringOccurrence(uid, eventId, occurrenceDateKey) {
  const safeUid = ensureUid(uid);

  try {
    const safeKey = String(occurrenceDateKey || "").trim();
    if (!safeKey) {
      throw new Error("Data occorrenza mancante.");
    }

    const docRef = eventDocument(safeUid, eventId);
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(docRef);
      if (!snapshot.exists()) {
        throw new Error("Evento non trovato.");
      }

      const data = snapshot.data();
      assertOwnership(data, safeUid);
      if (!data.recurrence || !RECURRENCE_FREQUENCIES.includes(String(data.recurrence.frequency || "").toLowerCase())) {
        throw new Error("L'evento non e ricorrente.");
      }

      transaction.update(docRef, {
        [`recurrenceExceptions.${safeKey}`]: { type: "skip" },
        updatedAt: serverTimestamp(),
      });
    });

    return getEventById(safeUid, eventId);
  } catch (error) {
    throw toEventsError(error, "Impossibile saltare l'occorrenza.");
  }
}

export async function saveRecurringOccurrenceOverride(uid, eventId, occurrenceDateKey, payload) {
  const safeUid = ensureUid(uid);

  try {
    const safeKey = String(occurrenceDateKey || "").trim();
    if (!safeKey) {
      throw new Error("Data occorrenza mancante.");
    }

    const overridePayload = toRecurrenceOverridePayload(payload);
    if (!overridePayload.title) {
      throw new Error("Il titolo evento e obbligatorio.");
    }

    const docRef = eventDocument(safeUid, eventId);
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(docRef);
      if (!snapshot.exists()) {
        throw new Error("Evento non trovato.");
      }

      const data = snapshot.data();
      assertOwnership(data, safeUid);
      if (!data.recurrence || !RECURRENCE_FREQUENCIES.includes(String(data.recurrence.frequency || "").toLowerCase())) {
        throw new Error("L'evento non e ricorrente.");
      }

      transaction.update(docRef, {
        [`recurrenceOverrides.${safeKey}`]: overridePayload,
        [`recurrenceExceptions.${safeKey}`]: deleteField(),
        updatedAt: serverTimestamp(),
      });
    });

    return getEventById(safeUid, eventId);
  } catch (error) {
    throw toEventsError(error, "Impossibile salvare la modifica dell'occorrenza.");
  }
}

export async function startEventTimer(uid, eventId) {
  const safeUid = ensureUid(uid);

  try {
    const docRef = eventDocument(safeUid, eventId);

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(docRef);

      if (!snapshot.exists()) {
        throw new Error("Evento non trovato.");
      }

      const data = snapshot.data();
      assertOwnership(data, safeUid);
      const hasRunningTimer = Boolean(data.timerStartedAt?.toDate?.());

      if (hasRunningTimer) {
        return;
      }

      transaction.update(docRef, {
        timerStartedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    return getEventById(safeUid, eventId);
  } catch (error) {
    throw toEventsError(error, "Impossibile avviare il timer.");
  }
}

export async function stopEventTimer(uid, eventId) {
  const safeUid = ensureUid(uid);

  try {
    const docRef = eventDocument(safeUid, eventId);

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(docRef);

      if (!snapshot.exists()) {
        throw new Error("Evento non trovato.");
      }

      const data = snapshot.data();
      assertOwnership(data, safeUid);
      const startedAt = data.timerStartedAt?.toDate?.();

      if (!startedAt) {
        return;
      }

      const baseSeconds = toTrackedDurationSeconds(data.trackedDurationSeconds);
      const elapsedSeconds = calculateElapsedSeconds(startedAt);

      transaction.update(docRef, {
        trackedDurationSeconds: baseSeconds + elapsedSeconds,
        timerStartedAt: null,
        updatedAt: serverTimestamp(),
      });
    });

    return getEventById(safeUid, eventId);
  } catch (error) {
    throw toEventsError(error, "Impossibile fermare il timer.");
  }
}
