import { Image, StyleSheet, View } from "react-native";
import { GlobalStyles } from "../../constants/styles";

const SOURCE = require("../../assets/icon.png");
const DEFAULT_CROP = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}

export default function AppLogo({
  size = 40,
  borderRadius,
  crop = DEFAULT_CROP,
  style,
  imageStyle,
  borderWidth = 1,
  borderColor,
  backgroundColor,
}) {
  const colors = GlobalStyles.colors;
  const safeSize = Math.max(18, Number(size) || 40);
  const radius = borderRadius ?? Math.round(safeSize * 0.34);

  const left = clamp(crop?.left, 0, 0.25);
  const right = clamp(crop?.right, 0, 0.25);
  const top = clamp(crop?.top, 0, 0.25);
  const bottom = clamp(crop?.bottom, 0, 0.25);

  const widthScale = 1 + left + right;
  const heightScale = 1 + top + bottom;
  const translateX = ((right - left) * safeSize) / 2;
  const translateY = ((bottom - top) * safeSize) / 2;

  return (
    <View
      style={[
        styles.container,
        {
          width: safeSize,
          height: safeSize,
          borderRadius: radius,
          borderWidth,
          borderColor: borderColor || colors.white12,
          backgroundColor: backgroundColor || colors.surface2,
        },
        style,
      ]}
    >
      <Image
        source={SOURCE}
        resizeMode="cover"
        style={[
          {
            width: safeSize * widthScale,
            height: safeSize * heightScale,
            transform: [{ translateX }, { translateY }],
          },
          imageStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
});
