export interface RetryOptions {
  /** Total number of attempts. Default 5. */
  retries?: number;
  /** Milliseconds before the first retry. Default 100. */
  backoffMs?: number;
  /** Backoff multiplier. Default 2. */
  factor?: number;
  /** Randomize each wait by up to this fraction, 0 to 1. Default 0.2. */
  jitter?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, waitMs: number) => void;
  /** Aborting stops at once and rejects with the signal's reason. */
  signal?: AbortSignal;
}

export declare class RetryError extends Error {
  readonly attempts: number;
  readonly cause: unknown;
}

export declare function retry<T>(fn: (attempt: number) => Promise<T> | T, options?: RetryOptions): Promise<T>;

export declare function wrap<A extends unknown[], T>(fn: (...args: A) => Promise<T> | T, options?: RetryOptions): (...args: A) => Promise<T>;
