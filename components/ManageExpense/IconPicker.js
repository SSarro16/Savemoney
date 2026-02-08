// components/ManageExpense/IconPicker.js
import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlobalStyles } from "../../constants/styles";
import { EXPENSE_ICONS } from "../../constants/expense-icons";

export default function IconPicker({
  value,
  onChange,
  title = "Scegli un'icona",
}) {
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);

  const [open, setOpen] = useState(false);

  const items = useMemo(() => Array.from(new Set(EXPENSE_ICONS || [])), []);
  const selected = value || "pricetag-outline";

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <View style={styles.triggerLeft}>
          <View style={styles.preview}>
            <Ionicons name={selected} size={18} color={colors.textTitle} />
          </View>
          <Text style={styles.triggerText}>Icona</Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.white55} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.grid}>
                {items.map((it) => {
                  const active = it === selected;

                  return (
                    <Pressable
                      key={it}
                      onPress={() => {
                        onChange?.(it);
                        setOpen(false);
                      }}
                      style={[styles.cell, active && styles.cellActive]}
                    >
                      <Ionicons name={it} size={22} color={colors.textTitle} />
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <Pressable style={styles.closeBtn} onPress={() => setOpen(false)}>
              <Text style={styles.closeText}>Chiudi</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    trigger: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: colors.white06,
      borderWidth: 1,
      borderColor: colors.white10,
    },
    triggerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    preview: {
      width: 34,
      height: 34,
      borderRadius: 14,
      backgroundColor: colors.white08,
      borderWidth: 1,
      borderColor: colors.white10,
      alignItems: "center",
      justifyContent: "center",
    },
    triggerText: {
      color: colors.textBody,
      fontWeight: "900",
    },

    backdrop: {
      flex: 1,
      backgroundColor: colors.overlay60,
      padding: 16,
      justifyContent: "center",
    },
    card: {
      backgroundColor: colors.primary800,
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.white10,
      maxHeight: "80%",
    },
    title: {
      color: colors.textTitle,
      fontWeight: "900",
      fontSize: 16,
      textAlign: "center",
      marginBottom: 12,
    },

    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      justifyContent: "center",
      paddingBottom: 10,
    },
    cell: {
      width: 46,
      height: 46,
      borderRadius: 16,
      backgroundColor: colors.white06,
      borderWidth: 1,
      borderColor: colors.white10,
      alignItems: "center",
      justifyContent: "center",
    },
    cellActive: {
      backgroundColor: colors.accent18,
      borderColor: colors.accent35,
    },

    closeBtn: {
      marginTop: 12,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: colors.primary700,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.white10,
    },
    closeText: {
      color: colors.textTitle,
      fontWeight: "900",
    },
  });
}
