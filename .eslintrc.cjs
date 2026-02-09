module.exports = {
  root: true,
  extends: ["expo", "prettier"],
  env: {
    jest: true,
    node: true,
    browser: true,
  },
  globals: {
    clearInterval: "readonly",
    clearTimeout: "readonly",
    setInterval: "readonly",
    setTimeout: "readonly",
  },
  ignorePatterns: ["dist/", "dist-validation-android-final2/", "dist-validation-web-uxpass/"],
};
