'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { retry, wrap, RetryError } = require('..');

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

test('a jitter above 1 never makes a negative wait', async () => {
  const waits = [];
  await retry(flaky(3).fn, { backoffMs: 1, jitter: 5, onRetry: (e, a, w) => waits.push(w) });
  assert.ok(waits.every((w) => w >= 0));
});

test('shouldRetry also gets the attempt number', async () => {
  const seen = [];
  await assert.rejects(retry(flaky(10).fn, { ...fast, retries: 3, shouldRetry: (e, a) => { seen.push(a); return true; } }));
  assert.deepStrictEqual(seen, [1, 2]);
});

test('an aborted signal stops while waiting', async () => {
  const controller = new AbortController();
  const f = flaky(10);
  const pending = retry(f.fn, { backoffMs: 1000, jitter: 0, signal: controller.signal });
  setTimeout(() => controller.abort(new Error('stop')), 20);
  await assert.rejects(pending, /stop/);
  assert.strictEqual(f.calls(), 1);
});

test('wrap returns a retried version of the function', async () => {
  let calls = 0;
  const add = wrap(async (a, b) => { calls++; if (calls < 2) throw new Error('x'); return a + b; }, fast);
  assert.strictEqual(await add(2, 3), 5);
  assert.strictEqual(calls, 2);
});
