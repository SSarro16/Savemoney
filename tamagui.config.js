const { config } = require("@tamagui/config/v4");
const { createTamagui } = require("@tamagui/core");

const tamaguiConfig = createTamagui(config);

module.exports = tamaguiConfig;
