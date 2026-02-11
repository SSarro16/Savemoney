function includesAny(text, patterns) {
  const source = String(text || "").toLowerCase();
  return patterns.some((pattern) => source.includes(pattern));
}

export function toUiErrorMessage(error, fallback, t) {
  const status = Number(error?.response?.status || 0);
  const code = String(error?.code || "").toLowerCase();
  const rawError = error?.response?.data?.error;
  const raw =
    typeof rawError === "string"
      ? rawError.toLowerCase()
      : String(rawError?.message || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();

  if (includesAny(raw, ["permission_denied", "permission denied", "access denied"])) {
    return t("payments.permissionDenied");
  }

  if (
    includesAny(raw, [
      "token expired",
      "id token expired",
      "invalid id token",
      "invalid token",
    ])
  ) {
    return t("payments.sessionExpired");
  }

  if (status === 401 || status === 403) {
    return t("payments.unauthorized");
  }

  if (
    includesAny(code, ["err_network", "enotfound", "eai_again"]) ||
    includesAny(message, ["network", "internet", "offline", "failed to fetch"])
  ) {
    return t("common.networkUnavailable");
  }

  if (
    includesAny(code, ["econnaborted", "etimedout"]) ||
    includesAny(message, ["timeout", "timed out"])
  ) {
    return t("common.requestTimeout");
  }

  return fallback;
}
