const { defaultConfig } = require("@tamagui/config/v4");
const { createTamagui } = require("@tamagui/core");

const tamaguiConfig = createTamagui(defaultConfig);

module.exports = tamaguiConfig;
