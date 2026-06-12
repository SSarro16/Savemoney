import {
  deleteExpense,
  fetchExpenses,
  patchExpense,
  storeExpense,
  updateExpense,
  upsertExpenseById,
} from "../http";
import {
  createExpense,
  loadExpenses,
  patchStoredExpense,
  removeExpense,
  replaceExpense,
  restoreExpense,
} from "../expenses/expenses-service";

jest.mock("../http", () => ({
  deleteExpense: jest.fn(),
  fetchExpenses: jest.fn(),
  patchExpense: jest.fn(),
  storeExpense: jest.fn(),
  updateExpense: jest.fn(),
  upsertExpenseById: jest.fn(),
}));

function retryWith(token) {
  return (request) => request(token);
}

describe("expenses-service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads expenses through the existing HTTP operation", async () => {
    const expenses = [{ id: "expense-1" }];
    fetchExpenses.mockResolvedValue(expenses);

    await expect(loadExpenses("user-1", retryWith("token-1"))).resolves.toBe(
      expenses,
    );

    expect(fetchExpenses).toHaveBeenCalledWith("user-1", "token-1");
  });

  it("creates and replaces expenses without changing the payload", async () => {
    const payload = {
      amount: 12.5,
      date: new Date("2026-06-12T10:00:00.000Z"),
      category: "FOOD",
    };
    storeExpense.mockResolvedValue("expense-1");

    await expect(
      createExpense("user-1", retryWith("token-1"), payload),
    ).resolves.toBe("expense-1");
    await replaceExpense(
      "user-1",
      retryWith("token-1"),
      "expense-1",
      payload,
    );

    expect(storeExpense).toHaveBeenCalledWith("user-1", "token-1", payload);
    expect(updateExpense).toHaveBeenCalledWith(
      "user-1",
      "token-1",
      "expense-1",
      payload,
    );
  });

  it("patches, removes, and restores through the existing HTTP operations", async () => {
    const partial = { category: "TRANSPORT" };
    const snapshot = { id: "expense-1", amount: 8 };

    await patchStoredExpense(
      "user-1",
      retryWith("token-1"),
      "expense-1",
      partial,
    );
    await removeExpense("user-1", retryWith("token-1"), "expense-1");
    await restoreExpense(
      "user-1",
      retryWith("token-1"),
      "expense-1",
      snapshot,
    );

    expect(patchExpense).toHaveBeenCalledWith(
      "user-1",
      "token-1",
      "expense-1",
      partial,
    );
    expect(deleteExpense).toHaveBeenCalledWith(
      "user-1",
      "token-1",
      "expense-1",
    );
    expect(upsertExpenseById).toHaveBeenCalledWith(
      "user-1",
      "token-1",
      "expense-1",
      snapshot,
    );
  });

  it("propagates request errors to the existing auth retry layer", async () => {
    const error = { response: { status: 401 } };
    const withAuthRetry = jest.fn().mockRejectedValue(error);

    await expect(loadExpenses("user-1", withAuthRetry)).rejects.toBe(error);

    expect(withAuthRetry).toHaveBeenCalledTimes(1);
    expect(fetchExpenses).not.toHaveBeenCalled();
  });

  it("does not log tokens or expense data", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    fetchExpenses.mockResolvedValue([]);

    await loadExpenses("user-1", retryWith("secret-token"));

    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
