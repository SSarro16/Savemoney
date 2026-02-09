import {
  PaymentMethod,
  getCategoryFromIcon,
  normalizeExpense,
  normalizeIcon,
} from "../expenses/expense-normalize";

describe("expense-normalize", () => {
  it("maps emoji icon to ionicon", () => {
    expect(normalizeIcon("🍕")).toBe("pizza-outline");
  });

  it("falls back to default icon for unsupported icon names", () => {
    expect(normalizeIcon("not-an-icon")).toBe("pricetag-outline");
  });

  it("normalizes payment method and method ids", () => {
    const item = normalizeExpense({
      amount: "12.5",
      icon: "card-outline",
      methodType: PaymentMethod.CARD,
      cardId: "card_1",
    });

    expect(item.amount).toBe(12.5);
    expect(item.methodType).toBe(PaymentMethod.CARD);
    expect(item.methodId).toBe("card_1");
    expect(item.cashId).toBe("");
  });

  it("derives category from icon when missing", () => {
    expect(getCategoryFromIcon("car-outline")).toBe("TRANSPORT");
  });
});
