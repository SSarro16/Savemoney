import { dbUrl, firebaseApi as api, safeId, requestConfig } from "./firebase-rest";

function profileUrl(userId, token) {
  return dbUrl(`users/${safeId(userId)}/profile`, token);
}

function normalizeProfile(raw) {
  const firstName = String(raw?.firstName || "").trim();
  const lastName = String(raw?.lastName || "").trim();
  const email = String(raw?.email || "").trim();
  const genderRaw = String(raw?.gender || "").trim().toUpperCase();
  const gender = genderRaw === "MALE" || genderRaw === "FEMALE" ? genderRaw : "";
  const dobCandidate = raw?.dateOfBirth ? new Date(raw.dateOfBirth) : null;
  const dateOfBirth =
    dobCandidate instanceof Date && !Number.isNaN(dobCandidate.getTime())
      ? dobCandidate.toISOString()
      : "";

  return {
    firstName,
    lastName,
    email,
    gender,
    dateOfBirth,
    updatedAt: raw?.updatedAt || new Date().toISOString(),
  };
}

export async function fetchUserProfile(userId, token) {
  if (!userId || !token) return null;

  try {
    const response = await api.get(profileUrl(userId, token), requestConfig(token));
    if (!response?.data) return null;
    return normalizeProfile(response.data);
  } catch {
    return null;
  }
}

export async function saveUserProfile(userId, token, profile) {
  if (!userId || !token) return null;

  const payload = normalizeProfile(profile);
  await api.patch(
    profileUrl(userId, token),
    {
      ...payload,
      updatedAt: new Date().toISOString(),
    },
    requestConfig(token),
  );

  return payload;
}
