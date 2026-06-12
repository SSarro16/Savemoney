import { fetchGoals, removeGoal, upsertGoal } from "../goals-storage";
import {
  deleteStoredGoal,
  loadGoals,
  saveStoredGoal,
} from "../goals/goals-service";

jest.mock("../goals-storage", () => ({
  fetchGoals: jest.fn(),
  removeGoal: jest.fn(),
  upsertGoal: jest.fn(),
}));

function retryWith(token) {
  return (request) => request(token);
}

describe("goals-service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads goals through the existing storage operation", async () => {
    const goals = [{ id: "goal-1" }];
    fetchGoals.mockResolvedValue(goals);

    await expect(loadGoals("user-1", retryWith("token-1"))).resolves.toBe(
      goals,
    );

    expect(fetchGoals).toHaveBeenCalledWith("user-1", "token-1");
  });

  it("saves goal payloads without changing their shape", async () => {
    const goal = {
      id: "goal-1",
      title: "Emergency fund",
      targetAmount: 1000,
      currentAmount: 125.5,
      dueDate: "2026-12-31",
      notes: "Monthly deposits",
      period: "MONTHLY",
    };
    upsertGoal.mockResolvedValue("goal-1");

    await expect(
      saveStoredGoal("user-1", retryWith("token-1"), goal),
    ).resolves.toBe("goal-1");

    expect(upsertGoal).toHaveBeenCalledWith("user-1", "token-1", goal);
  });

  it("deletes goals through the existing storage operation", async () => {
    await deleteStoredGoal(
      "user-1",
      retryWith("token-1"),
      "goal-1",
    );

    expect(removeGoal).toHaveBeenCalledWith(
      "user-1",
      "token-1",
      "goal-1",
    );
  });

  it("propagates auth errors to the existing retry layer", async () => {
    const error = { response: { status: 401 } };
    const withAuthRetry = jest.fn().mockRejectedValue(error);

    await expect(loadGoals("user-1", withAuthRetry)).rejects.toBe(error);

    expect(withAuthRetry).toHaveBeenCalledTimes(1);
    expect(fetchGoals).not.toHaveBeenCalled();
  });

  it("does not log tokens or goal data", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    fetchGoals.mockResolvedValue([]);

    await loadGoals("user-1", retryWith("secret-token"));

    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
