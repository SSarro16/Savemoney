import {
  Timestamp,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "./firebase";

const PROFILE_ERROR_MESSAGES = {
  read: "Impossibile leggere il profilo utente.",
  save: "Impossibile salvare il profilo utente.",
  permission: "Permessi insufficienti per aggiornare il profilo.",
  auth: "Sessione non valida. Effettua di nuovo il login.",
  invalidProfile: "Completa tutti i campi profilo richiesti.",
};

const MIN_BIRTH_DATE = new Date("1900-01-01T00:00:00.000Z");
const GENDERS = ["male", "female"];

function normalizeFirestoreErrorCode(error) {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();

  if (code.includes("permission-denied") || message.includes("permission-denied")) {
    return "permission-denied";
  }

  if (
    code.includes("unauthenticated")
    || message.includes("missing uid")
    || message.includes("auth")
  ) {
    return "unauthenticated";
  }

  return code;
}

function toProfileError(error, fallbackMessage) {
  const code = normalizeFirestoreErrorCode(error);

  if (code === "permission-denied") {
    return new Error(PROFILE_ERROR_MESSAGES.permission);
  }

  if (code === "unauthenticated") {
    return new Error(PROFILE_ERROR_MESSAGES.auth);
  }

  if (error instanceof Error && error.message) {
    return error;
  }

  return new Error(fallbackMessage);
}

function ensureUid(uid) {
  const safeUid = String(uid || "").trim();
  if (!safeUid) {
    throw new Error("MISSING_UID");
  }
  return safeUid;
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeGender(value) {
  const normalized = normalizeText(value).toLowerCase();
  return GENDERS.includes(normalized) ? normalized : "";
}

function toDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value?.toDate === "function") {
    const parsed = value.toDate();
    return Number.isNaN(parsed?.getTime?.()) ? null : parsed;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isReasonableBirthDate(value) {
  const birthDate = toDate(value);
  if (!birthDate) {
    return false;
  }

  const now = new Date();
  return birthDate <= now && birthDate >= MIN_BIRTH_DATE;
}

function resolveTimezone(rawTimezone) {
  const normalized = normalizeText(rawTimezone);
  if (normalized) {
    return normalized;
  }

  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return normalizeText(detected) || "UTC";
  } catch {
    return "UTC";
  }
}

function buildDisplayName(firstName, lastName, fallbackEmail = "", fallbackDisplayName = "") {
  const safeFirstName = normalizeText(firstName);
  const safeLastName = normalizeText(lastName);
  const fullName = `${safeFirstName} ${safeLastName}`.trim();
  if (fullName) {
    return fullName;
  }

  const safeDisplayName = normalizeText(fallbackDisplayName);
  if (safeDisplayName) {
    return safeDisplayName;
  }

  const safeEmail = normalizeText(fallbackEmail);
  if (safeEmail.includes("@")) {
    return safeEmail.split("@")[0];
  }

  return "Savetime";
}

function userDocument(uid) {
  return doc(db, "users", ensureUid(uid));
}

function toProfile(uid, raw = {}) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const firstName = normalizeText(raw.firstName);
  const lastName = normalizeText(raw.lastName);
  const gender = normalizeGender(raw.gender);
  const dateOfBirth = toDate(raw.dateOfBirth);

  return {
    uid: normalizeText(raw.uid) || uid,
    email: normalizeText(raw.email),
    displayName: buildDisplayName(
      firstName,
      lastName,
      normalizeText(raw.email),
      normalizeText(raw.displayName),
    ),
    photoURL: normalizeText(raw.photoURL),
    timezone: resolveTimezone(raw.timezone),
    firstName,
    lastName,
    gender,
    dateOfBirth,
    createdAt: toDate(raw.createdAt),
    updatedAt: toDate(raw.updatedAt),
  };
}

function toValidationResult(payload = {}) {
  const normalized = {
    firstName: normalizeText(payload.firstName),
    lastName: normalizeText(payload.lastName),
    gender: normalizeGender(payload.gender),
    dateOfBirth: toDate(payload.dateOfBirth),
  };

  const missing = [];
  if (!normalized.firstName) {
    missing.push("firstName");
  }
  if (!normalized.lastName) {
    missing.push("lastName");
  }
  if (!normalized.gender) {
    missing.push("gender");
  }
  if (!isReasonableBirthDate(normalized.dateOfBirth)) {
    missing.push("dateOfBirth");
  }

  return { normalized, missing };
}

