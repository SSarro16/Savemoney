import React, { useCallback, useContext, useEffect, useRef } from "react";
import { FlatList, Pressable, StyleSheet, Text, Animated } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import ExpenseItem from "./ExpenseItem";
import { GlobalStyles } from "../../constants/styles";
import { ExpensesContext } from "../../store/expenses-context";
import { CustomizationContext } from "../../store/customization-context";
import { logger } from "../../util/logger";
import { useTranslation } from "../../store/language-context";

function ExpensesList({ expenses }) {
  const expensesCtx = useContext(ExpensesContext);
  const navigation = useNavigation();
  const { compactMode, highContrast } = useContext(CustomizationContext);
  const colors = GlobalStyles.colors;
  const { t } = useTranslation();

  const openSwipeRef = useRef(null);
  const animMapRef = useRef({});

  const getAnim = (id) => {
    if (!animMapRef.current[id]) animMapRef.current[id] = new Animated.Value(1);
    return animMapRef.current[id];
  };

  useEffect(() => {
    for (const e of expenses || []) {
      const v = getAnim(e.id);
      v.stopAnimation((current) => {
        if (Number(current) < 0.99) {
          v.setValue(1);
        }
      });
    }
  }, [expenses]);

  const closeOpenSwipe = useCallback(() => {
    if (openSwipeRef.current) {
      openSwipeRef.current.close?.();
      openSwipeRef.current = null;
    }
  }, []);

  const handleEdit = useCallback(
    (id) => {
      Haptics.selectionAsync().catch(() => {});
      closeOpenSwipe();
      navigation.navigate("ManageExpenses", { expenseId: id });
    },
    [navigation, closeOpenSwipe],
  );

  const handleDelete = useCallback(
    async (id) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
        () => {},
      );
      closeOpenSwipe();

      const anim = getAnim(id);

      await new Promise((resolve) => {
        Animated.timing(anim, {
          toValue: 0,
          duration: 170,
          useNativeDriver: true,
        }).start(() => resolve());
      });

      try {
        await expensesCtx.deleteExpenseWithUndo(id);
      } catch (e) {
        Animated.timing(anim, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }).start();
        logger.warn("Swipe delete error", e);
      }
    },
    [expensesCtx, closeOpenSwipe],
  );

  const renderLeftActions = (id) => (
    <Pressable
      onPress={() => handleEdit(id)}
      style={({ pressed }) => [
        styles.action,
        {
          backgroundColor: colors.accent18,
          borderColor: colors.accent35,
          paddingVertical: compactMode ? 10 : 12,
        },
        pressed && { opacity: 0.9 },
      ]}
    >
      <Ionicons name="create-outline" size={18} color={colors.textOnAccent} />
      <Text style={[styles.actionText, { color: colors.textOnAccent }]}>
        {t("common.edit")}
      </Text>
    </Pressable>
  );

  const renderRightActions = (id) => (
    <Pressable
      onPress={() => handleDelete(id)}
      style={({ pressed }) => [
        styles.action,
        {
          backgroundColor: colors.danger20,
          borderColor: colors.danger30,
          paddingVertical: compactMode ? 10 : 12,
        },
        pressed && { opacity: 0.9 },
      ]}
    >
      <Ionicons name="trash-outline" size={18} color={colors.textOnAccent} />
      <Text style={[styles.actionText, { color: colors.textOnAccent }]}>
        {t("common.delete")}
      </Text>
    </Pressable>
  );

  const renderItem = ({ item }) => {
    const anim = getAnim(item.id);

    return (
      <Animated.View
        style={{
          opacity: anim,
          transform: [{ scaleY: anim }],
          marginVertical: 2,
        }}
      >
        <Swipeable
          ref={(ref) => {
            item.__swipeRef = ref;
          }}
          renderLeftActions={() => renderLeftActions(item.id)}
          renderRightActions={() => renderRightActions(item.id)}
          overshootLeft={false}
          overshootRight={false}
          onSwipeableWillOpen={() => {
            if (
              openSwipeRef.current &&
              openSwipeRef.current !== item.__swipeRef
            )
              openSwipeRef.current.close?.();
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
          <ExpenseItem {...item} />
        </Swipeable>
      </Animated.View>
    );
  };

  return (
    <FlatList
      data={expenses}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: 90 }}
      showsVerticalScrollIndicator={false}
      style={{
        borderTopColor: highContrast ? colors.borderStrong : "transparent",
        borderTopWidth: highContrast ? 1 : 0,
      }}
    />
  );
}

export default ExpensesList;

const styles = StyleSheet.create({
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
  actionText: { fontWeight: "900", fontSize: 12 },
});
