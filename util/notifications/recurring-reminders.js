import * as Notifications from "expo-notifications";
import { advanceToFuture } from "../recurring/recurring-utils";
import { canUseLocalNotifications } from "./runtime";

const REMINDER_KIND = "recurring_reminder";

function normalizeHour(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 9;
  return Math.min(23, Math.max(0, Math.round(n)));
}

function buildReminderDate(nextDueLike, cadence, reminderHour) {
  const nextDue = advanceToFuture(nextDueLike, cadence, new Date());
  const trigger = new Date(nextDue);
  trigger.setHours(reminderHour, 0, 0, 0);

  if (trigger.getTime() <= Date.now()) {
    trigger.setMinutes(trigger.getMinutes() + 2);
  }

  return trigger;
}

function isManagedReminder(notification) {
  return notification?.content?.data?.kind === REMINDER_KIND;
}

async function clearManagedReminders() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter(isManagedReminder)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

async function ensurePermissions() {
  if (!canUseLocalNotifications()) return false;

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

export async function syncRecurringReminderNotifications(items, options = {}) {
  if (!canUseLocalNotifications()) return 0;

  const enabled = options?.enabled !== false;
  const reminderHour = normalizeHour(options?.hour);

  await clearManagedReminders();
  if (!enabled) return 0;

  const hasPermission = await ensurePermissions();
  if (!hasPermission) return 0;

  const list = Array.isArray(items) ? items : [];
  const validItems = list.filter((item) => item?.id && item?.title && item?.nextDue);

  await Promise.all(
    validItems.map((item) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: "Promemoria ricorrenza",
          body: `${String(item.title)} in scadenza`,
          sound: false,
          data: {
            kind: REMINDER_KIND,
            recurringId: String(item.id),
          },
        },
        trigger: buildReminderDate(item.nextDue, item.cadence, reminderHour),
      }),
    ),
  );

  return validItems.length;
}
