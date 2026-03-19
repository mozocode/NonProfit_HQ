/**
 * Retry helpers for flaky network / Firebase operations (Phase 23).
 */

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Heuristic: transient errors worth retrying (uploads, Firestore reads). */
export function isLikelyTransientError(error: unknown): boolean {
  if (error == null) return false;
  if (typeof error !== "object") return false;
  const o = error as { code?: string; message?: string; name?: string };
  const code = typeof o.code === "string" ? o.code : "";
  const msg = typeof o.message === "string" ? o.message : "";
  const name = typeof o.name === "string" ? o.name : "";
  if (/unavailable|deadline-exceeded|resource-exhausted|aborted|internal|network|quota/i.test(code)) return true;
  if (/network|fetch|Failed to fetch|temporarily|timeout/i.test(msg)) return true;
  if (name === "FirebaseError" && /retry|network|unavailable/i.test(msg)) return true;
  return false;
}

export type WithRetryOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
  /** When false, only retry if isLikelyTransientError(e). Default true uses transient check. */
  retryAll?: boolean;
};

/**
 * Run async fn with exponential backoff. Last error is thrown.
 */
export async function withRetry<T>(fn: () => Promise<T>, options?: WithRetryOptions): Promise<T> {
  const maxAttempts = Math.max(1, options?.maxAttempts ?? 3);
  const baseDelayMs = options?.baseDelayMs ?? 400;
  const retryAll = options?.retryAll ?? false;

  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      const canRetry = retryAll || isLikelyTransientError(e);
      if (!canRetry || attempt === maxAttempts - 1) break;
      await sleep(baseDelayMs * 2 ** attempt);
    }
  }
  throw lastError;
}
