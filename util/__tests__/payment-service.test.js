import {
  fetchCards,
  fetchCashWallets,
  removeCard,
  removeCashWallet,
  setDefaultCashWallet,
  upsertCard,
  upsertCashWallet,
} from "../payment-http";
import {
  deleteStoredCard,
  deleteStoredCashWallet,
  loadCards,
  loadCashWallets,
  saveCard,
  saveCashWallet,
  saveDefaultCashWallet,
} from "../payment/payment-service";

jest.mock("../payment-http", () => ({
  fetchCards: jest.fn(),
  fetchCashWallets: jest.fn(),
  removeCard: jest.fn(),
  removeCashWallet: jest.fn(),
  setDefaultCashWallet: jest.fn(),
  upsertCard: jest.fn(),
  upsertCashWallet: jest.fn(),
}));

function retryWith(token) {
  return (request) => request(token);
}

describe("payment-service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads cards and cash wallets through the existing HTTP operations", async () => {
    const cards = [{ id: "card-1" }];
    const wallets = [{ id: "cash-1", isDefault: true }];
    fetchCards.mockResolvedValue(cards);
    fetchCashWallets.mockResolvedValue(wallets);

    await expect(loadCards("user-1", retryWith("token-1"))).resolves.toBe(
      cards,
    );
    await expect(
      loadCashWallets("user-1", retryWith("token-1")),
    ).resolves.toBe(wallets);

    expect(fetchCards).toHaveBeenCalledWith("user-1", "token-1");
    expect(fetchCashWallets).toHaveBeenCalledWith("user-1", "token-1");
  });

  it("saves payment payloads without changing their shape", async () => {
    const card = {
      id: "card-1",
      name: "Main card",
      brand: "Visa",
      last4: "1234",
      balance: 42.5,
    };
    const wallet = {
      id: "cash-1",
      name: "Wallet",
      balance: 18.25,
      isDefault: true,
    };
    upsertCard.mockResolvedValue("card-1");
    upsertCashWallet.mockResolvedValue("cash-1");

    await expect(
      saveCard("user-1", retryWith("token-1"), card),
    ).resolves.toBe("card-1");
    await expect(
      saveCashWallet("user-1", retryWith("token-1"), wallet),
    ).resolves.toBe("cash-1");

    expect(upsertCard).toHaveBeenCalledWith("user-1", "token-1", card);
    expect(upsertCashWallet).toHaveBeenCalledWith(
      "user-1",
      "token-1",
      wallet,
    );
  });

  it("delegates deletes and default wallet updates unchanged", async () => {
    const wallets = [
      { id: "cash-1", isDefault: false },
      { id: "cash-2", isDefault: true },
    ];

    await deleteStoredCard("user-1", retryWith("token-1"), "card-1");
    await deleteStoredCashWallet(
      "user-1",
      retryWith("token-1"),
      "cash-1",
    );
    await saveDefaultCashWallet(
      "user-1",
      retryWith("token-1"),
      "cash-2",
      wallets,
    );

    expect(removeCard).toHaveBeenCalledWith(
      "user-1",
      "token-1",
      "card-1",
    );
    expect(removeCashWallet).toHaveBeenCalledWith(
      "user-1",
      "token-1",
      "cash-1",
    );
    expect(setDefaultCashWallet).toHaveBeenCalledWith(
      "user-1",
      "token-1",
      "cash-2",
      wallets,
    );
  });

  it("propagates auth errors to the existing retry layer", async () => {
    const error = { response: { status: 401 } };
    const withAuthRetry = jest.fn().mockRejectedValue(error);

    await expect(loadCards("user-1", withAuthRetry)).rejects.toBe(error);

    expect(withAuthRetry).toHaveBeenCalledTimes(1);
    expect(fetchCards).not.toHaveBeenCalled();
  });

  it("does not log tokens or payment data", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    fetchCards.mockResolvedValue([]);

    await loadCards("user-1", retryWith("secret-token"));

    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
