function readEnv(name) {
  return String(process.env?.[name] || "").trim();
}

function buildSentryPluginConfig() {
  const organization = readEnv("SENTRY_ORG");
  const project = readEnv("SENTRY_PROJECT");
  const authToken = readEnv("SENTRY_AUTH_TOKEN");
  const url = readEnv("SENTRY_URL") || "https://sentry.io/";

  const shouldEnforceSentryEnv =
    readEnv("SENTRY_REQUIRE_CONFIG") === "1" ||
    readEnv("CI") === "true" ||
    readEnv("EAS_BUILD") === "true";

  if (shouldEnforceSentryEnv) {
    const missing = [];
    if (!organization) missing.push("SENTRY_ORG");
    if (!project) missing.push("SENTRY_PROJECT");
    if (!authToken) missing.push("SENTRY_AUTH_TOKEN");
    if (missing.length > 0) {
      throw new Error(
        `[env] Missing required Sentry vars for build: ${missing.join(", ")}.`,
      );
    }
  }

  return {
    organization,
    project,
    url,
  };
}

module.exports = ({ config }) => {
  const base = config || {};
  const sourcePlugins = Array.isArray(base.plugins) ? base.plugins : [];

  const plugins = sourcePlugins.filter((entry) => {
    const name = Array.isArray(entry) ? entry[0] : entry;
    return name !== "@sentry/react-native" && name !== "@sentry/react-native/expo";
  });

  plugins.push(["@sentry/react-native/expo", buildSentryPluginConfig()]);

  return {
    ...base,
    plugins,
  };
};
