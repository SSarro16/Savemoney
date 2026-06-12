import {
  createBudget,
  getActiveBudgetId,
  getBudgetById,
  getBudgets,
  setActiveBudgetId,
  upsertBudget,
} from "./budget-storage";

export function loadBudgets(userId, withAuthRetry) {
  return withAuthRetry((token) => getBudgets(userId, token));
}

export function loadBudgetById(userId, withAuthRetry, budgetId) {
  return withAuthRetry((token) => getBudgetById(userId, token, budgetId));
}

export function loadActiveBudgetId(userId) {
  return getActiveBudgetId(userId);
}

export function saveActiveBudgetId(budgetId, userId) {
  return setActiveBudgetId(budgetId, userId);
}

export function createStoredBudget(userId, withAuthRetry, name) {
  return withAuthRetry((token) => createBudget({ name, userId, token }));
}

export function saveStoredBudget(userId, withAuthRetry, budget) {
  return withAuthRetry((token) => upsertBudget(userId, token, budget));
}
