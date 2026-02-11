import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addExpenseTemplate,
  getExpenseTemplates,
} from "../expenses/expense-template";

describe("expense-template scoped storage", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("keeps templates isolated by user id", async () => {
    await addExpenseTemplate("user_a", "token_a", {
      id: "tpl_a",
      title: "Coffee",
      category: "Food",
      payMethod: "CASH",
      amount: 3.5,
    });

    await addExpenseTemplate("user_b", "token_b", {
      id: "tpl_b",
      title: "Netflix",
      category: "Subscriptions",
      payMethod: "CARD",
      cardId: "card_1",
      amount: 12.99,
    });

    const userATemplates = await getExpenseTemplates("user_a", "token_a");
    const userBTemplates = await getExpenseTemplates("user_b", "token_b");

    expect(userATemplates).toHaveLength(1);
    expect(userBTemplates).toHaveLength(1);
    expect(userATemplates[0].id).toBe("tpl_a");
    expect(userBTemplates[0].id).toBe("tpl_b");
  });

  it("does not migrate legacy shared templates without owner marker", async () => {
    await AsyncStorage.setItem(
      "expenseTemplates_v1",
      JSON.stringify([{ id: "legacy_tpl", title: "Legacy" }]),
    );

    const list = await getExpenseTemplates("user_new", "token_new");
    expect(list).toEqual([]);
  });

  it("migrates legacy templates only for matching owner marker", async () => {
    await AsyncStorage.setItem(
      "expenseTemplates_v1",
      JSON.stringify([{ id: "legacy_tpl", title: "Legacy" }]),
    );
    await AsyncStorage.setItem("expense_templates_v1_owner_uid", "user_owner");

    const ownerList = await getExpenseTemplates("user_owner", "token_owner");
    const otherList = await getExpenseTemplates("user_other", "token_other");

    expect(ownerList).toHaveLength(1);
    expect(ownerList[0].id).toBe("legacy_tpl");
    expect(otherList).toEqual([]);
  });

  it("requires both userId and token", async () => {
    await expect(getExpenseTemplates("", "token")).rejects.toThrow(
      "Auth non disponibile",
    );
    await expect(getExpenseTemplates("user", "")).rejects.toThrow(
      "Auth non disponibile",
    );
  });
});
