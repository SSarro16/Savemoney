import { Pressable, StyleSheet, Text, View } from "react-native";

import { GlobalStyles } from "../../constants/styles";

const OPTIONS = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

export default function ViewToggle({ value, onChange }) {
  const colors = GlobalStyles.colors;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.white10 }]}>
      {OPTIONS.map((option) => {
        const selected = value === option.key;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            style={({ pressed }) => [
              styles.option,
              selected && { backgroundColor: colors.accent500, borderColor: colors.accent30 },
              !selected && { borderColor: colors.white10 },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.optionLabel,
                { color: selected ? colors.textOnAccentStrong : colors.textBody },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    flexDirection: "row",
    gap: 6,
  },
  option: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
    borderWidth: 1,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.82,
  },
});
