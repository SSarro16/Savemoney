import React, { useCallback, useRef } from "react";
import { FlatList, Pressable, StyleSheet, Text } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { GlobalStyles } from "../../constants/styles";
import { useTranslation } from "../../store/language-context";
import RecurringItem from "./RecurringItem";
import {
  RecurringType,
  isDueTodayOrPast,
} from "../../util/recurring/recurring-utils";

export default function RecurringList({
  items,
  onEdit,
  onOpenDetail,
  onDelete,
  onQuickAdd,
  onQuickPay,
  ListHeaderComponent,
  ListFooterComponent,
  contentContainerStyle,
  onRefresh,
  refreshing,
}) {
  const colors = GlobalStyles.colors;
  const styles = makeStyles(colors);
  const swipeRefs = useRef({});
  const openSwipeIdRef = useRef(null);
  const { t } = useTranslation();

  const closeOpenSwipe = useCallback(() => {
    const openId = String(openSwipeIdRef.current || "");
    if (!openId) return;
    swipeRefs.current[openId]?.close?.();
    openSwipeIdRef.current = null;
  }, []);

  const renderLeftActions = useCallback(
    (item) => (
      <Pressable
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          closeOpenSwipe();
          onEdit?.(item);
        }}
        accessibilityRole="button"
        accessibilityLabel={t("recurring.editAction")}
        style={({ pressed }) => [
          styles.action,
          {
            backgroundColor: colors.accent18,
            borderColor: colors.accent35,
          },
          pressed && { opacity: 0.9 },
        ]}
      >
        <Ionicons name="create-outline" size={18} color={colors.textTitle} />
        <Text style={styles.actionText}>{t("recurring.editAction")}</Text>
      </Pressable>
    ),
    [closeOpenSwipe, onEdit, styles.action, styles.actionText, colors, t],
  );

  const renderRightActions = useCallback(
    (item) => (
      <Pressable
        onPress={() => {
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning,
          ).catch(() => {});
          closeOpenSwipe();
          onDelete?.(item);
        }}
        accessibilityRole="button"
        accessibilityLabel={t("common.delete")}
        style={({ pressed }) => [
          styles.action,
          { backgroundColor: colors.danger20, borderColor: colors.danger30 },
          pressed && { opacity: 0.9 },
        ]}
      >
        <Ionicons name="trash-outline" size={18} color={colors.textTitle} />
        <Text style={styles.actionText}>{t("recurring.deleteAction")}</Text>
      </Pressable>
    ),
    [closeOpenSwipe, onDelete, styles.action, styles.actionText, colors, t],
  );

  const renderItem = ({ item }) => {
    const isSub = item.type === RecurringType.SUBSCRIPTION;
    const isDue = isSub && isDueTodayOrPast(item.nextDue);
    const itemId = String(item?.id || "");

    return (
      <Swipeable
        ref={(ref) => {
          if (!itemId) return;
          if (ref) {
            swipeRefs.current[itemId] = ref;
            return;
          }
          delete swipeRefs.current[itemId];
        }}
        renderLeftActions={() => renderLeftActions(item)}
        renderRightActions={() => renderRightActions(item)}
        overshootLeft={false}
        overshootRight={false}
        onSwipeableWillOpen={() => {
          const openId = String(openSwipeIdRef.current || "");
          if (openId && openId !== itemId) {
            swipeRefs.current[openId]?.close?.();
          }
          openSwipeIdRef.current = itemId || null;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => {},
          );
        }}
        onSwipeableWillClose={() => {
          if (String(openSwipeIdRef.current || "") === itemId) {
            openSwipeIdRef.current = null;
          }
        }}
      >
        <RecurringItem
          item={item}
          isDue={isDue}
          onPress={() => {
            if (onOpenDetail) {
              onOpenDetail(item);
              return;
            }
            onEdit?.(item);
          }}
          onQuickAction={() => {
            if (isSub) onQuickPay?.(item);
            else onQuickAdd?.(item);
          }}
        />
      </Swipeable>
    );
  };

  return (
    <FlatList
      data={items || []}
      renderItem={renderItem}
      keyExtractor={(it) => String(it.id)}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      onRefresh={onRefresh}
      refreshing={refreshing}
      contentContainerStyle={[
        { paddingTop: 4, paddingBottom: 14 },
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={false}
    />
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    action: {
      width: 120,
      marginVertical: 5,
      marginHorizontal: 10,
      borderRadius: 16,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    actionText: { color: colors.textTitle, fontWeight: "900", fontSize: 12 },
  });
}
