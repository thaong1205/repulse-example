'use strict';

/** Thrown when every attempt failed. The last error is in `cause`. */
class RetryError extends Error {
  constructor(attempts, cause) {
    super(`Failed after ${attempts} attempts: ${cause && cause.message}`);
    this.name = 'RetryError';
    this.attempts = attempts;
    this.cause = cause;
  }
}

/**
 * Calls `fn` until it resolves, retrying when it throws.
 *
 * options.retries      total number of attempts (default 5)
 * options.backoffMs    milliseconds before the first retry, multiplied by `factor` after each one (default 100)
 * options.factor       backoff multiplier (default 2)
 * options.jitter       randomize each wait by up to this fraction, 0 to 1 (default 0.2)
 * options.shouldRetry  called with the error; return false to stop retrying
 * options.onRetry      called with (error, attempt, waitMs) before each wait
 *
 * `fn` receives the attempt number, starting at 1. When every attempt fails, a RetryError is thrown.
 */
async function retry(fn, options = {}) {
  const { retries = 5, backoffMs = 100, factor = 2, jitter = 0.2, shouldRetry = () => true, onRetry } = options;
  let lastError;
  let attempt = 0;
  while (attempt < retries) {
    attempt++;
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;
      if (attempt === retries || !shouldRetry(err)) break;
      const base = backoffMs * Math.pow(factor, attempt - 1);
      const wait = Math.round(base * (1 + (Math.random() * 2 - 1) * jitter));
      if (onRetry) onRetry(err, attempt, wait);
      await sleep(wait);
    }
  }
  throw new RetryError(attempt, lastError);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { retry, RetryError };
