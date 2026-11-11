'use strict';

/**
 * Calls `fn` until it resolves, retrying when it throws.
 *
 * options.retries  how many times to retry after the first failure (default 3, so up to 4 calls)
 * options.delay    milliseconds to wait between calls (default 100)
 *
 * `fn` receives the attempt number, starting at 0. When every call fails, the last error is thrown as is.
 */
async function retry(fn, options = {}) {
  const { retries = 3, delay = 100 } = options;
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;
      if (attempt < retries) await sleep(delay);
    }
  }
  throw lastError;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { retry };
