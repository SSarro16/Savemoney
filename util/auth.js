import axios from "axios";
import { FIREBASE_WEB_API_KEY } from "./env";
import { logger } from "./logger";
import {
  getCurrentLanguage,
  translateWithLanguage,
} from "../store/language-context";

const AUTH_TIMEOUT_MS = 15000;

const SIGNUP_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_WEB_API_KEY}`;
const LOGIN_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_WEB_API_KEY}`;
const LEGACY_SIGNUP_URL = `https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key=${FIREBASE_WEB_API_KEY}`;
const LEGACY_LOGIN_URL = `https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=${FIREBASE_WEB_API_KEY}`;

function tt(key, params) {
  return translateWithLanguage(getCurrentLanguage(), key, params);
}

function mapFirebaseAuthError(code) {
  if (code === "EMAIL_NOT_FOUND") return tt("authErrors.emailNotFound");
  if (code === "INVALID_PASSWORD") return tt("authErrors.invalidPassword");
  if (code === "USER_DISABLED") return tt("authErrors.userDisabled");
  if (code === "EMAIL_EXISTS") return tt("authErrors.emailExists");
  if (code === "OPERATION_NOT_ALLOWED") return tt("authErrors.operationNotAllowed");
  if (code === "API_KEY_INVALID" || code === "INVALID_API_KEY") {
    return tt("authErrors.invalidApiKey");
  }
  if (code === "PROJECT_NUMBER_MISMATCH") {
    return tt("authErrors.projectMismatch");
  }
  if (code === "CONFIGURATION_NOT_FOUND") {
    return tt("authErrors.configurationNotFound");
  }
  if (code === "TOO_MANY_ATTEMPTS_TRY_LATER") {
    return tt("authErrors.tooManyAttempts");
  }
  if (code === "INVALID_EMAIL") return tt("authErrors.invalidEmail");
  if (code?.startsWith("WEAK_PASSWORD")) {
    return tt("authErrors.weakPassword");
  }
  if (code === "MISSING_EMAIL") return tt("authErrors.missingEmail");
  if (code === "MISSING_PASSWORD") return tt("authErrors.missingPassword");
  if (code === "INVALID_LOGIN_CREDENTIALS") return tt("authErrors.invalidCredentials");
  return tt("authErrors.authFailed");
}

function shouldTryLegacyAuth(status, code) {
  if (status === 401 || status === 403 || status === 404) return true;
  if (
    code === "CONFIGURATION_NOT_FOUND" ||
    code === "PROJECT_NUMBER_MISMATCH" ||
    code === "INVALID_API_KEY"
  ) {
    return true;
  }
  return false;
}

function mapAuthResponse(data) {
  const expiresIn = Number(data?.expiresIn || data?.expires_in || 0);
  const expiryDate = Date.now() + expiresIn * 1000;
  return {
    token: data?.idToken || data?.id_token,
    userId: data?.localId || data?.user_id,
    refreshToken: data?.refreshToken || data?.refresh_token,
    expiryDate,
  };
}

async function authenticate(url, fallbackUrl, email, password) {
  if (!FIREBASE_WEB_API_KEY) {
    throw new Error(tt("authErrors.missingFirebaseApiKey"));
  }

  try {
    const payload = { email, password, returnSecureToken: true };
    const res = await axios.post(url, payload, { timeout: AUTH_TIMEOUT_MS });
    return mapAuthResponse(res.data);
  } catch (err) {
    const code = err?.response?.data?.error?.message;
    const status = Number(err?.response?.status || 0);
    if (fallbackUrl && shouldTryLegacyAuth(status, code)) {
      try {
        const payload = { email, password, returnSecureToken: true };
        const legacy = await axios.post(fallbackUrl, payload, {
          timeout: AUTH_TIMEOUT_MS,
        });
        return mapAuthResponse(legacy.data);
      } catch (legacyErr) {
        const legacyCode = legacyErr?.response?.data?.error?.message;
        throw new Error(mapFirebaseAuthError(legacyCode));
      }
    }
    if (!code && (status === 401 || status === 403)) {
      throw new Error(tt("authErrors.unauthorizedAuthRequest"));
    }
    logger.warn("AUTH ERROR", code || err.message);
    throw new Error(mapFirebaseAuthError(code));
  }
}

export function createUser(email, password) {
  return authenticate(SIGNUP_URL, LEGACY_SIGNUP_URL, email, password);
}

export function login(email, password) {
  return authenticate(LOGIN_URL, LEGACY_LOGIN_URL, email, password);
}

export async function refreshIdToken(refreshToken) {
  if (!FIREBASE_WEB_API_KEY) {
    throw new Error(tt("authErrors.missingFirebaseApiKey"));
  }

  const res = await axios.post(
    `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_WEB_API_KEY}`,
    `grant_type=refresh_token&refresh_token=${refreshToken}`,
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: AUTH_TIMEOUT_MS,
    },
  );

  const expiresIn = Number(res.data.expires_in || 0);
  const expiryDate = Date.now() + expiresIn * 1000;

  return {
    token: res.data.id_token,
    userId: res.data.user_id,
    refreshToken: res.data.refresh_token,
    expiryDate,
  };
}