export function getMissingProfileFields(profile) {
  const source = profile || {};
  const missing = [];

  if (!normalizeText(source.firstName)) {
    missing.push("firstName");
  }
  if (!normalizeText(source.lastName)) {
    missing.push("lastName");
  }
  if (!normalizeGender(source.gender)) {
    missing.push("gender");
  }
  if (!isReasonableBirthDate(source.dateOfBirth)) {
    missing.push("dateOfBirth");
  }

  return missing;
}

export function isProfileComplete(profile) {
  return getMissingProfileFields(profile).length === 0;
}

export async function getUserProfile(uid) {
  const safeUid = ensureUid(uid);

  try {
    const snapshot = await getDoc(userDocument(safeUid));
    if (!snapshot.exists()) {
      return null;
    }

    return toProfile(safeUid, snapshot.data());
  } catch (error) {
    throw toProfileError(error, PROFILE_ERROR_MESSAGES.read);
  }
}

export async function ensureUserProfileBase(uid, authData = {}) {
  const safeUid = ensureUid(uid);

  try {
    const docRef = userDocument(safeUid);
    const snapshot = await getDoc(docRef);

    const safeEmail = normalizeText(authData.email);
    const safeDisplayName = normalizeText(authData.displayName)
      || buildDisplayName("", "", safeEmail, "");
    const safePhotoURL = normalizeText(authData.photoURL);
    const safeTimezone = resolveTimezone("");

    if (!snapshot.exists()) {
      await setDoc(docRef, {
        uid: safeUid,
        email: safeEmail,
        displayName: safeDisplayName,
        photoURL: safePhotoURL,
        timezone: safeTimezone,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return getUserProfile(safeUid);
    }

    const current = snapshot.data();
    const patch = {
      updatedAt: serverTimestamp(),
    };
    let shouldUpdate = false;

    if (!normalizeText(current.uid)) {
      patch.uid = safeUid;
      shouldUpdate = true;
    }
    if (!normalizeText(current.timezone)) {
      patch.timezone = safeTimezone;
      shouldUpdate = true;
    }
    if (safeEmail && normalizeText(current.email) !== safeEmail) {
      patch.email = safeEmail;
      shouldUpdate = true;
    }
    if (safeDisplayName && normalizeText(current.displayName) !== safeDisplayName) {
      patch.displayName = safeDisplayName;
      shouldUpdate = true;
    }
    if (safePhotoURL && normalizeText(current.photoURL) !== safePhotoURL) {
      patch.photoURL = safePhotoURL;
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      await updateDoc(docRef, patch);
      return getUserProfile(safeUid);
    }

    return toProfile(safeUid, current);
  } catch (error) {
    throw toProfileError(error, PROFILE_ERROR_MESSAGES.save);
  }
}

export async function saveUserProfile(uid, email, payload) {
  const safeUid = ensureUid(uid);

  try {
    const snapshot = await getDoc(userDocument(safeUid));
    const existingData = snapshot.exists() ? snapshot.data() : null;
    const existingProfile = existingData ? toProfile(safeUid, existingData) : null;
    const { normalized, missing } = toValidationResult({
      firstName: payload?.firstName ?? existingProfile?.firstName,
      lastName: payload?.lastName ?? existingProfile?.lastName,
      gender: payload?.gender ?? existingProfile?.gender,
      dateOfBirth: payload?.dateOfBirth ?? existingProfile?.dateOfBirth,
    });

    if (missing.length > 0) {
      throw new Error(PROFILE_ERROR_MESSAGES.invalidProfile);
    }

    const safeEmail = normalizeText(email || existingProfile?.email);
    const nextData = {
      uid: safeUid,
      email: safeEmail,
      displayName: buildDisplayName(
        normalized.firstName,
        normalized.lastName,
        safeEmail,
        existingProfile?.displayName,
      ),
      photoURL: normalizeText(existingProfile?.photoURL),
      timezone: resolveTimezone(existingProfile?.timezone),
      firstName: normalized.firstName,
      lastName: normalized.lastName,
      gender: normalized.gender,
      dateOfBirth: Timestamp.fromDate(normalized.dateOfBirth),
      updatedAt: serverTimestamp(),
    };

    if (snapshot.exists()) {
      await updateDoc(userDocument(safeUid), nextData);
    } else {
      await setDoc(userDocument(safeUid), {
        ...nextData,
        createdAt: serverTimestamp(),
      });
    }

    return getUserProfile(safeUid);
  } catch (error) {
    if (error instanceof Error && error.message === PROFILE_ERROR_MESSAGES.invalidProfile) {
      throw error;
    }
    throw toProfileError(error, PROFILE_ERROR_MESSAGES.save);
  }
}

