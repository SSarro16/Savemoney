import * as Sentry from "@sentry/react-native";
import { SENTRY_DSN } from "./env";

let initialized = false;

function getEnvironment() {
  return __DEV__ ? "development" : "production";
}

export function initMonitoring() {
  if (initialized) return;
  initialized = true;

  if (!SENTRY_DSN) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: getEnvironment(),
    tracesSampleRate: __DEV__ ? 1 : 0.2,
  });
}

export function captureException(error, context = {}) {
  if (!error || !SENTRY_DSN) return;

  Sentry.withScope((scope) => {
    Object.entries(context || {}).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });
    Sentry.captureException(error);
  });
}

export function captureMessage(message, level = "info", context = {}) {
  if (!message || !SENTRY_DSN) return;

  Sentry.withScope((scope) => {
    scope.setLevel(level);
    Object.entries(context || {}).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });
    Sentry.captureMessage(String(message));
  });
}
