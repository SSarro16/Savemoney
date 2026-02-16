import { getCurrentIdToken } from "../services/firebase";

const DEFAULT_TIMEOUT_MS = 15000;

export class HttpError extends Error {
  constructor(message, { status = 0, code = "HTTP_ERROR", details = null } = {}) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class AuthHttpError extends HttpError {
  constructor(message, options = {}) {
    super(message, options);
    this.name = "AuthHttpError";
    this.isAuthError = true;
  }
}

function isPermissionError(status, code) {
  const normalizedCode = String(code || "").toLowerCase();
  return (
    status === 401 ||
    status === 403 ||
    normalizedCode.includes("permission") ||
    normalizedCode.includes("auth") ||
    normalizedCode.includes("unauthorized") ||
    normalizedCode.includes("forbidden")
  );
}

function resolveMessage(payload, fallbackMessage) {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload;
  }

  if (payload?.message) {
    return String(payload.message);
  }

  if (payload?.error?.message) {
    return String(payload.error.message);
  }

  return fallbackMessage;
}

async function attachAuthHeader(headers) {
  const token = await getCurrentIdToken();
  if (!token) {
    throw new AuthHttpError("Authenticated session required.", {
      status: 401,
      code: "AUTH_SESSION_MISSING",
    });
  }

  headers.Authorization = `Bearer ${token}`;
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await response.json();
  }

  const text = await response.text();
  return text || null;
}

export async function request(url, {
  method = "GET",
  body,
  headers = {},
  authRequired = true,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  const requestHeaders = {
    Accept: "application/json",
    ...headers,
  };

  if (body !== undefined && !requestHeaders["Content-Type"]) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (authRequired) {
    await attachAuthHeader(requestHeaders);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      body:
        body === undefined || body === null || typeof body === "string"
          ? body
          : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeout);

    if (error?.name === "AbortError") {
      throw new HttpError("Request timeout", { code: "REQUEST_TIMEOUT" });
    }

    throw new HttpError(error?.message || "Network request failed", {
      code: "NETWORK_ERROR",
    });
  }

  clearTimeout(timeout);

  const payload = await parseResponse(response);

  if (!response.ok) {
    const code = payload?.code || payload?.error?.code || `HTTP_${response.status}`;
    const message = resolveMessage(payload, "Request failed");

    if (isPermissionError(response.status, code)) {
      throw new AuthHttpError(message, {
        status: response.status,
        code,
        details: payload,
      });
    }

    throw new HttpError(message, {
      status: response.status,
      code,
      details: payload,
    });
  }

  return payload;
}

export function get(url, options = {}) {
  return request(url, { ...options, method: "GET" });
}

export function post(url, body, options = {}) {
  return request(url, { ...options, method: "POST", body });
}

export function patch(url, body, options = {}) {
  return request(url, { ...options, method: "PATCH", body });
}

export function del(url, options = {}) {
  return request(url, { ...options, method: "DELETE" });
}

export function isAuthFailure(error) {
  return error instanceof AuthHttpError || error?.isAuthError === true;
}
