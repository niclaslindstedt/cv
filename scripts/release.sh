#!/usr/bin/env bash
set -euo pipefail

# Release helper: compute next version, tag, and push.
# Used by .github/workflows/version-bump.yml and as a break-glass procedure.
#
# Usage: scripts/release.sh [auto|patch|minor|major]
#   auto  — derive bump type from conventional commits since last tag (default)
#   patch — force a patch bump
#   minor — force a minor bump
#   major — force a major bump

BUMP="${1:-auto}"
REPO_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"

cd "$REPO_ROOT"

# Require a clean working tree
if ! git diff --quiet HEAD; then
  echo "error: working tree is dirty; commit or stash changes first" >&2
  exit 1
fi

# Require main branch
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$BRANCH" != "main" ]]; then
  echo "error: releases must be cut from main (currently on '$BRANCH')" >&2
  exit 1
fi

# Find the previous tag
PREV_TAG="$(git describe --tags --abbrev=0 --match 'v*' 2>/dev/null || echo "")"

if [[ -z "$PREV_TAG" ]]; then
  CURRENT_VERSION="0.0.0"
else
  CURRENT_VERSION="${PREV_TAG#v}"
fi

IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

if [[ "$BUMP" == "auto" ]]; then
  if [[ -z "$PREV_TAG" ]]; then
    LOG_RANGE="HEAD"
  else
    LOG_RANGE="${PREV_TAG}..HEAD"
  fi

  COMMITS="$(git log "$LOG_RANGE" --pretty=format:"%s")"

  if echo "$COMMITS" | grep -qE '^[a-z]+(\([^)]+\))?!:'; then
    BUMP="major"
  elif echo "$COMMITS" | grep -qE '^feat(\([^)]+\))?:'; then
    BUMP="minor"
  else
    BUMP="patch"
  fi
fi

case "$BUMP" in
  major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
  minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
  patch) PATCH=$((PATCH + 1)) ;;
  *)
    echo "error: unknown bump type '$BUMP'" >&2
    exit 1
    ;;
esac

NEW_TAG="v${MAJOR}.${MINOR}.${PATCH}"

if git rev-parse "$NEW_TAG" >/dev/null 2>&1; then
  echo "error: tag $NEW_TAG already exists" >&2
  exit 1
fi

echo "Bumping $CURRENT_VERSION → ${MAJOR}.${MINOR}.${PATCH} (${BUMP})"
git tag "$NEW_TAG"
git push origin "$NEW_TAG"
echo "Tagged and pushed $NEW_TAG"
