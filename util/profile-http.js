import axios from "axios";

const BACKEND_URL =
  "https://react-native-section10-d8ef4-default-rtdb.europe-west1.firebasedatabase.app";

function safeId(value) {
  return encodeURIComponent(String(value || "").trim());
}

function authQuery(token) {
  return `auth=${encodeURIComponent(String(token || ""))}`;
}

function requestConfig(token) {
  return {
    timeout: 15000,
  };
}

function profileUrl(userId, token) {
  return `${BACKEND_URL}/users/${safeId(userId)}/profile.json?${authQuery(token)}`;
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
    const response = await axios.get(profileUrl(userId, token), requestConfig(token));
    if (!response?.data) return null;
    return normalizeProfile(response.data);
  } catch {
    return null;
  }
}

export async function saveUserProfile(userId, token, profile) {
  if (!userId || !token) return null;

  const payload = normalizeProfile(profile);
  await axios.patch(profileUrl(userId, token), {
    ...payload,
    updatedAt: new Date().toISOString(),
  }, requestConfig(token));

  return payload;
}
