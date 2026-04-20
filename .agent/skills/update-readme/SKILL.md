---
name: update-readme
description: "Use when README.md may be stale. Discovers commits since the last README update, identifies what changed, and merges updates into README.md."
---

# update-readme

Bring `README.md` back in sync with the sources of truth in the repo.

## Tracking mechanism

The sibling file `.last-updated` holds the git commit hash of the last
successful run. An empty file means "never run" — use the initial commit
as the baseline.

## Discovery process

Determine what has changed since the baseline:

```sh
BASE=$(cat .agent/skills/update-readme/.last-updated)
HEAD=$(git rev-parse HEAD)
git log --oneline "${BASE:-$(git rev-list --max-parents=0 HEAD)}..$HEAD"
git diff --name-only "${BASE:-$(git rev-list --max-parents=0 HEAD)}..$HEAD"
```

## Mapping: source → README section to update

| Source of truth           | README section                |
| ------------------------- | ----------------------------- |
| `package.json` scripts    | Scripts                       |
| `Makefile` targets        | Scripts / Build               |
| `src/` top-level layout   | Structure                     |
| `src/data/cv.ts`          | (site content — README blurb) |
| `.github/workflows/*.yml` | Badges, CI section            |
| `OSS_SPEC.md` presence    | Links / Contributing          |

## Update checklist

- [ ] Project description still matches what the code does.
- [ ] Scripts section lists every `npm run` / `make` target a contributor
      would want, with a one-line description each.
- [ ] Structure section mirrors the current `src/` layout.
- [ ] Prerequisites (Node version) matches `.github/workflows/ci.yml`.
- [ ] Any new top-level files (Makefile, OSS_SPEC.md) are mentioned if
      they are relevant to contributors.

## Verification

- Re-read `README.md` end-to-end and check each section against the
  mapping table.
- Run `make fmt-check` so any prose formatting is consistent.

## Skill self-improvement

If you discover a drift pattern not already in the mapping table (e.g. a
new source file whose contents the README should restate), append a row
to the table and commit the skill update alongside the README change.
