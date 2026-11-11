'use strict';

/** Thrown when every attempt failed. The last error is in `cause`. */
class RetryError extends Error {
  constructor(attempts, cause) {
    super(`Gave up after ${attempts} attempt${attempts === 1 ? '' : 's'}`);
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
 * options.shouldRetry  called with (error, attempt); return false to stop retrying
 * options.onRetry      called with (error, attempt, waitMs) before each wait
 * options.signal       an AbortSignal; aborting stops at once and rejects with the signal's reason
 *
 * `fn` receives the attempt number, starting at 1. When every attempt fails, a RetryError is thrown.
 */
async function retry(fn, options = {}) {
  const { retries = 5, backoffMs = 100, factor = 2, shouldRetry = () => true, onRetry, signal } = options;
  const jitter = Math.min(1, Math.max(0, options.jitter === undefined ? 0.2 : options.jitter));
  let lastError;
  let attempt = 0;
  while (attempt < retries) {
    if (signal && signal.aborted) throw signal.reason;
    attempt++;
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;
      if (attempt === retries || !shouldRetry(err, attempt)) break;
      const base = backoffMs * Math.pow(factor, attempt - 1);
      const wait = Math.max(0, Math.round(base * (1 + (Math.random() * 2 - 1) * jitter)));
      if (onRetry) onRetry(err, attempt, wait);
      await sleep(wait, signal);
    }
  }
  throw new RetryError(attempt, lastError);
}

/** The same function, retried: `const getUser = wrap(fetchUser, { retries: 3 })`. */
function wrap(fn, options) {
  return (...args) => retry(() => fn(...args), options);
}

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal && signal.aborted) return reject(signal.reason);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      if (signal) signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    if (signal) signal.addEventListener('abort', onAbort, { once: true });
  });
}

module.exports = { retry, wrap, RetryError };
