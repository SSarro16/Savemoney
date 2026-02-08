import React, { useCallback, useRef } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { GlobalStyles } from "../../constants/styles";
import RecurringItem from "./RecurringItem";
import {
  RecurringType,
  isDueTodayOrPast,
} from "../../util/recurring/recurring-utils";

export default function RecurringList({
  items,
  onEdit,
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
  const openSwipeRef = useRef(null);

  const closeOpenSwipe = useCallback(() => {
    if (openSwipeRef.current) {
      openSwipeRef.current.close?.();
      openSwipeRef.current = null;
    }
  }, []);

  const renderLeftActions = useCallback(
    (item) => (
      <Pressable
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          closeOpenSwipe();
          onEdit?.(item);
        }}
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
        <Text style={styles.actionText}>Modifica</Text>
      </Pressable>
    ),
    [closeOpenSwipe, onEdit],
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
        style={({ pressed }) => [
          styles.action,
          { backgroundColor: colors.danger20, borderColor: colors.danger30 },
          pressed && { opacity: 0.9 },
        ]}
      >
        <Ionicons name="trash-outline" size={18} color={colors.textTitle} />
        <Text style={styles.actionText}>Elimina</Text>
      </Pressable>
    ),
    [closeOpenSwipe, onDelete],
  );

  const renderItem = ({ item }) => {
    const isSub = item.type === RecurringType.SUBSCRIPTION;
    const isDue = isSub && isDueTodayOrPast(item.nextDue);

    return (
      <Swipeable
        ref={(ref) => {
          item.__swipeRef = ref;
        }}
        renderLeftActions={() => renderLeftActions(item)}
        renderRightActions={() => renderRightActions(item)}
        overshootLeft={false}
        overshootRight={false}
        onSwipeableWillOpen={() => {
          if (
            openSwipeRef.current &&
            openSwipeRef.current !== item.__swipeRef
          ) {
            openSwipeRef.current.close?.();
          }
          openSwipeRef.current = item.__swipeRef;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => {},
          );
        }}
        onSwipeableWillClose={() => {
          if (openSwipeRef.current === item.__swipeRef)
            openSwipeRef.current = null;
        }}
      >
        <RecurringItem
          item={item}
          isDue={isDue}
          onPress={() => onEdit?.(item)}
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
    marginVertical: 8,
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
