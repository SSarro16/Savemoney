import {
  deleteExpense,
  fetchExpenses,
  patchExpense,
  storeExpense,
  updateExpense,
  upsertExpenseById,
} from "../http";

export function loadExpenses(userId, withAuthRetry) {
  return withAuthRetry((token) => fetchExpenses(userId, token));
}

export function createExpense(userId, withAuthRetry, expenseData) {
  return withAuthRetry((token) => storeExpense(userId, token, expenseData));
}

export function replaceExpense(userId, withAuthRetry, id, expenseData) {
  return withAuthRetry((token) => updateExpense(userId, token, id, expenseData));
}

export function patchStoredExpense(userId, withAuthRetry, id, partial) {
  return withAuthRetry((token) => patchExpense(userId, token, id, partial));
}

export function removeExpense(userId, withAuthRetry, id) {
  return withAuthRetry((token) => deleteExpense(userId, token, id));
}

export function restoreExpense(userId, withAuthRetry, id, expenseData) {
  return withAuthRetry((token) =>
    upsertExpenseById(userId, token, id, expenseData),
  );
}
