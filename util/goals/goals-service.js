import { fetchGoals, removeGoal, upsertGoal } from "../goals-storage";

export function loadGoals(userId, withAuthRetry) {
  return withAuthRetry((token) => fetchGoals(userId, token));
}

export function saveStoredGoal(userId, withAuthRetry, goal) {
  return withAuthRetry((token) => upsertGoal(userId, token, goal));
}

export function deleteStoredGoal(userId, withAuthRetry, goalId) {
  return withAuthRetry((token) => removeGoal(userId, token, goalId));
}
