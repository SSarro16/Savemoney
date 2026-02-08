export const PRESETS = {
  DAYS_7: "DAYS_7",
  MONTH_1: "MONTH_1",
  YEAR_1: "YEAR_1",
  TOTAL: "TOTAL",
  CUSTOM: "CUSTOM",
};

export const PAYMENT_METHOD = {
  CASH: "CASH",
  CARD: "CARD",
};

export const PAYMENT_METHOD_LABEL = {
  [PAYMENT_METHOD.CASH]: "Contanti",
  [PAYMENT_METHOD.CARD]: "Carta",
};

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function getPresetRange(preset) {
  const today = endOfDay(new Date());

  if (preset === PRESETS.DAYS_7) {
    const d = new Date(today);
    d.setDate(d.getDate() - 7);
    return { from: startOfDay(d), to: today };
  }

  if (preset === PRESETS.MONTH_1) {
    const d = new Date(today);
    d.setMonth(d.getMonth() - 1);
    return { from: startOfDay(d), to: today };
  }

  if (preset === PRESETS.YEAR_1) {
    const d = new Date(today);
    d.setFullYear(d.getFullYear() - 1);
    return { from: startOfDay(d), to: today };
  }

  return { from: null, to: null };
}
