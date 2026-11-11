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
  assert.strictEqual(await retry(f.fn, { delay: 1 }), 'ok');
  assert.strictEqual(f.calls(), 1);
});

test('retries after a failure', async () => {
  const f = flaky(2);
  assert.strictEqual(await retry(f.fn, { delay: 1 }), 'ok');
  assert.strictEqual(f.calls(), 3);
});

test('retries: 3 means up to 4 calls', async () => {
  const f = flaky(10);
  await assert.rejects(retry(f.fn, { retries: 3, delay: 1 }), /boom 4/);
  assert.strictEqual(f.calls(), 4);
});

test('the attempt number starts at 0', async () => {
  const seen = [];
  await retry(async (attempt) => { seen.push(attempt); if (attempt < 2) throw new Error('x'); }, { delay: 1 });
  assert.deepStrictEqual(seen, [0, 1, 2]);
});
