# Search

In-page fuzzy search across the CV. Built at deploy time, evaluated
fully in the browser (no network round-trip), and surfaced through the
floating-bar magnifier or the `⌘K` / `Ctrl+K` / `/` keyboard
shortcuts.

This document describes how it actually works — the index format, the
ranking model, and where to add fields when something new becomes
searchable. The companion design notes for the search **trigger** and
**results UI** live in [`DESIGN.md`](DESIGN.md) §9.11–§9.12.

## 1. Build pipeline

`scripts/generate-search-index.mjs` walks the assembled CV and emits
`src/data/search-index.json`. The script runs in `predev`, `pretypecheck`,
`prelint`, and `prebuild` (via the `generate:data` umbrella), so the
index is always fresh against the current content. The output is
schema-validated by `schemas/search-index.schema.json` and the
`tests/data/search-index.test.ts` suite.

The runtime loader (`src/utils/search.ts → loadIndex`) imports the
JSON via a dynamic `import()` so the index ends up in its own chunk
and is only fetched when the user opens the modal.

## 2. Record shape

Every searchable item becomes one record per language (English and
Swedish), keyed by `(kind, openerKey)`:

| Field                                   | Required | Purpose                                                                                                                                                                                  |
| --------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                    | yes      | Unique per record (suffixed with `-en` / `-sv`).                                                                                                                                         |
| `kind`                                  | yes      | One of `project`, `company`, `experience`, `assignment`, `education`, `course`, `skill`, `focus`, `summary`. Drives the kind badge in the result list and the modal that opens on click. |
| `openerKey`                             | yes      | Stable handle the App uses to open the right modal (skill name, company id, project name, …).                                                                                            |
| `title` / `secondary`                   | yes / no | Display strings. `title` is the row title; `secondary` is the smaller Mist row beneath it.                                                                                               |
| `localizedTitle` / `localizedSecondary` | no       | Per-language overrides used at render time so language switching doesn't require a new search.                                                                                           |
| `lang`                                  | yes      | Language of this record. Bilingual records are collapsed at query time (§4).                                                                                                             |
| `fields`                                | yes      | The structured per-field text the ranker actually scores against.                                                                                                                        |

`fields` is the important part. It mirrors the shape of the source
record but pulls out the bits that should rank differently:

- `title` (string) — canonical name. Always present.
- `aliases` (string[]) — hidden alternative names, abbreviations, and
  spellings. Never displayed; only used to surface a record from
  search. Examples: `k8s` for Kubernetes, `csharp` for C#/.NET,
  `ado` for Azure DevOps, `book beat` for BookBeat. Live on the
  source records under an explicit `aliases` field on `skillDetail`,
  `project`, `company`, `focusArea`, `course`, `education`,
  `experience`, and `assignment` (see `schemas/cv.schema.json`
  → `aliasList`).
- `stack` (string[]) — tech the entry uses as core.
- `skills` (string[]) — skill tags the entry exercises.
- `secondary` (string) — same as the displayed `secondary`.
- `description` (string) — the long descriptive text (notes,
  long-form description, tagline, …) for the entry.

The generator also injects useful aliases automatically — e.g. role
titles for an experience record, course code + institution for a
course — so the source data only has to hold what isn't already
implied by the structured fields.

## 3. Ranking model

The ranker scores each record against the user's query independently
of category. Final results are returned **flat** and sorted by score;
the kind appears as a badge on each row but never as a grouping
constraint. Two knobs combine to produce the score:

### 3.1 Field weights (where the match was found)

| Field         | Weight |
| ------------- | -----: |
| `title`       |    100 |
| `alias`       |     75 |
| `stack`       |     60 |
| `skill`       |     50 |
| `secondary`   |     40 |
| `description` |     25 |

Order matters more than the absolute numbers: a stack hit beats a
skill hit; a skill hit beats a description hit. Aliases sit between
title and stack so an abbreviation like `k8s` reliably surfaces the
underlying entry.

### 3.2 Match-type modifiers (how good the match is)

For each query token / field pair the ranker picks the strongest match
type the field will admit, then multiplies the field weight by:

| Type      | Multiplier | Rule                                                                                                                                                 |
| --------- | ---------: | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exact`   |       1.00 | Whole-word match, anchored at non-alphanumeric boundaries (so `c#` matches inside `C#/.NET`).                                                        |
| `prefix`  |       0.85 | Field contains a word that **starts with** the token.                                                                                                |
| `partial` |       0.65 | Token appears as a substring anywhere in the field.                                                                                                  |
| `fuzzy`   |       0.40 | Damerau–Levenshtein distance ≤ 1 (token length ≤ 6) or ≤ 2 (longer). Skipped for tokens shorter than 4 characters to avoid collisions on stop-words. |

Multi-token queries score every token independently and **require all
tokens to match somewhere** — a query like `kubernetes nonsense` will
return no results rather than over-promising on a partial match. Each
token's contribution is the best (field weight × match modifier) it
can find anywhere in the record; the record's score is the sum.

### 3.3 Bilingual collapse

Each record exists once per language. After scoring, hits with the
same `(kind, openerKey)` pair are collapsed to the higher-scoring
language so a Swedish search like `containerorkestrator` and an
English search like `kubernetes` both return a single Kubernetes row.

### 3.4 Result limit

The list is truncated to 60 hits before being handed to the UI. Inside
the modal results are capped further by available height; the body
scrolls.

## 4. Match explanations

Each `SearchHit` carries an ordered `matches` array, one entry per
query token, sorted strongest-first. The first one is the
"explanation" rendered under the result row in Code Mono Mist:

- `matched alias "k8s"` — exact alias hit.
- `starts with stack "react"` — prefix on the stack list.
- `contains description "observability"` — substring inside the
  long-form description.
- `≈ skill "kubrentes"` — fuzzy match for `kubernetes`.

The explanations exist so users can tell at a glance **why** something
ranked, especially for fuzzy or alias-driven results that wouldn't
otherwise be obvious.

## 5. Where to extend

| Want to …                                          | Edit                                                                                                                                                                                                                              |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Make a new kind of CV item searchable              | Extend the `SearchKind` union in `src/data/search-index.types.ts` + `schemas/search-index.schema.json`, then teach the generator to emit a record for it, then wire up the matching `handleSearchSelect` branch in `src/App.tsx`. |
| Add a hidden alias for an existing item            | Add an `aliases: ["…"]` array to the source record in `src/data/cv/<category>.json` (or to `skillDetails[<skill>]`).                                                                                                              |
| Re-weight where matches count (e.g. promote stack) | `FIELD_WEIGHTS` in `src/utils/search.ts`.                                                                                                                                                                                         |
| Tighten / loosen the fuzzy threshold               | `MATCH_MODIFIERS` and `maxFuzzyDistance` in `src/utils/search.ts`.                                                                                                                                                                |
| Change the rendered explanation copy               | `ui.search.matchExplanation` in `src/utils/i18n.ts` (English + Swedish).                                                                                                                                                          |

When in doubt, the `tests/unit/search.test.ts` fixtures are the
shortest description of the contract — anything that isn't covered by
those examples is fair game to refactor.
