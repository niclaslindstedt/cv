---
name: update-cv
description: "Use when the user wants to add, update, or remove entries in the CV (src/data/cv.json), or wants recommendations on what to add, remove, or emphasize. Always validates the result against schemas/cv.schema.json before finishing."
---

# update-cv

Guided edits to `src/data/cv.json`. This skill is **intent-driven** — it
runs when the user asks to change the CV or wants a review — not as part
of the automated `maintenance` sweep. Never mutate the CV without the
user's explicit ask or confirmation.

## Files

| File                     | Role                                                                                                                                                                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/data/cv.json`       | CV skeleton. Holds top-level scalar fields (`name`, `title`, `summary`, `links`, …) inline and uses the literal `"{...}"` sentinel for split categories. Don't replace a sentinel — edit the matching part file under `src/data/cv/<category>.json`. |
| `src/data/cv/*.json`     | Per-category content: `meta`, `focus`, `projects`, `companies`, `experience`, `education`, `courses`, `skills`, `skillDetails`, `languages`. Edit here for any change inside one of these arrays/objects.                                            |
| `src/data/load-cv.mjs`   | Assembles `cv.json` + `cv/*.json`. The Vite plugin, scripts, and `make validate` all go through it; the schema validates the assembled object.                                                                                                       |
| `schemas/cv.schema.json` | JSON Schema. The contract the **assembled** CV must satisfy.                                                                                                                                                                                         |
| `src/data/cv.types.ts`   | TypeScript mirror of the schema, consumed by UI.                                                                                                                                                                                                     |
| `src/components/*.tsx`   | Renderers for each section.                                                                                                                                                                                                                          |

Read `schemas/cv.schema.json` first if you are unsure of a field's
shape — it is the authoritative contract.

The split is purely a storage convention; the schema, the runtime
shape, and the rendered site all see one assembled object. To add a
new top-level category, add it to `cv.json` as `"<key>": "{...}"`,
create `src/data/cv/<key>.json` with its content, and extend
`schemas/cv.schema.json` + `src/data/cv.types.ts` as for any other
schema change.

## Modes

Choose one based on the user's message:

1. **Edit mode** — the user named a concrete change
   (e.g. "add a new project called X", "remove the IBNQ role",
   "change my summary to …"). Apply the change, validate, report.
2. **Recommendation mode** — the user asked for a review, ideas,
   or did not name a concrete change (e.g. "what should I update?",
   "review my CV"). Return a grouped suggestion list **without
   editing files**, then wait for the user to pick what to apply.

If the request is ambiguous, default to recommendation mode and ask.

## Edit flows

Shared conventions:

- **Dates** are `YYYY-MM` strings. Use `null` for "present" on
  `experience[].endDate` (only field that accepts null).
- **URLs** (`links[].url`, `projects[].repo`) must pass the JSON
  Schema `format: "uri"` check.
- **Ordering**:
  - `experience[]` — newest `startDate` first (descending).
  - `projects[]` — priority order; the first project is the one the
    user most wants surfaced.
  - `focus[]` — priority order; first item is primary focus.
  - `education[]` — newest `startDate` first.
  - `skills[].items` — priority order inside each group; first
    item is most fluent / most recently used.
- **Do not** add fields the schema doesn't allow. If the user asks
  for one, follow "Schema changes" below.

### Top-level fields (`name`, `title`, `location`, `summary`, `links`, `actions`, `sections`)

- Path: root of `src/data/cv.json` (these stay inline, no split file).
- `meta` lives in `src/data/cv/meta.json`.
- `summary` — keep to ~2 sentences. If the user rewrites, preserve
  tone but push the newest focus areas to the front.
- `links` — ordered array of `{ label, url, featured? }`. `featured:
true` renders the link as a pill (used for the blog link). The
  label is rendered verbatim, so include glyphs like "↗" if desired.
- `meta.documentTitle` / `meta.description` — drive the browser tab
  title and the `<meta name="description">` tag (both injected into
  `index.html` at build time via `vite.config.ts`).
- `actions.timeline` / `actions.downloadPdf` — hero button labels.
- `sections.*` — section headings (Focus, Projects, Experience,
  Education, Skills). Changing a value just renames the heading.

### `focus[]`

- **Add** — append `{ "area": "...", "since": "YYYY-MM" }`. Move to
  top if the user says it's the primary focus now.
- **Update** — find by `area`; change `since` if the user says they
  started earlier/later.
- **Remove** — delete the object. Ask the user to confirm if the
  focus area is referenced in any `projects[].description`.

### `projects[]`

- **Add** — insert an object with all six fields. Derive `tagline`
  from the user's one-line pitch; `description` from their longer
  blurb; `stack` from the languages/frameworks they mentioned;
  `repo` must be a full `https://` URL.
- **Update** — find by `name`. Typical edits: tagline, description,
  stack additions.
- **Remove** — delete by `name`. Also check `focus[]` and the `ai`
  skill group for stale references to the project's domain.

### `companies[]`

- Top-level ordered list of companies (employers and clients).
  Every `experience[].companyId` and `assignments[].clientId` must
  reference an `id` in this list — `make validate` enforces it.
- Shape: `{ id, name, description, url?, terminated? }`. `id` is a
  stable slug (lowercase, hyphens). `url` renders the company name
  as a link. `terminated: true` renders a small tombstone icon
  next to the name and is the right signal for companies that have
  shut down (e.g. IBNQ).
- **Add** — append a new entry; then point one or more
  `experience[]`/`assignments[]` entries at it via its `id`.
- **Update** — find by `id`. Most common edits: flipping
  `terminated` when a company dissolves, or setting `url` when a
  homepage becomes available.
- **Remove** — only safe if nothing references the `id`. Validate
  with `make validate` after removal.

### `experience[]`

- **Add** — insert a new role with `companyId` pointing at an
  entry in `companies[]` (add the company first if new), then
  re-sort by `startDate` descending. `endDate: null` means
  "present".
- **Update** — find by `companyId` + `startDate`. Most common edit
  is closing a current role (`endDate: null` → a `YYYY-MM` string).
- **Remove** — delete by `companyId` + `startDate`. If removing the
  most recent role, remind the user to update `title` too. If the
  company is no longer referenced anywhere, consider also pruning
  the `companies[]` entry.
- `engagement` is optional; omit it for a full-time role.
- Assignments live on `experience[].assignments[]` and reference
  their own `clientId` in the shared `companies[]` list.

### `education[]`

- Same add/update/remove pattern as `experience[]`, but `endDate` is
  required (no "present" support — if in progress today, say so in
  a top-level `summary` addition instead).

### `skills[]`

- `skills` is an ordered array of groups, each `{ key, label,
items }`. Default keys: `ai`, `languages`, `frameworks`, `cloud`,
  `databases`, `devops`, `practices`. `label` controls the heading
  shown on the site for that group.
- **Add an item** — insert the new string into the group's `items`
  at the priority-correct position (near the top if the user says
  it is now a core skill).
- **Remove an item** — delete the string from `items`. Warn if
  removing something that appears in a `projects[].skills` — the
  site will still render, but the skill claim is gone.
- **Reorder** — reorder `items` inside a group, or reorder the
  groups themselves. The first group appears first on the page.
- **Rename a group label** — edit the group's `label`; `key` can
  stay as-is.

## Recommendation mode

When invoked without a concrete edit, scan `cv.json` and produce a
short, grouped list. Keep the total to ≤ 10 items — quality over
quantity.

Group as:

- **Add** — gaps a senior IT-architect CV usually covers and this
  file doesn't: talks, certifications, measurable impact, team size
  led, OSS adoption metrics (stars/downloads), languages spoken,
  open-source maintainership, awards. Only suggest what's realistic
  given the rest of the CV (don't invent content).
- **Remove / trim** — entries likely to be stale (skills not
  mentioned in any recent project or role), duplicate taglines,
  descriptions over ~450 chars, projects whose `repo` 404s (check
  with the user — don't assume), focus entries older than 24 months
  that no current project reinforces.
- **Emphasize** — mismatches between `focus[]` and what the CV
  actually leads with. E.g. if the top `focus` is "Agentic
  orchestration" but `projects[0]` is a non-orchestration tool,
  suggest reordering. Also flag `summary` sentences that no longer
  lead with the current role or primary focus.

Format as a numbered list. For each item, show:

1. **Group** and **target path** (e.g. `projects[2]`).
2. One-sentence rationale.
3. Proposed diff (JSON snippet) — for Add/Remove, show the inserted
   or deleted fragment; for Emphasize, show the before/after
   ordering or text.

End with: "Which of these should I apply?". Do not edit until the
user picks items.

## Schema changes

If the user's request needs a field the schema doesn't allow
(new top-level section, new property on an existing object, looser
pattern on a date), the change fans out:

1. Update `schemas/cv.schema.json` — add the field, keep
   `additionalProperties: false` working.
2. Mirror it in `src/data/cv.types.ts`.
3. Update or add the component in `src/components/` that renders
   the new field. For a whole new section, also slot it into
   `src/App.tsx`.
4. Edit `src/data/cv.json` with the new content.
5. Run the full verification pipeline (below).
6. Mention in the final report that this was a schema change so
   the user knows the blast radius.

Warn the user before starting a schema change — it is much bigger
than a content edit.

## Verification

Always finish with, in this order:

```sh
make validate    # JSON-schema check via ajv-cli
make fmt         # Prettier rewrites cv.json for consistent shape
make typecheck   # Catches drift between cv.types.ts and the JSON
```

If `make dev` is already running, the browser hot-reloads and the
change is visible immediately. For significant edits, open the dev
server and eyeball the affected section before reporting done.

## Skill self-improvement

If a recommendation recurs across sessions (e.g. you keep
suggesting a "Talks" section), promote it to the schema and the
types instead of re-suggesting it forever. When you do, add a row
to the `Where new code goes` table in `AGENTS.md`.
