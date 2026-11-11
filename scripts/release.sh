#!/usr/bin/env bash
# Publishes the next prepared version: scripts/release.sh 1.1.0
set -euo pipefail

version="${1:?usage: scripts/release.sh <version>, e.g. 1.1.0}"
tag="v${version}"
notes="release-notes/${version}.md"

cd "$(git rev-parse --show-toplevel)"
git diff --quiet && git diff --cached --quiet || { echo "Working tree is not clean." >&2; exit 1; }
git rev-parse --verify --quiet "release-${version}" >/dev/null || { echo "No branch release-${version}." >&2; exit 1; }
git remote get-url origin >/dev/null 2>&1 || { echo "No 'origin' remote. See TESTING.md." >&2; exit 1; }

git checkout main
git merge --ff-only "release-${version}"
git tag -a "${tag}" -m "${tag}"
git push origin main "${tag}"

if command -v gh >/dev/null 2>&1; then
  gh release create "${tag}" --title "${tag}" --notes-file "${notes}"
  echo "Published ${tag}."
else
  echo
  echo "Pushed ${tag}. Now create the GitHub Release (RePulse follows Releases, not tags):"
  echo "  https://github.com/<you>/<repo>/releases/new?tag=${tag}"
  echo "  title: ${tag}"
  echo "  notes: $(cat "${notes}")"
fi
