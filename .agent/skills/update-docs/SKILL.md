---
name: update-docs
description: "Use when files under docs/ may be stale. Discovers commits since the last docs sweep and reconciles each docs/*.md file with its sources of truth (component CSS, schemas, search index, design tokens)."
---

# update-docs

Bring the prose under `docs/` back in sync with the code, schemas, and
data files those documents describe. `docs/` currently ships:

- `docs/DESIGN.md` — visual design system (tokens, layout, motion).
- `docs/SEARCH.md` — search index format, ranker behaviour, alias
  conventions.
- `docs/getting-started.md` — contributor onboarding (prereqs, scripts,
  local-override conventions).

Each doc has a different source of truth. This skill walks them in
order, asks "did the source change since the baseline?", and rewrites
only the sections that drifted.

## Tracking mechanism

The sibling file `.last-updated` holds the git commit hash of the last
successful run. An empty file means "never run" — use the initial
commit as the baseline.

## Discovery process

Determine what has changed since the baseline:

```sh
BASE=$(cat .agent/skills/update-docs/.last-updated)
HEAD=$(git rev-parse HEAD)
BASE=${BASE:-$(git rev-list --max-parents=0 HEAD)}
git log --oneline "$BASE..$HEAD"
git diff --name-only "$BASE..$HEAD"
```

Read every `docs/*.md` file end-to-end before editing. The files are
small enough that the round-trip is cheap and ensures the rewrite
matches the existing voice and structure.

## Mapping: source → docs file / section to update

| Source of truth                                                                       | Docs file / section                                  |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `src/styles/tokens.css`                                                               | `docs/DESIGN.md` → Tokens                            |
| `src/styles/hero.css` / `focus.css` / `experience.css` / `projects.css` / `print.css` | `docs/DESIGN.md` → per-section style chapter         |
| `src/styles/timeline-vis.css`                                                         | `docs/DESIGN.md` → Timeline                          |
| `src/components/Hero.tsx` / `Focus.tsx` / `Experience.tsx` / `Projects.tsx`           | `docs/DESIGN.md` → section component notes           |
| Any new `src/components/*.tsx` section                                                | `docs/DESIGN.md` → add a section chapter             |
| `schemas/search-index.schema.json`                                                    | `docs/SEARCH.md` → Index shape                       |
| `scripts/generate-search-index.mjs`                                                   | `docs/SEARCH.md` → Index generation                  |
| `src/utils/search.ts`                                                                 | `docs/SEARCH.md` → Ranker behaviour, scoring weights |
| `src/components/SearchModal.tsx` + `src/styles/search.css`                            | `docs/SEARCH.md` → UI behaviour                      |
| `aliases` arrays under `src/data/cv/*.json`                                           | `docs/SEARCH.md` → Aliases section                   |
| `package.json` scripts / `Makefile` targets                                           | `docs/getting-started.md` → Scripts table            |
| `.nvmrc`, `.github/workflows/ci.yml` Node version                                     | `docs/getting-started.md` → Prerequisites            |
| `src/data/cv.local.example.json` / `src/data/facts.local.example.json`                | `docs/getting-started.md` → Local overrides          |

When a new doc is added under `docs/`, append a row that maps its
upstream sources, and update `AGENTS.md` § "Where new code goes" to
point to it.

## Update checklist

- [ ] `docs/DESIGN.md`: tokens listed match `src/styles/tokens.css`;
      each section chapter exists for every component currently
      mounted in `App.tsx`; the per-section style files referenced
      still exist under `src/styles/`.
- [ ] `docs/SEARCH.md`: shape matches
      `schemas/search-index.schema.json`; ranker weights and field
      lists match `src/utils/search.ts`; alias conventions match
      what `scripts/generate-search-index.mjs` actually consumes.
- [ ] `docs/getting-started.md`: scripts/targets table matches
      `package.json` + `Makefile`; Node version matches `.nvmrc`;
      local-override notes reference the live `*.example.json`
      filenames.
- [ ] Cross-links from `README.md` and `AGENTS.md` to specific docs
      sections still resolve (anchors haven't been renamed).
- [ ] No "TODO" / placeholder text remains in any docs file.

## Verification

- Re-read each touched `docs/*.md` end-to-end and confirm every claim
  against the source(s) it references.
- Run `make fmt-check` so Prettier-managed prose stays consistent.
- Run `make build` if a doc cross-links from runtime code (it
  shouldn't, but the type-check pass is cheap insurance).

## Skill self-improvement

When a new source-of-truth file starts driving a docs section, add a
row to the mapping table. When a doc file is renamed or split, update
this skill alongside the rename so the registry stays accurate.
Commit skill edits in the same PR as the docs edits they unblock.
