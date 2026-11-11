'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { retry } = require('..');

function flaky(failures) {
  let calls = 0;
  const fn = async () => {
    calls++;
    if (calls <= failures) throw new Error('boom ' + calls);
    return 'ok';
  };
  return { fn, calls: () => calls };
}

test('returns the result of the first successful call', async () => {
  const f = flaky(0);
  assert.strictEqual(await retry(f.fn, { backoffMs: 1 }), 'ok');
  assert.strictEqual(f.calls(), 1);
});

test('retries after a failure', async () => {
  const f = flaky(2);
  assert.strictEqual(await retry(f.fn, { backoffMs: 1 }), 'ok');
  assert.strictEqual(f.calls(), 3);
});

test('retries: 3 means 3 calls in total', async () => {
  const f = flaky(10);
  await assert.rejects(retry(f.fn, { retries: 3, backoffMs: 1 }), /boom 3/);
  assert.strictEqual(f.calls(), 3);
});

test('the attempt number starts at 1', async () => {
  const seen = [];
  await retry(async (attempt) => { seen.push(attempt); if (attempt < 3) throw new Error('x'); }, { backoffMs: 1 });
  assert.deepStrictEqual(seen, [1, 2, 3]);
});

test('shouldRetry can stop early', async () => {
  const f = flaky(10);
  await assert.rejects(retry(f.fn, { retries: 5, backoffMs: 1, shouldRetry: () => false }), /boom 1/);
  assert.strictEqual(f.calls(), 1);
});

test('the wait doubles after every failure', async () => {
  const started = Date.now();
  await assert.rejects(retry(flaky(10).fn, { retries: 3, backoffMs: 20 })); // waits 20 + 40
  assert.ok(Date.now() - started >= 55);
});
