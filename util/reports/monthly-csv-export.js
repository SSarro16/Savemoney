import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

function csvEscape(value) {
  const raw = String(value ?? "");
  const escaped = raw.replace(/"/g, '""');
  return `"${escaped}"`;
}

function formatDateISO(dateLike) {
  const date = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function methodLabel(expense) {
  return expense?.methodType === "CARD" || expense?.payMethod === "CARD"
    ? "CARD"
    : "CASH";
}

function currentMonthKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

export function buildCurrentMonthCsv(expenses) {
  const monthKey = currentMonthKey();
  const list = Array.isArray(expenses) ? expenses : [];

  const monthly = list.filter((expense) => {
    const iso = formatDateISO(expense?.date);
    return iso.startsWith(monthKey);
  });

  const lines = [
    [
      "date",
      "description",
      "category",
      "method",
      "amount",
      "budget_id",
    ].join(","),
  ];

  monthly.forEach((expense) => {
    lines.push(
      [
        csvEscape(formatDateISO(expense?.date)),
        csvEscape(expense?.description || ""),
        csvEscape(expense?.category || ""),
        csvEscape(methodLabel(expense)),
        csvEscape(Number(expense?.amount || 0).toFixed(2)),
        csvEscape(expense?.budgetId || ""),
      ].join(","),
    );
  });

  return {
    csv: lines.join("\n"),
    monthKey,
    count: monthly.length,
    total: monthly.reduce((sum, item) => sum + Number(item?.amount || 0), 0),
  };
}

export async function exportCurrentMonthCsv(expenses) {
  const { csv, monthKey, count, total } = buildCurrentMonthCsv(expenses);
  const fileName = `savemoney-report-${monthKey}.csv`;
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    return { fileUri, fileName, count, total, shared: false };
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: "text/csv",
    dialogTitle: `Report ${monthKey}`,
    UTI: "public.comma-separated-values-text",
  });

  return { fileUri, fileName, count, total, shared: true };
}
