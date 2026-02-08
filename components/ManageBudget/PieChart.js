import React from "react";
import { View } from "react-native";
import Svg, { G, Path, Circle } from "react-native-svg";
import { GlobalStyles } from "../../constants/styles";

function polarToCartesian(cx, cy, r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function describeArc(x, y, r, startAngle, endAngle) {
  const start = polarToCartesian(x, y, r, endAngle);
  const end = polarToCartesian(x, y, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} L ${x} ${y} Z`;
}

export default function PieChart({
  data = [],
  colorsPie = [],
  size = 210,
  strokeWidth = 10,
}) {
  const colors = GlobalStyles.colors;

  const radius = size / 2;
  const innerRadius = radius - strokeWidth;

  const values = (data || []).map((v) => Math.max(0, Number(v || 0)));
  const sum = values.reduce((s, v) => s + v, 0);

  if (!sum) {
    return (
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Svg width={size} height={size}>
          <Circle
            cx={radius}
            cy={radius}
            r={innerRadius}
            fill="transparent"
            stroke={colors.border}
            strokeWidth={strokeWidth}
          />
        </Svg>
      </View>
    );
  }

  let startAngle = 0;
  const slices = values.map((v, i) => {
    const angle = (v / sum) * 360;
    const endAngle = startAngle + angle;
    const path = describeArc(radius, radius, innerRadius, startAngle, endAngle);
    const fill = colorsPie[i % colorsPie.length] || colors.accent500;
    startAngle = endAngle;
    return { path, fill, key: `slice-${i}` };
  });

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <G>
          {slices.map((s) => (
            <Path key={s.key} d={s.path} fill={s.fill} />
          ))}
          <Circle
            cx={radius}
            cy={radius}
            r={innerRadius - 12}
            fill={colors.bg}
          />
        </G>
      </Svg>
    </View>
  );
}
