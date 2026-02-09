import { captureException, captureMessage } from "./monitoring";

function devConsole(method, ...args) {
  if (!__DEV__) return;
  if (typeof console?.[method] !== "function") return;
  console[method](...args);
}

function normalizeMeta(meta) {
  if (!meta) return undefined;
  if (meta instanceof Error) return { message: meta.message, stack: meta.stack };
  return meta;
}

export const logger = {
  debug(message, meta) {
    devConsole("log", `[DEBUG] ${message}`, meta ?? "");
  },

  info(message, meta) {
    devConsole("log", `[INFO] ${message}`, meta ?? "");
  },

  warn(message, meta) {
    const cleanMeta = normalizeMeta(meta);
    devConsole("warn", `[WARN] ${message}`, cleanMeta ?? "");
    captureMessage(message, "warning", cleanMeta ? { meta: cleanMeta } : {});
  },

  error(message, errorOrMeta, maybeMeta) {
    const err = errorOrMeta instanceof Error ? errorOrMeta : null;
    const meta = err ? maybeMeta : errorOrMeta;
    const cleanMeta = normalizeMeta(meta);

    devConsole("error", `[ERROR] ${message}`, err || cleanMeta || "");

    if (err) {
      captureException(err, cleanMeta ? { meta: cleanMeta } : {});
      return;
    }

    captureMessage(message, "error", cleanMeta ? { meta: cleanMeta } : {});
  },
};
