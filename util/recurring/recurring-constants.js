// util/recurring/recurring-constants.js

// Manteniamo i tuoi export esistenti…
export const RECURRING_KIND = {
  HABIT: "HABIT",
  SUBSCRIPTION: "SUBSCRIPTION",
};

export const RECURRING_FREQ = {
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
  YEARLY: "YEARLY",
};

// ✅ Alias “compatibilità” (così Cadence.DAILY e RecurringType.SUBSCRIPTION non esplodono)
export const RecurringType = RECURRING_KIND;
export const Cadence = RECURRING_FREQ;
