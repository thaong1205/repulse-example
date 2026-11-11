'use strict';

/**
 * Calls `fn` until it resolves, retrying when it throws.
 *
 * options.retries      total number of attempts (default 3)
 * options.backoffMs    milliseconds before the first retry, multiplied by `factor` after each one (default 100)
 * options.factor       backoff multiplier (default 2)
 * options.shouldRetry  called with the error; return false to stop retrying
 *
 * `fn` receives the attempt number, starting at 1. When every attempt fails, the last error is thrown as is.
 */
async function retry(fn, options = {}) {
  const { retries = 3, backoffMs = 100, factor = 2, shouldRetry = () => true } = options;
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;
      if (attempt === retries || !shouldRetry(err)) break;
      await sleep(backoffMs * Math.pow(factor, attempt - 1));
    }
  }
  throw lastError;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { retry };
