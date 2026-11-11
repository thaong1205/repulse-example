# Trying RePulse notifications with this repo

This repo has three versions with real code changes between them, and release notes that say almost nothing,
which is exactly what RePulse is for:

| Release  | What the notes say                 | What the code really changes (for RePulse to find)                                  |
| -------- | ---------------------------------- | ------------------------------------------------------------------------------------ |
| `v1.0.0` | "First release."                   | the baseline                                                                         |
| `v1.1.0` | "Internal cleanup and improvements." | `delay` option renamed (old name silently ignored), `retries` now counts total calls, backoff doubles by default, attempts count from 1 |
| `v1.2.0` | "Adds an `onRetry` hook."          | errors are now wrapped in `RetryError`, default retries 3 -> 5, jitter added, Node 14/16 dropped |

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

## 5. Publish `v1.2.0`

```bash
scripts/release.sh 1.2.0
```

## Start over

Delete the GitHub releases and tags, remove the repo from the watchlist, and recreate the repo.
