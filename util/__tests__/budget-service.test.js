import {
  createBudget,
  getActiveBudgetId,
  getBudgetById,
  getBudgets,
  setActiveBudgetId,
  upsertBudget,
} from "../budget/budget-storage";
import {
  createStoredBudget,
  loadActiveBudgetId,
  loadBudgetById,
  loadBudgets,
  saveActiveBudgetId,
  saveStoredBudget,
} from "../budget/budget-service";

jest.mock("../budget/budget-storage", () => ({
  createBudget: jest.fn(),
  getActiveBudgetId: jest.fn(),
  getBudgetById: jest.fn(),
  getBudgets: jest.fn(),
  setActiveBudgetId: jest.fn(),
  upsertBudget: jest.fn(),
}));

function retryWith(token) {
  return (request) => request(token);
}

describe("budget-service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads budget data through the existing storage operations", async () => {
    const budgets = [{ id: "budget-1" }];
    getBudgets.mockResolvedValue(budgets);
    getBudgetById.mockResolvedValue(budgets[0]);

    await expect(loadBudgets("user-1", retryWith("token-1"))).resolves.toBe(
      budgets,
    );
    await expect(
      loadBudgetById("user-1", retryWith("token-1"), "budget-1"),
    ).resolves.toBe(budgets[0]);

    expect(getBudgets).toHaveBeenCalledWith("user-1", "token-1");
    expect(getBudgetById).toHaveBeenCalledWith(
      "user-1",
      "token-1",
      "budget-1",
    );
  });

  it("creates and saves budgets without changing the payload", async () => {
    const payload = {
      id: "budget-1",
      title: "Monthly",
      total: 1000,
      categories: { Spese: 600 },
      cashBalance: 200,
      createdAt: "2026-06-12T10:00:00.000Z",
    };
    const created = { ...payload };
    const saved = [payload];
    createBudget.mockResolvedValue(created);
    upsertBudget.mockResolvedValue(saved);

    await expect(
      createStoredBudget("user-1", retryWith("token-1"), "Monthly"),
    ).resolves.toBe(created);
    await expect(
      saveStoredBudget("user-1", retryWith("token-1"), payload),
    ).resolves.toBe(saved);

    expect(createBudget).toHaveBeenCalledWith({
      name: "Monthly",
      userId: "user-1",
      token: "token-1",
    });
    expect(upsertBudget).toHaveBeenCalledWith("user-1", "token-1", payload);
  });

  it("delegates active budget storage without auth or data changes", async () => {
    getActiveBudgetId.mockResolvedValue("budget-1");

    await expect(loadActiveBudgetId("user-1")).resolves.toBe("budget-1");
    await saveActiveBudgetId("budget-1", "user-1");

    expect(getActiveBudgetId).toHaveBeenCalledWith("user-1");
    expect(setActiveBudgetId).toHaveBeenCalledWith("budget-1", "user-1");
  });

  it("propagates request errors to the existing auth retry layer", async () => {
    const error = { response: { status: 401 } };
    const withAuthRetry = jest.fn().mockRejectedValue(error);

    await expect(loadBudgets("user-1", withAuthRetry)).rejects.toBe(error);

    expect(withAuthRetry).toHaveBeenCalledTimes(1);
    expect(getBudgets).not.toHaveBeenCalled();
  });

  it("does not log tokens or budget data", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    getBudgets.mockResolvedValue([]);

    await loadBudgets("user-1", retryWith("secret-token"));

    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
