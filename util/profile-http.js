import { dbUrl, firebaseApi as api, safeId, requestConfig } from "./firebase-rest";

function profileUrl(userId, token) {
  return dbUrl(`users/${safeId(userId)}/profile`, token);
}

function normalizeProfile(raw) {
  const firstName = String(raw?.firstName || "").trim();
  const lastName = String(raw?.lastName || "").trim();
  const email = String(raw?.email || "").trim();

  return {
    firstName,
    lastName,
    email,
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
