#!/usr/bin/env bash
set -euo pipefail

# Generate a CHANGELOG.md entry for a given tag from conventional commits.
#
# Usage: scripts/generate-changelog.sh <new-tag> [<prev-tag>]
#   new-tag  — the tag to generate notes for (e.g. v1.2.3)
#   prev-tag — the previous tag (auto-detected when omitted)

NEW_TAG="${1:-}"
if [[ -z "$NEW_TAG" ]]; then
  echo "usage: $0 <new-tag> [<prev-tag>]" >&2
  exit 1
fi

PREV_TAG="${2:-}"
if [[ -z "$PREV_TAG" ]]; then
  PREV_TAG="$(git describe --tags --abbrev=0 --match 'v*' "${NEW_TAG}^" 2>/dev/null || echo "")"
fi

if [[ -z "$PREV_TAG" ]]; then
  LOG_RANGE="$NEW_TAG"
else
  LOG_RANGE="${PREV_TAG}..${NEW_TAG}"
fi

DATE="$(git log -1 --format="%ad" --date=short "$NEW_TAG")"
CHANGELOG_PATH="$(git rev-parse --show-toplevel)/CHANGELOG.md"

# Collect commits by section
declare -A ENTRIES
declare -a ORDER=()

while IFS= read -r subject; do
  if [[ "$subject" =~ ^(feat|fix|perf|docs|test|refactor|chore|ci|build|style)(\([^)]+\))?!?:\ (.+)$ ]]; then
    TYPE="${BASH_REMATCH[1]}"
    MSG="${BASH_REMATCH[3]}"
    case "$TYPE" in
      feat)  HDR="Added" ;;
      fix)   HDR="Fixed" ;;
      perf)  HDR="Performance" ;;
      docs)  HDR="Documentation" ;;
      test)  HDR="Tests" ;;
      *)     HDR="Changed" ;;
    esac
    if [[ -z "${ENTRIES[$HDR]+x}" ]]; then
      ENTRIES[$HDR]=""
      ORDER+=("$HDR")
    fi
    ENTRIES[$HDR]+="- ${MSG}"$'\n'
  fi
done < <(git log "$LOG_RANGE" --pretty=format:"%s")

# Build new section text
NEW_SECTION="## [${NEW_TAG}] — ${DATE}"$'\n'$'\n'
for hdr in "${ORDER[@]}"; do
  NEW_SECTION+="### ${hdr}"$'\n'$'\n'
  NEW_SECTION+="${ENTRIES[$hdr]}"$'\n'
done

MARKER="<!-- BEGIN CHANGELOG -->"
if [[ -f "$CHANGELOG_PATH" ]] && grep -q "$MARKER" "$CHANGELOG_PATH"; then
  TEMP="$(mktemp)"
  awk -v section="$NEW_SECTION" \
    '/<!-- BEGIN CHANGELOG -->/{print; print section; next}1' \
    "$CHANGELOG_PATH" > "$TEMP"
  mv "$TEMP" "$CHANGELOG_PATH"
else
  printf '%s\n' "$NEW_SECTION" >> "$CHANGELOG_PATH"
fi

echo "CHANGELOG.md updated for $NEW_TAG"
