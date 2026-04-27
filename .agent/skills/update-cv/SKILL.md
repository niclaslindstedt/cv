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

| File                             | Role                                                                                                                                                                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/data/cv.json`               | CV skeleton. Holds top-level scalar fields (`name`, `title`, `summary`, `links`, …) inline and uses the literal `"{...}"` sentinel for split categories. Don't replace a sentinel — edit the matching part file under `src/data/cv/<category>.json`. |
| `src/data/cv/*.json`             | Per-category content: `meta`, `focus`, `projects`, `companies`, `experience`, `education`, `courses`, `skills`, `skillDetails`, `languages`. Edit here for any change inside one of these arrays/objects.                                            |
| `src/data/cv.local.json`         | **Gitignored** override deep-merged into the assembled CV when `CV_LOCAL=1`. Holds private content (email, phone, fuller job descriptions, alternate `pdfFilename`). Treated as the public CV's private companion — see "Sensitive content" below.   |
| `src/data/cv.local.example.json` | Starter template for the local override. Committed.                                                                                                                                                                                                  |
| `src/data/load-cv.mjs`           | Assembles `cv.json` + `cv/*.json` and applies `cv.local.json` on top when `CV_LOCAL=1`. The Vite plugin, scripts, and `make validate` all go through it; the schema validates the assembled object.                                                  |
| `schemas/cv.schema.json`         | JSON Schema. The contract the **assembled** CV must satisfy.                                                                                                                                                                                         |
| `src/data/cv.types.ts`           | TypeScript mirror of the schema, consumed by UI.                                                                                                                                                                                                     |
| `src/components/*.tsx`           | Renderers for each section.                                                                                                                                                                                                                          |

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

## Sensitive content (mandatory triage step)

The committed CV ships to GitHub Pages and is indexed publicly. The
gitignored override at `src/data/cv.local.json` is the only safe place
for private content — `make local` deep-merges it into the assembled
CV before baking the PDF.

**Before you write to any committed file**, scan the user's request
for content that should not be public:

- Personal contact details: email address, phone number, postal/home
  address, personal national ID numbers.
- Internal employer/client information: confidential project names,
  customer names under NDA, unreleased product names, internal team
  names, internal headcount/revenue figures, salaries.
- Concrete impact numbers that would reveal proprietary metrics
  (production traffic, ARR, churn, internal cost figures).
- Any copy the user describes as "private", "for recruiters only",
  "off the record", "don't put on the website", "for the printable
  CV only", etc.

If the request includes any of the above, **stop before editing the
public CV** and confirm with the user, e.g.:

> This looks like content I should keep out of the public CV. I'll
> add it to `src/data/cv.local.json` (gitignored) so it only shows
> up in `make local` PDFs and never reaches the deployed site. OK
> to proceed?

When applying:

- Write the sensitive fields to `src/data/cv.local.json` only,
  shaped as a partial override of the public CV (see the merge
  rules below). Create the file from `cv.local.example.json` if it
  doesn't exist yet.
- Suggest setting `print.pdfFilename` in the override to a distinct
  name (e.g. `"cv.local.pdf"`) so the private PDF cannot be
  confused with the public `cv.pdf`. Both are gitignored via the
  `*.pdf` rule.
- Run validation in local mode (`CV_LOCAL=1 npm run validate:cv`)
  and remind the user to verify with `make local` that the merged
  PDF looks right.
- **Never** commit `src/data/cv.local.json` itself, and never echo
  the sensitive values into commit messages, PR descriptions, or
  the public schema example. Adding new schema fields to support
  the override is fine; populating them with real values in
  committed JSON is not.

### Override merge rules (`src/data/load-cv.mjs`)

- **Plain objects** — merge key-by-key, override values win.
- **Arrays** — merge element-by-element by index. Use `null` to
  preserve the base entry at a given position; entries past the
  base length are appended.
- **Scalars** — override replaces base.

Practical consequence: to override one experience entry's
`printDescription`, place an array in the override whose first item
is `{ "printDescription": { … } }`; index 0 maps to the most-recent
role because the public `experience[]` is sorted newest-first.

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

### Top-level fields (`name`, `title`, `location`, `summary`, `links`, `actions`, `sections`, `contact`)

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
- `contact` — optional `{ email?, phone?, address? }`. **Don't put
  real values here.** This field exists so the override at
  `src/data/cv.local.json` can populate it; the public CV ships
  without it. If the user supplies an email/phone/address, route
  the change to the override per "Sensitive content" above.

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
  `repo` must be a full `https://` URL. Also write a
  `printDescription` (see "Print descriptions" below) — every
  project should have one so the PDF doesn't fall back to the
  short tagline.
- **Update** — find by `name`. Typical edits: tagline, description,
  stack additions. When the description changes meaningfully,
  re-evaluate `printDescription` too — it is independent copy and
  goes stale on its own.
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
- `printDescription` (optional, on both `experience[]` and
  `experience[].assignments[]`) — paper-CV blurb describing what
  the holder actually did at the company/client. Falls back to
  the company/client `tagline` when omitted, which is fine for
  short listings but rarely as good as a role-specific blurb.
  See "Print descriptions" below for the writing rules.

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
  it is now a core skill). Apply the **naming rules** below before
  writing; if you need a `skillDetails` entry, key it on the same
  exact string.
- **Remove an item** — delete the string from `items`. Warn if
  removing something that appears in a `projects[].skills` — the
  site will still render, but the skill claim is gone. Also remove
  the matching `skillDetails` entry (the validator requires 1:1).
- **Rename an item** — change the string in `items` AND in every
  `projects[].skills`, `experience[].skills`,
  `experience[].assignments[].skills`, and `education[].skills`
  that references it; rekey the matching `skillDetails` entry.
  `make validate` will fail loudly if any reference is missed.
- **Reorder** — reorder `items` inside a group, or reorder the
  groups themselves. The first group appears first on the page.
- **Rename a group label** — edit the group's `label`; `key` can
  stay as-is.

#### Naming rules

Apply these every time you add or rename a skill, and run them as a
review pass whenever you touch `skills.json`. Surface any drift you
find as Cleanup recommendations (see Recommendation mode).

1. **Prefer short names.** Skills render as pills; long names wrap
   and crowd the layout. Aim for ≤ 22 characters and ≤ 2 words.
   Use the industry-standard short form whenever one exists:
   - `Infrastructure as Code` → `IaC`
   - `Microsoft SQL Server` → `MSSQL`
   - `AI evaluations` → `AI evals`
   - `Vector Databases` → `Vector DBs`
   - `Agile Methodologies` → `Agile`
   - `RFC Implementation` → `RFCs`
   - `Engineering Management` → `Eng. management`
   - `Technology Roadmapping` → `Tech roadmapping`

   Keep the long form only when no recognized short form exists
   (e.g. `Multi-agent orchestration` has no canonical abbreviation).

2. **One casing style per group.** Pick sentence case
   (`Multi-agent orchestration`) or Title Case
   (`Engineering Management`) for the group and apply it to every
   item that isn't a proper noun. Do not mix the two styles within
   the same group. The defaults are:
   - `ai`, `devops`, `practices`, `compliance` → sentence case
   - `languages`, `frameworks`, `cloud`, `databases`, `leadership`
     → Title Case (most entries are proper nouns or acronyms
     anyway)
3. **Proper nouns and acronyms keep their canonical form.**
   `Claude Code`, `GitHub Copilot`, `PostgreSQL`, `RAG`, `GDPR`,
   `gRPC/Protobuf`, `CI/CD` stay exactly as their owners write
   them, regardless of the group's default casing.
4. **No trailing qualifiers.** Drop redundant words like
   "technologies", "systems", "platform", "engineering" when the
   group label already implies them (e.g. inside the `databases`
   group, `Vector Databases` → `Vector DBs`; inside `compliance`,
   `Regulatory Compliance` → `Compliance` — but watch for
   collisions with the group label itself).
5. **Disambiguate when the short name collides.** If shortening
   would clash with an existing skill or look ambiguous in the pill
   (e.g. two skills both ending up as `AI`), keep enough words to
   tell them apart.

When in doubt about a rename, propose it in Recommendation mode and
let the user pick — renames touch every reference in `experience`,
`projects`, `education`, and `skillDetails`.

## Print descriptions

`printDescription` is a paper-only field that overrides the default
text shown in the printed/PDF CV. It exists on `projects[]`,
`experience[]`, and `experience[].assignments[]`. It is what readers
of a static document — a recruiter scrolling a PDF, a printout in a
stack — actually see for that entry. The field is optional; when
omitted, the print bake (`scripts/generate-print.mjs`) falls back to
the project `tagline` for projects and to the company/client
`tagline` for experience and assignments.

### Why it is separate from `description`

The web view and the paper view are two different products:

- **Web `tagline` + `description`** — the website is interactive.
  `tagline` is a hook that fits next to the project name; the full
  `description` lives behind a click (modal, expand, hover). The
  reader chooses whether to dig in. The home page can stay clean,
  and the description can be long because it is hidden by default.
- **Paper `printDescription`** — the PDF is static. The reader
  cannot click anything. There is no tagline-then-modal pattern
  available; whatever you put on the page is what they see. The
  text has to do the entire job in one read, and it has to fit in
  the strict vertical budget of a printed CV.

Because of that, the same content rarely works in both places. The
web tagline is usually too short ("One CLI for all your AI coding
agents.") and the web description is usually too long (a full
paragraph of features and history). `printDescription` is the
purpose-written middle.

### What makes a good print description

1. **1–2 sentences, ~25–55 words.** Long enough to be substantive,
   short enough that ten projects fit on a page without crowding.
2. **Lead with what the thing is, then what's distinctive.** A
   recruiter scanning the page should know in the first six words
   whether the entry is interesting to them.
3. **Concrete and self-contained.** Name the technologies, the
   scope, the artifact (CLI, library, service, SDK). No unresolved
   references to "the homepage", "the modal", "the live demo" — the
   reader cannot follow a link.
4. **Impact-oriented for jobs and assignments.** What the holder
   shipped, decided, or led — not what the company sells. Use
   active verbs (built, led, shipped, designed, migrated).
5. **No marketing voice and no hidden context.** Skip "powerful",
   "cutting-edge", "world-class". Don't assume the reader has
   already read the rest of the CV — every entry must stand alone.
6. **Past tense for completed work, present for ongoing.**
7. **Localize both `en` and `sv`** to the same level of polish; the
   Swedish version is what Swedish-speaking readers see and is not
   a second-class citizen.

Anti-pattern: a `printDescription` that explains how the project's
website is built ("This is the site you're viewing right now…").
On paper, that meta-narration falls flat — the reader doesn't have
the site in front of them. Describe the artifact, not the medium.

### Editing flow

- **Add or update**: write fresh copy that matches the rules above;
  do not paraphrase the web `description`. Validate with `make
validate`. Eyeball the rendered PDF (`make build` produces it)
  for length — anything over ~55 words is suspect.
- **Remove**: deleting `printDescription` is fine and reverts that
  entry to the company/client/project `tagline` fallback. Useful
  when the tagline already says everything that fits on paper.

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
- **Cleanup** — surface naming drift in `skills.json`. Two checks,
  applied per group (skip proper nouns / canonical product names
  and acronyms):
  1. **Casing consistency** — flag any group whose items mix Title
     Case and sentence case. Propose pulling them to one style
     (see "Naming rules" above for the per-group default).
  2. **Long names with a short form** — flag items > 22 characters
     or > 2 words that have a recognized short form (`IaC`,
     `MSSQL`, `AI evals`, …). Propose the rename, listing the
     references that would need to update (in `projects[].skills`,
     `experience[].skills`, `assignments[].skills`,
     `education[].skills`, and the `skillDetails` key).
- **Print drift** — flag entries where `printDescription` is
  missing on a `projects[]` item (every project should have one),
  or where it looks stale relative to the matching web
  `description` (e.g. mentions a feature the web copy no longer
  does, or vice versa). Propose a fresh `printDescription` per
  the rules in "Print descriptions" above.

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

If the edit touched `src/data/cv.local.json`, also run the validator
in local mode so the merged shape is checked:

```sh
CV_LOCAL=1 npm run validate:cv
```

If `make dev` is already running, the browser hot-reloads and the
change is visible immediately. For significant edits, open the dev
server and eyeball the affected section before reporting done. For
local-override edits, run `make local` and eyeball the produced
`dist/<pdfFilename>` PDF.

## Skill self-improvement

If a recommendation recurs across sessions (e.g. you keep
suggesting a "Talks" section), promote it to the schema and the
types instead of re-suggesting it forever. When you do, add a row
to the `Where new code goes` table in `AGENTS.md`.
