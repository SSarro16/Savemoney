import React, { useContext, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { GlobalStyles } from "../../constants/styles";
import { useThemeRefresh } from "../../store/theme-context";
import { ExpenseCategoriesContext } from "../../store/expense-categories-context";
import { useTranslation } from "../../store/language-context";

export default function CategoriesManagerScreen() {
  useThemeRefresh();
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);
  const { t } = useTranslation();
  const categoriesCtx = useContext(ExpenseCategoriesContext);

  const [newCategory, setNewCategory] = useState("");
  const [editingName, setEditingName] = useState("");
  const [editingValue, setEditingValue] = useState("");

  const categories = useMemo(
    () => (Array.isArray(categoriesCtx.categories) ? categoriesCtx.categories : []),
    [categoriesCtx.categories],
  );

  const addCategory = async () => {
    const added = await categoriesCtx.addCategory?.(newCategory);
    if (!added) {
      Alert.alert(
        t("categories.invalidTitle"),
        t("categories.invalidMessage"),
      );
      return;
    }
    setNewCategory("");
  };

  const startEdit = (name) => {
    setEditingName(String(name || ""));
    setEditingValue(String(name || ""));
  };

  const cancelEdit = () => {
    setEditingName("");
    setEditingValue("");
  };

  const saveEdit = async () => {
    const ok = await categoriesCtx.updateCategory?.(editingName, editingValue);
    if (!ok) {
      Alert.alert(
        t("categories.editFailedTitle"),
        t("categories.editFailedMessage"),
      );
      return;
    }
    cancelEdit();
  };

  const removeCategory = (name) => {
    Alert.alert(t("categories.deleteTitle"), t("categories.deleteMessage", { name }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          const ok = await categoriesCtx.removeCategory?.(name);
          if (!ok) {
            Alert.alert(
              t("categories.deleteUnavailableTitle"),
              t("categories.deleteUnavailableMessage"),
            );
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <View style={[styles.heroBlob, styles.heroBlobTop]} />
        <View style={[styles.heroBlob, styles.heroBlobBottom]} />
        <View style={styles.heroIcon}>
          <Ionicons name="pricetags-outline" size={18} color={colors.textTitle} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>{t("categories.heroTitle")}</Text>
          <Text style={styles.heroSub}>
            {t("categories.heroSubtitle")}
          </Text>
        </View>
        <View style={styles.heroPill}>
          <Text style={styles.heroPillText}>
            {t("categories.count", { count: categories.length })}
          </Text>
        </View>
      </View>

      <View style={styles.editorCard}>
        <View style={[styles.editorBlob, styles.editorBlobTop]} />
        <View style={[styles.editorBlob, styles.editorBlobBottom]} />
        <Text style={styles.label}>{t("categories.newCategory")}</Text>
        <View style={styles.fieldRow}>
          <TextInput
            style={styles.input}
            value={newCategory}
            onChangeText={setNewCategory}
            placeholder={t("categories.placeholder")}
            placeholderTextColor={colors.white45}
            returnKeyType="done"
            onSubmitEditing={addCategory}
            maxLength={24}
          />
          <Pressable
            onPress={addCategory}
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.9 }]}
          >
            <Ionicons name="add" size={18} color={colors.textOnAccentStrong} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 18, gap: 10 }}
      >
        {categories.map((cat) => {
          const isEditing = editingName === cat;
          return (
            <View key={cat} style={styles.row}>
              {!isEditing ? (
                <>
                  <Text style={styles.rowTitle}>{cat}</Text>
                  <View style={styles.rowActions}>
                    <Pressable
                      onPress={() => startEdit(cat)}
                      style={({ pressed }) => [
                        styles.iconBtn,
                        pressed && { opacity: 0.86 },
                      ]}
                    >
                      <Ionicons name="create-outline" size={18} color={colors.textTitle} />
                    </Pressable>
                    <Pressable
                      onPress={() => removeCategory(cat)}
                      style={({ pressed }) => [
                        styles.iconDanger,
                        pressed && { opacity: 0.86 },
                      ]}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.textTitle} />
                    </Pressable>
                  </View>
                </>
              ) : (
                <View style={{ flex: 1, gap: 10 }}>
                  <Text style={styles.label}>{t("categories.editCategory")}</Text>
                  <TextInput
                    style={styles.input}
                    value={editingValue}
                    onChangeText={setEditingValue}
                    placeholder={t("categories.newName")}
                    placeholderTextColor={colors.white45}
                    maxLength={24}
                    returnKeyType="done"
                    onSubmitEditing={saveEdit}
                  />
                  <View style={styles.editActions}>
                    <Pressable
                      onPress={cancelEdit}
                      style={({ pressed }) => [
                        styles.btnGhost,
                        pressed && { opacity: 0.88 },
                      ]}
                    >
                      <Text style={styles.btnGhostText}>{t("common.cancel")}</Text>
                    </Pressable>
                    <Pressable
                      onPress={saveEdit}
                      style={({ pressed }) => [
                        styles.btnPrimary,
                        pressed && { opacity: 0.88 },
                      ]}
                    >
                      <Text style={styles.btnPrimaryText}>{t("common.save")}</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.primary800, padding: 14 },
    hero: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      padding: 14,
      marginBottom: 12,
      overflow: "hidden",
    },
    heroBlob: {
      position: "absolute",
      borderRadius: 999,
      backgroundColor: colors.accent16,
      borderWidth: 1,
      borderColor: colors.accent30,
    },
    heroBlobTop: { width: 92, height: 92, right: -24, top: -24 },
    heroBlobBottom: { width: 54, height: 54, right: 30, bottom: -20 },
    heroIcon: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
    },
    heroTitle: { color: colors.textTitle, fontWeight: "900", fontSize: 16 },
    heroSub: {
      marginTop: 2,
      color: colors.textMuted,
      fontWeight: "800",
      fontSize: 12,
    },
    heroPill: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    heroPillText: { color: colors.textTitle, fontWeight: "900", fontSize: 11 },
    editorCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      padding: 12,
      marginBottom: 10,
      overflow: "hidden",
    },
    editorBlob: {
      position: "absolute",
      borderRadius: 999,
      backgroundColor: colors.accent12,
      borderWidth: 1,
      borderColor: colors.accent18,
    },
    editorBlobTop: { width: 74, height: 74, right: -22, top: -20 },
    editorBlobBottom: { width: 44, height: 44, right: 22, bottom: -22 },
    label: {
      color: colors.textMuted,
      fontWeight: "900",
      fontSize: 12,
      marginBottom: 6,
    },
    fieldRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    input: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface2,
      color: colors.textTitle,
      fontWeight: "800",
      paddingHorizontal: 12,
      paddingVertical: 11,
    },
    addBtn: {
      width: 44,
      height: 44,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.accent30,
      backgroundColor: colors.accent500,
      alignItems: "center",
      justifyContent: "center",
    },
    row: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.surface,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    rowTitle: { color: colors.textTitle, fontWeight: "900", flex: 1 },
    rowActions: { flexDirection: "row", alignItems: "center", gap: 8 },
    iconBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white08,
      alignItems: "center",
      justifyContent: "center",
    },
    iconDanger: {
      width: 38,
      height: 38,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.danger30,
      backgroundColor: colors.danger20,
      alignItems: "center",
      justifyContent: "center",
    },
    editActions: { flexDirection: "row", gap: 10 },
    btnGhost: {
      flex: 1,
      height: 42,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.white12,
      backgroundColor: colors.white06,
    },
    btnGhostText: { color: colors.textTitle, fontWeight: "900" },
    btnPrimary: {
      flex: 1,
      height: 42,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.accent30,
      backgroundColor: colors.accent500,
    },
    btnPrimaryText: { color: colors.textOnAccentStrong, fontWeight: "900" },
  });
}
