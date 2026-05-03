---
name: update-company-descriptions
description: "Use when the user wants to refresh the `tagline` and/or `description` of one or more companies in `src/data/cv.json` using their declared `sourceUrls`. Fetches each source, synthesizes a tight bilingual tagline + description pair, propagates the change into any matching `experience[].printDescription` (and assignment `printDescription` when the assignment's `clientId` resolves to a company being refreshed), and validates the result."
---

# update-company-descriptions

Rewrite `companies[].tagline` and `companies[].description` (English +
Swedish) for entries that declare `sourceUrls`, using the linked sources
as ground truth. After updating a company, propagate the change into
the matching `experience[].printDescription` (and into
`experience[].assignments[].printDescription` when an assignment's
`clientId` resolves to a refreshed company) so the print/PDF copy
doesn't keep stale phrasing from the old tagline. The fields are kept
in sync — every run that touches one re-evaluates the others so they
don't drift apart. This skill is **intent-driven** — only run when the
user explicitly asks ("refresh the company descriptions", "update
BookBeat from its sources", …). Never mutate `cv.json` without an
explicit ask.

## Inputs

| File                          | Role                                                                                                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/data/cv/companies.json`  | Source of company entries; where `tagline`, `description`, and `sourceUrls` live.                                                                                                                |
| `src/data/cv/experience.json` | Where `experience[].printDescription` and `experience[].assignments[].printDescription` live. Re-checked for every refreshed company so print copy doesn't drift away from the new tagline.      |
| `schemas/cv.schema.json`      | Contract — `companies[].sourceUrls[]` and the two `printDescription` shapes live here.                                                                                                           |
| `src/data/cv.types.ts`        | TS mirror of the schema (`SourceUrl`, `Company.sourceUrls`, `Experience.printDescription`, `Assignment.printDescription`).                                                                       |
| `src/data/facts.local.json`   | **Optional, gitignored** free-form scratch pad of background context the user maintains. Read on every run; used to ground tone, NDA boundaries, and per-company notes. See "Local facts" below. |

`sourceUrls` is **data only** — no component renders it. Its sole
purpose is to feed this skill.

Each `sourceUrl` entry has:

```json
{
  "title": "Official about page",
  "url": "https://example.com/about",
  "description": "Why this URL matters for the company description."
}
```

## Scope

- **All** mode: when the user says "refresh all companies", iterate over
  every `companies[]` entry that has a non-empty `sourceUrls`. Skip
  entries without `sourceUrls` — they are out of scope for this skill.
- **Targeted** mode: when the user names companies (by `id`, `name`, or
  obvious nickname), only refresh those. Resolve the name to the
  `companies[].id` before fetching.

If the user names a company that has no `sourceUrls`, stop and ask
whether to add some via the `update-cv` skill instead — don't invent
sources.

## Local facts (read every run)

Before fetching anything, read `src/data/facts.local.json` if it
exists. The file is free-form JSON the user maintains as background
context — there is no schema. A starter template lives at
`src/data/facts.local.example.json`.

Use it to:

- Honour `_rules` / `do_not_say` / NDA flags. If the facts file says
  "never name client X" or "don't mention exact revenue numbers", that
  takes precedence over what the public sources happen to say.
- Pick up per-company notes (`companies.<id>` is a likely shape, but
  the user may organise it differently — scan the whole file). These
  notes reflect what the user actually did or knows about the
  company beyond the marketing surface; let them inform emphasis and
  factual accuracy.
- Match the user's tone preferences (e.g. neutral Swedish register,
  "shipped over delivered") when phrasing the new tagline /
  description.

Treat the contents as **private by default**. Never copy a fact
verbatim into the committed CV unless either (a) the user explicitly
marks it safe to mention, or (b) at least one fetched `sourceUrl`
already states it publicly. The facts file's job here is to keep you
accurate and on-voice, not to expand what the public CV reveals.

If the file is missing, continue silently. If it is malformed JSON,
warn the user in one line and continue without it.

## Run procedure

For each in-scope company:

1. **Fetch every `sourceUrl.url`** via the `WebFetch` tool. Use the
   entry's `title` + `description` as guidance for what to extract
   (mission, scale, product, audience, ownership, founding year).
   - If a fetch fails (404, timeout, blocked), record the failure and
     continue with the remaining sources for that company.
   - If **every** source for a company fails, skip the company and
     report it in the final summary — do not edit its tagline or
     description.
2. **Synthesize** a new tagline:
   - A short, descriptive noun phrase — typically three to seven words,
     never more than one sentence. The tagline is a CV label, not a
     marketing pitch: say what the company **is** (a category + an
     audience or domain), not why it's great.
   - No selling words. Strip "leading", "revolutionary", "world-class",
     "automated", "powerful", "best-in-class", "innovative" — even when
     the source uses them. The tagline must read as a neutral
     descriptor a third party could write.
   - No verbs of aspiration ("empowering", "transforming", "driving").
     Prefer plain noun phrases like ".NET and JavaScript consultancy."
     or "Forecasting and scenario planning platform.".
   - Match the tone of neighbouring `companies[].tagline` entries.
3. **Synthesize** a new description:
   - A short paragraph — typically two to four sentences. It elaborates
     on the tagline with the distinctive facts a recruiter would want:
     ownership, scale (users / employees / markets), founding year and
     founders, geography, audience, what makes the offering specific.
   - Don't repeat the tagline verbatim. The first sentence may name the
     category again if it lets later sentences pack in facts, but
     prefer leading with a fact the tagline doesn't carry.
   - Stay factual and neutral — only state things at least one source
     supports. No marketing fluff, no first person, no superlatives
     beyond what's trivially true and source-supported.
   - Match the tone of neighbouring `companies[].description` entries.
4. **Translate** both fields to Swedish (`sv`) with the same length and
   emphasis as the English (`en`). Preserve proper nouns; do not
   translate company names or product names.
5. **Write** the new `{ en, sv }` pairs into `companies[].tagline` and
   `companies[].description`. Leave every other field on the company
   untouched.
6. **Diff-check**: if a new tagline or description is materially the
   same as the existing one (e.g. only word-order changes or
   punctuation), keep the existing copy for that field. Only emit edits
   that add information or improve accuracy. The two fields are
   evaluated independently — it's fine to update only one of them.
7. **Propagate to `printDescription`** in `src/data/cv/experience.json`:
   - Find every `experience[]` entry whose `companyId` equals the
     refreshed company's `id`. If it has a `printDescription`, check
     whether the English or Swedish copy embeds phrasing from the
     **old** tagline (e.g. "a .NET and JavaScript consultancy" when
     the new tagline is "a software development and architecture
     consultancy"). If so, rewrite the affected fragment using the
     **new** tagline's phrasing while preserving the rest of the
     sentence (typically the promotion arc, tenure summary, or
     scope-of-work clause). Keep both languages in sync — both
     `en` and `sv` are re-evaluated together.
   - Find every `experience[].assignments[]` entry whose `clientId`
     equals the refreshed company's `id` (a company can act as a
     client on someone else's tenure). Apply the same propagation to
     its `printDescription`.
   - If a `printDescription` does **not** quote the old tagline
     verbatim and reads correctly under the new one, leave it
     untouched. The goal is to fix stale phrasing, not to rewrite
     hand-tuned print copy.
   - Never invent a `printDescription` that wasn't there. If the
     entry omits the field, it falls back to the company / client
     `tagline` at render time — the fallback handles the update for
     free.

## Conventions

- Don't add fields the schema doesn't allow. `sourceUrls` already
  exists; do not invent siblings (`lastUpdated`, `verifiedAt`, …).
- Don't edit `name`, `url`, `terminated`, `stack`, `id`, or any other
  company field. This skill only owns `tagline`, `description`, and
  the `printDescription` propagation in `experience.json`.
- Don't touch other fields on the experience entry — `companyId`,
  `clientId`, `roles`, `startDate`, `endDate`, `assignments`, `skills`,
  `stack` — only the bilingual `printDescription` text.
- Don't touch companies whose `terminated: true` is set unless the
  user explicitly says so — their tagline and description are
  intentionally historical.
- Preserve JSON key order: `id`, `name`, `tagline`, `description`,
  `url`, `terminated`, `stack`, `sourceUrls`. Prettier (`make fmt`)
  does not reorder keys, so the writer must.

## Verification

Always finish, in this order:

```sh
make validate    # ajv-cli check against schemas/cv.schema.json
make fmt         # Prettier rewrite
make typecheck   # tsc -b --noEmit
```

If any step fails, fix the issue before reporting done. `make
validate` failing usually means a malformed `sourceUrls` entry slipped
in — re-read the schema's `sourceUrl` definition.

## Reporting

End the run with a short report containing, for each in-scope company:

- `id` and `name`.
- Per-field status — `tagline: updated|unchanged`,
  `description: updated|unchanged`, and
  `printDescription: updated|unchanged|n/a` (where `n/a` means no
  matching `experience[]` or assignment carried a `printDescription`
  for this company) — or `skipped (all sources failed)`.
- For `updated` fields, a one-line preview of the new English copy.
- For `skipped` entries, the failing URL(s).

Do not commit. Leave the working tree dirty so the user can review the
diff before staging.

## Skill self-improvement

If you find yourself repeatedly adjusting the same tagline or
description after a fetch (e.g. trimming the same marketing phrase),
add a guideline to the matching "Synthesize" step above so future runs
avoid it from the start.
