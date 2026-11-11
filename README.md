# retry-lite

Tiny helper that retries an async function until it succeeds.

```js
const { retry } = require('retry-lite');

const data = await retry(() => fetchSomething(), { retries: 3, delay: 200 });
```

## Options

| Option    | Default | Meaning                                              |
| --------- | ------- | ---------------------------------------------------- |
| `retries` | `3`     | Retries after the first failure (so up to 4 calls).  |
| `delay`   | `100`   | Milliseconds to wait between calls.                  |

`fn` receives the attempt number, starting at `0`. If every call fails, the last error is thrown as is.

## Development

```bash
npm test
```

> This repository is a throwaway example for trying out RePulse notifications. See [TESTING.md](TESTING.md).
