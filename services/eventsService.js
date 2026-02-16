import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "./firebase";

function ensureUid(uid) {
  const normalized = String(uid || "").trim();
  if (!normalized) {
    throw new Error("Missing uid for events operation.");
  }
  return normalized;
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

  return {
    title: String(payload.title || "").trim(),
    startAt: Timestamp.fromDate(startDate),
    endAt: Timestamp.fromDate(safeEndDate),
    expectedDurationMinutes,
    allDay: Boolean(payload.allDay),
    category: String(payload.category || "General").trim() || "General",
    notes: String(payload.notes || "").trim(),
    location: String(payload.location || "").trim(),
  };
}

function fromEventDoc(snapshot) {
  const data = snapshot.data();
  const startAt = data.startAt?.toDate?.() || null;
  const endAt = data.endAt?.toDate?.() || null;
  const expectedDurationMinutes = toExpectedDuration(data.expectedDurationMinutes);
  const timerStartedAt = data.timerStartedAt?.toDate?.() || null;
  const trackedDurationSeconds = toTrackedDurationSeconds(data.trackedDurationSeconds);
  const liveTrackedDurationSeconds =
    trackedDurationSeconds + (timerStartedAt ? calculateElapsedSeconds(timerStartedAt) : 0);
  const actualDurationMinutes = Math.round(liveTrackedDurationSeconds / 60);
  const derived = calculateDerivedDurations(startAt, endAt, expectedDurationMinutes);

  return {
    id: snapshot.id,
    title: data.title,
    startAt,
    endAt,
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
    allDay: Boolean(data.allDay),
    category: data.category || "General",
    notes: data.notes || "",
    location: data.location || "",
    createdAt: data.createdAt?.toDate?.() || null,
    updatedAt: data.updatedAt?.toDate?.() || null,
  };
}

function eventsCollection(uid) {
  return collection(db, "users", ensureUid(uid), "events");
}

function eventDocument(uid, eventId) {
  return doc(db, "users", ensureUid(uid), "events", String(eventId || "").trim());
}

export async function createEvent(uid, payload) {
  const eventPayload = toEventPayload(payload);
  if (!eventPayload.title) {
    throw new Error("Event title is required.");
  }
  const derived = calculateDerivedDurations(
    eventPayload.startAt.toDate(),
    eventPayload.endAt.toDate(),
    eventPayload.expectedDurationMinutes,
  );

  const now = Timestamp.now();
  const docRef = await addDoc(eventsCollection(uid), {
    ...eventPayload,
    trackedDurationSeconds: 0,
    timerStartedAt: null,
    createdAt: now,
    updatedAt: now,
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
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  };
}

export async function updateEvent(uid, eventId, payload) {
  const eventPayload = toEventPayload(payload);
  if (!eventPayload.title) {
    throw new Error("Event title is required.");
  }
  const derived = calculateDerivedDurations(
    eventPayload.startAt.toDate(),
    eventPayload.endAt.toDate(),
    eventPayload.expectedDurationMinutes,
  );

  const docRef = eventDocument(uid, eventId);
  await updateDoc(docRef, {
    ...eventPayload,
    updatedAt: Timestamp.now(),
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
  };
}

export async function deleteEvent(uid, eventId) {
  const docRef = eventDocument(uid, eventId);
  await deleteDoc(docRef);
}

export async function getEventById(uid, eventId) {
  const docRef = eventDocument(uid, eventId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    throw new Error("Event not found.");
  }

  return fromEventDoc(snapshot);
}

export async function getEventsByRange(uid, startDate, endDate) {
  const normalizedStart = toDate(startDate, new Date());
  const normalizedEnd = toDate(endDate, normalizedStart);

  const rangeStart = normalizedStart <= normalizedEnd ? normalizedStart : normalizedEnd;
  const rangeEnd = normalizedEnd >= normalizedStart ? normalizedEnd : normalizedStart;

  const rangeStartTimestamp = Timestamp.fromDate(rangeStart);
  const rangeEndTimestamp = Timestamp.fromDate(rangeEnd);

  const eventsQuery = query(
    eventsCollection(uid),
    where("startAt", "<=", rangeEndTimestamp),
    orderBy("startAt", "asc"),
  );

  const snapshot = await getDocs(eventsQuery);

  return snapshot.docs
    .map(fromEventDoc)
    .filter((event) => {
      if (!event.startAt || !event.endAt) {
        return false;
      }

      return event.endAt >= rangeStartTimestamp.toDate();
    });
}

export async function startEventTimer(uid, eventId) {
  const docRef = eventDocument(uid, eventId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(docRef);

    if (!snapshot.exists()) {
      throw new Error("Event not found.");
    }

    const data = snapshot.data();
    if (data.timerStartedAt?.toDate?.()) {
      return;
    }

    const now = Timestamp.now();
    transaction.update(docRef, {
      timerStartedAt: now,
      updatedAt: now,
    });
  });

  return getEventById(uid, eventId);
}

export async function stopEventTimer(uid, eventId) {
  const docRef = eventDocument(uid, eventId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(docRef);

    if (!snapshot.exists()) {
      throw new Error("Event not found.");
    }

    const data = snapshot.data();
    const startedAt = data.timerStartedAt?.toDate?.();
    if (!startedAt) {
      return;
    }

    const baseSeconds = toTrackedDurationSeconds(data.trackedDurationSeconds);
    const elapsedSeconds = calculateElapsedSeconds(startedAt);
    const now = Timestamp.now();

    transaction.update(docRef, {
      trackedDurationSeconds: baseSeconds + elapsedSeconds,
      timerStartedAt: null,
      updatedAt: now,
    });
  });

  return getEventById(uid, eventId);
}
