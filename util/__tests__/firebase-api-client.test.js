import { isAuthError, withFirebaseAuthRetry } from "../firebase-api-client";

function httpError(status) {
  return { response: { status } };
}

describe("firebase-api-client auth retry", () => {
  it("recognizes 401 and 403 auth errors", () => {
    expect(isAuthError(httpError(401))).toBe(true);
    expect(isAuthError(httpError(403))).toBe(true);
  });

  it("does not refresh for non-auth errors", async () => {
    const error = httpError(500);
    const request = jest.fn().mockRejectedValue(error);
    const refreshSession = jest.fn();

    await expect(
      withFirebaseAuthRetry(request, { token: "old-token", refreshSession }),
    ).rejects.toBe(error);

    expect(request).toHaveBeenCalledTimes(1);
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it("retries once after refreshing auth", async () => {
    const request = jest
      .fn()
      .mockRejectedValueOnce(httpError(401))
      .mockResolvedValueOnce("ok");
    const refreshSession = jest.fn().mockResolvedValue({ token: "new-token" });

    await expect(
      withFirebaseAuthRetry(request, { token: "old-token", refreshSession }),
    ).resolves.toBe("ok");

    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(refreshSession).toHaveBeenCalledWith(true);
    expect(request).toHaveBeenNthCalledWith(1, "old-token");
    expect(request).toHaveBeenNthCalledWith(2, "new-token");
  });

  it("propagates the original error when refresh fails", async () => {
    const error = httpError(403);
    const request = jest.fn().mockRejectedValue(error);
    const refreshSession = jest.fn().mockRejectedValue(new Error("refresh failed"));

    await expect(
      withFirebaseAuthRetry(request, { token: "old-token", refreshSession }),
    ).rejects.toBe(error);

    expect(request).toHaveBeenCalledTimes(1);
    expect(refreshSession).toHaveBeenCalledTimes(1);
  });

  it("does not loop when the retry also fails", async () => {
    const firstError = httpError(401);
    const secondError = httpError(403);
    const request = jest
      .fn()
      .mockRejectedValueOnce(firstError)
      .mockRejectedValueOnce(secondError);
    const refreshSession = jest.fn().mockResolvedValue({ token: "new-token" });

    await expect(
      withFirebaseAuthRetry(request, { token: "old-token", refreshSession }),
    ).rejects.toBe(secondError);

    expect(request).toHaveBeenCalledTimes(2);
    expect(refreshSession).toHaveBeenCalledTimes(1);
  });

  it("does not log tokens", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const error = httpError(401);
    const request = jest.fn().mockRejectedValue(error);
    const refreshSession = jest.fn().mockResolvedValue(null);

    await expect(
      withFirebaseAuthRetry(request, { token: "secret-token", refreshSession }),
    ).rejects.toBe(error);

    expect(warnSpy).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
    logSpy.mockRestore();
  });
});
