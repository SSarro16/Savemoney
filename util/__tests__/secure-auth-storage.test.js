import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

import {
  clearStoredAuthData,
  getStoredAuthData,
  migrateLegacyAuthDataIfNeeded,
  setStoredAuthData,
} from "../secure-auth-storage";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("../logger", () => ({
  logger: {
    warn: jest.fn(),
  },
}));

describe("secure-auth-storage", () => {
  const secureValues = {};

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();

    Object.keys(secureValues).forEach((key) => {
      delete secureValues[key];
    });

    SecureStore.getItemAsync.mockImplementation(async (key) => secureValues[key] || null);
    SecureStore.setItemAsync.mockImplementation(async (key, value) => {
      secureValues[key] = value;
    });
    SecureStore.deleteItemAsync.mockImplementation(async (key) => {
      delete secureValues[key];
    });
  });

  it("saves and reads auth data from SecureStore", async () => {
    const authData = {
      token: "id-token",
      refreshToken: "refresh-token",
      userId: "user-1",
      expiryDate: 123456,
    };

    await setStoredAuthData(authData);

    await expect(getStoredAuthData()).resolves.toEqual(authData);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("authData", JSON.stringify(authData));
  });

  it("clears SecureStore auth data", async () => {
    await setStoredAuthData({ token: "id-token", userId: "user-1" });

    await clearStoredAuthData();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("authData");
    await expect(getStoredAuthData()).resolves.toBeNull();
  });

  it("migrates legacy AsyncStorage authData to SecureStore", async () => {
    const legacy = {
      token: "legacy-token",
      refreshToken: "legacy-refresh",
      userId: "legacy-user",
      expiryDate: 789,
    };
    await AsyncStorage.setItem("authData", JSON.stringify(legacy));

    await expect(migrateLegacyAuthDataIfNeeded()).resolves.toEqual(legacy);

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("authData", JSON.stringify(legacy));
    await expect(AsyncStorage.getItem("authData")).resolves.toBeNull();
  });

  it("does not crash on corrupted legacy authData", async () => {
    await AsyncStorage.setItem("authData", "{bad-json");

    await expect(getStoredAuthData()).resolves.toBeNull();

    await expect(AsyncStorage.getItem("authData")).resolves.toBeNull();
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it("clear removes legacy sensitive auth keys", async () => {
    await AsyncStorage.multiSet([
      ["authData", JSON.stringify({ token: "legacy-token", userId: "legacy-user" })],
      ["token", "legacy-token"],
      ["userId", "legacy-user"],
      ["refreshToken", "legacy-refresh"],
      ["expiryDate", "123"],
    ]);

    await clearStoredAuthData();

    await expect(AsyncStorage.multiGet(["authData", "token", "userId", "refreshToken", "expiryDate"])).resolves.toEqual([
      ["authData", null],
      ["token", null],
      ["userId", null],
      ["refreshToken", null],
      ["expiryDate", null],
    ]);
  });
});
