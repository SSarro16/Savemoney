module.exports = function (api) {
  api.cache(true);

  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "transform-inline-environment-variables",
        {
          include: ["TAMAGUI_TARGET"],
        },
      ],
      [
        "@tamagui/babel-plugin",
        {
          components: ["@tamagui/core"],
          config: "./tamagui.config.js",
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
