import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
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

function toEventPayload(payload = {}) {
  const now = new Date();
  const startDate = toDate(payload.startAt || payload.startDate, now);
  const endDate = toDate(payload.endAt || payload.endDate, startDate);

  const safeEndDate = endDate < startDate ? startDate : endDate;

  return {
    title: String(payload.title || "").trim(),
    startAt: Timestamp.fromDate(startDate),
    endAt: Timestamp.fromDate(safeEndDate),
    allDay: Boolean(payload.allDay),
    category: String(payload.category || "General").trim() || "General",
    notes: String(payload.notes || "").trim(),
    location: String(payload.location || "").trim(),
  };
}

function fromEventDoc(snapshot) {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    title: data.title,
    startAt: data.startAt?.toDate?.() || null,
    endAt: data.endAt?.toDate?.() || null,
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

  const now = Timestamp.now();
  const docRef = await addDoc(eventsCollection(uid), {
    ...eventPayload,
    createdAt: now,
    updatedAt: now,
  });

  return {
    id: docRef.id,
    ...payload,
    ...eventPayload,
    startAt: eventPayload.startAt.toDate(),
    endAt: eventPayload.endAt.toDate(),
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  };
}

export async function updateEvent(uid, eventId, payload) {
  const eventPayload = toEventPayload(payload);
  if (!eventPayload.title) {
    throw new Error("Event title is required.");
  }

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
  };
}

export async function deleteEvent(uid, eventId) {
  const docRef = eventDocument(uid, eventId);
  await deleteDoc(docRef);
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
