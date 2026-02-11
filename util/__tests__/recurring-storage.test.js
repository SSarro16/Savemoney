import AsyncStorage from "@react-native-async-storage/async-storage";

import { getRecurringItems } from "../recurring/recurring-storage";
import { firebaseApi } from "../firebase-rest";

jest.mock("../firebase-rest", () => {
  const api = {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  };

  return {
    dbUrl: (path, token) =>
      `https://db.test/${String(path || "").replace(/^\/+/, "")}.json?auth=${encodeURIComponent(String(token || ""))}`,
    firebaseApi: api,
    requestConfig: jest.fn(() => ({ timeout: 1000 })),
    safeId: (value) => encodeURIComponent(String(value || "").trim()),
    withLegacyFallback: async (runPrimary) => await runPrimary(),
  };
});

describe("recurring-storage account isolation", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it("uses user-scoped recurring paths for each account", async () => {
    firebaseApi.get.mockImplementation(async (url) => {
      if (url.includes("/users/user_a/recurring")) {
        return {
          data: {
            rec_a: {
              id: "rec_a",
              title: "A recurring",
              amount: 12,
              type: "HABIT",
            },
          },
        };
      }

      if (url.includes("/users/user_b/recurring")) {
        return {
          data: {
            rec_b: {
              id: "rec_b",
              title: "B recurring",
              amount: 21,
              type: "SUBSCRIPTION",
            },
          },
        };
      }

      return { data: {} };
    });

    const userAItems = await getRecurringItems("user_a", "token_a");
    const userBItems = await getRecurringItems("user_b", "token_b");

    expect(userAItems).toHaveLength(1);
    expect(userBItems).toHaveLength(1);
    expect(userAItems[0].id).toBe("rec_a");
    expect(userBItems[0].id).toBe("rec_b");

    const urls = firebaseApi.get.mock.calls.map((call) => String(call[0] || ""));
    const urlsForUserA = urls.filter((url) => url.includes("user_a"));
    const urlsForUserB = urls.filter((url) => url.includes("user_b"));

    expect(urlsForUserA.length).toBeGreaterThan(0);
    expect(urlsForUserB.length).toBeGreaterThan(0);
    expect(urlsForUserA.every((url) => url.includes("/users/user_a/recurring"))).toBe(true);
    expect(urlsForUserB.every((url) => url.includes("/users/user_b/recurring"))).toBe(true);
  });

  it("does not import legacy local recurring data for a different owner", async () => {
    await AsyncStorage.setItem(
      "recurringItems_v1",
      JSON.stringify([
        {
          id: "legacy_rec",
          title: "Legacy recurring",
          type: "HABIT",
          amount: 5,
        },
      ]),
    );
    await AsyncStorage.setItem("recurring_items_v1_owner_uid", "user_a");

    firebaseApi.get.mockResolvedValue({ data: {} });

    const list = await getRecurringItems("user_b", "token_b");
    expect(list).toEqual([]);
    expect(firebaseApi.put).not.toHaveBeenCalled();
  });
});
