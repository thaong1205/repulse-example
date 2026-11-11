'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { retry, RetryError } = require('..');

function flaky(failures) {
  let calls = 0;
  const fn = async () => {
    calls++;
    if (calls <= failures) throw new Error('boom ' + calls);
    return 'ok';
  };
  return { fn, calls: () => calls };
}

const fast = { backoffMs: 1, jitter: 0 };

test('returns the result of the first successful call', async () => {
  const f = flaky(0);
  assert.strictEqual(await retry(f.fn, fast), 'ok');
  assert.strictEqual(f.calls(), 1);
});

test('retries after a failure', async () => {
  const f = flaky(2);
  assert.strictEqual(await retry(f.fn, fast), 'ok');
  assert.strictEqual(f.calls(), 3);
});

test('retries: 3 means 3 calls in total', async () => {
  const f = flaky(10);
  await assert.rejects(retry(f.fn, { ...fast, retries: 3 }), RetryError);
  assert.strictEqual(f.calls(), 3);
});

test('defaults to 5 attempts', async () => {
  const f = flaky(10);
  await assert.rejects(retry(f.fn, fast));
  assert.strictEqual(f.calls(), 5);
});

test('the error carries the last failure and the attempt count', async () => {
  await assert.rejects(retry(flaky(10).fn, { ...fast, retries: 2 }), (err) => {
    assert.ok(err instanceof RetryError);
    assert.strictEqual(err.attempts, 2);
    assert.match(err.cause.message, /boom 2/);
    return true;
  });
});

test('shouldRetry can stop early', async () => {
  const f = flaky(10);
  await assert.rejects(retry(f.fn, { ...fast, retries: 5, shouldRetry: () => false }), RetryError);
  assert.strictEqual(f.calls(), 1);
});

test('onRetry is called before each wait', async () => {
  const seen = [];
  await retry(flaky(2).fn, { ...fast, onRetry: (err, attempt, wait) => seen.push([attempt, wait]) });
  assert.deepStrictEqual(seen, [[1, 1], [2, 2]]);
});
