import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

const ALERT_KEY_PREFIX = "budget_alert_sent_v1";

function monthKeyFromDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function buildAlertKey({ userId, budgetId, monthKey, threshold }) {
  return `${ALERT_KEY_PREFIX}_${String(userId || "anon")}_${String(
    budgetId || "none",
  )}_${monthKey}_${threshold}`;
}

function getCurrentMonthSpent(expenses, budgetId) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const targetBudgetId = String(budgetId || "");

  return (Array.isArray(expenses) ? expenses : []).reduce((sum, expense) => {
    const date = expense?.date instanceof Date ? expense.date : new Date(expense?.date);
    if (!date || Number.isNaN(date.getTime())) return sum;
    if (date.getMonth() !== currentMonth || date.getFullYear() !== currentYear) return sum;

    const expenseBudgetId = String(expense?.budgetId || "");
    if (targetBudgetId && expenseBudgetId && expenseBudgetId !== targetBudgetId) {
      return sum;
    }

    return sum + Number(expense?.amount || 0);
  }, 0);
}

async function ensurePermissions() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return (
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function maybeSendBudgetThresholdAlerts({
  expenses,
  budgetTotal,
  budgetId,
  userId,
  enabled,
  notifyAt80,
  notifyAt100,
}) {
  if (!enabled) return;

  const total = Number(budgetTotal || 0);
  if (!Number.isFinite(total) || total <= 0) return;

  const spent = getCurrentMonthSpent(expenses, budgetId);
  const ratio = total > 0 ? spent / total : 0;
  const monthKey = monthKeyFromDate();

  const thresholds = [];
  if (notifyAt80) thresholds.push(0.8);
  if (notifyAt100) thresholds.push(1);
  if (!thresholds.length) return;

  const hasPermission = await ensurePermissions();
  if (!hasPermission) return;

  for (const threshold of thresholds) {
    if (ratio < threshold) continue;

    const key = buildAlertKey({
      userId,
      budgetId,
      monthKey,
      threshold,
    });
    const alreadySent = await AsyncStorage.getItem(key);
    if (alreadySent === "1") continue;

    const pct = Math.round(threshold * 100);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Allerta budget",
        body: `Hai raggiunto il ${pct}% del budget mensile.`,
        sound: false,
        data: {
          kind: "budget_threshold_alert",
          threshold: pct,
        },
      },
      trigger: null,
    });

    await AsyncStorage.setItem(key, "1");
  }
}
