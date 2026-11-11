# Trying RePulse notifications with this repo

This repo has several versions with real code changes between them. Each one tries a different situation:

| Release  | What the notes say                         | What the code really changes (for RePulse to find)                                                     | Tests |
| -------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ----- |
| `v1.0.0` | "First release."                           | the baseline                                                                                            |       |
| `v1.1.0` | "Internal cleanup and small improvements." | `delay` renamed to `backoffMs` (old name silently ignored), `retries` now counts total calls, backoff doubles by default, attempts count from 1 | hidden breaking changes |
| `v1.2.0` | "Adds an `onRetry` hook."                  | errors wrapped in `RetryError`, default retries 3 -> 5, jitter added, Node 14/16 dropped                  | half-true notes |
| `v1.2.1` | "Bug fixes."                               | a real jitter fix, but also a new `RetryError` message (breaks code that matches on it) and an extra `shouldRetry` argument | a "patch" with a behavior change |
| `v1.3.0` | lists `signal`, `wrap()` and the types     | exactly that                                                                                            | honest notes: few or no gaps |
| `v2.0.0` | "ESM-only. Adds `timeoutMs`."              | also renames `retries` to `attempts` (old name silently ignored, so the default of 5 applies), Node 18 dropped | a major release with an incomplete changelog |

RePulse only records the **latest** release of a repo when you start watching it, then notifies you about each
**newer** one. So publish the releases one at a time, in this order.

## 1. Push the repo

Create an empty repository on GitHub (public, so RePulse can read it without a token), then:

```bash
git remote add origin git@github.com:<you>/retry-lite.git
git push -u origin main v1.0.0
```

## 2. Publish `v1.0.0` as a GitHub Release

A tag alone is not enough, RePulse follows **Releases**. With the GitHub CLI:

```bash
gh release create v1.0.0 --title v1.0.0 --notes-file release-notes/1.0.0.md
```

or on github.com: Releases -> Draft a new release -> choose tag `v1.0.0` -> Publish release.

## 3. Watch it in RePulse

Add `<you>/retry-lite` to your watchlist. Its latest release (`v1.0.0`) is recorded as the starting point; there is
nothing to compare it with yet, so no analysis and no email.

## 4. Publish `v1.1.0`

```bash
scripts/release.sh 1.1.0
```

This fast-forwards `main` to the prepared `release-1.1.0` branch, tags `v1.1.0`, pushes, and creates the GitHub
Release (with `gh`; without it the script tells you what to click). Within the poll interval (30 minutes by
default) RePulse sees the release, analyzes the diff `v1.0.0 -> v1.1.0`, and notifies you. Instant-frequency users
get an email as soon as the analysis is done; digest users at the next digest.

Want it sooner while testing? Restart the API, the poller runs shortly after start.

## 5. Publish the rest, one at a time

```bash
scripts/release.sh 1.2.0
scripts/release.sh 1.2.1
scripts/release.sh 1.3.0
scripts/release.sh 2.0.0
```

Wait for each notification before publishing the next one if you want one email per release; publish several
at once to see a digest.

## Start over

Delete the GitHub releases and tags, remove the repo from the watchlist, and recreate the repo.
