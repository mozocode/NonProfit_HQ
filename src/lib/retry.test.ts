import { describe, expect, it, vi } from "vitest";

import { isLikelyTransientError, withRetry } from "@/lib/retry";

describe("retry", () => {
  it("isLikelyTransientError recognizes common codes", () => {
    expect(isLikelyTransientError({ code: "unavailable" })).toBe(true);
    expect(isLikelyTransientError({ code: "permission-denied" })).toBe(false);
    expect(isLikelyTransientError(new Error("Failed to fetch"))).toBe(true);
  });

  it("withRetry succeeds on first attempt", async () => {
    const fn = vi.fn().mockResolvedValue(42);
    await expect(withRetry(fn, { maxAttempts: 3 })).resolves.toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("withRetry retries transient errors then succeeds", async () => {
    const err = { code: "unavailable" };
    const fn = vi.fn().mockRejectedValueOnce(err).mockResolvedValueOnce("ok");
    await expect(withRetry(fn, { maxAttempts: 3, baseDelayMs: 1 })).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("withRetry does not retry permission errors", async () => {
    const fn = vi.fn().mockRejectedValue({ code: "permission-denied" });
    await expect(withRetry(fn, { maxAttempts: 3, baseDelayMs: 1 })).rejects.toEqual({ code: "permission-denied" });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
