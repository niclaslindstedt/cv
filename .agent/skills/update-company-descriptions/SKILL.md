---
name: update-company-descriptions
description: "Use when the user wants to refresh the `description` of one or more companies in `src/data/cv.json` using their declared `sourceUrls`. Fetches each source, synthesizes a tight bilingual description, and validates the result."
---

# update-company-descriptions

Rewrite `companies[].description` (English + Swedish) for entries that
declare `sourceUrls`, using the linked sources as ground truth. This
skill is **intent-driven** — only run when the user explicitly asks
("refresh the company descriptions", "update BookBeat from its
sources", …). Never mutate `cv.json` without an explicit ask.

## Inputs

| File                     | Role                                                         |
| ------------------------ | ------------------------------------------------------------ |
| `src/data/cv.json`       | Source of company entries; the file you edit.                |
| `schemas/cv.schema.json` | Contract — `companies[].sourceUrls[]` shape lives here.      |
| `src/data/cv.types.ts`   | TS mirror of the schema (`SourceUrl`, `Company.sourceUrls`). |

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

## Run procedure

For each in-scope company:

1. **Fetch every `sourceUrl.url`** via the `WebFetch` tool. Use the
   entry's `title` + `description` as guidance for what to extract
   (mission, scale, product, audience, ownership, founding year).
   - If a fetch fails (404, timeout, blocked), record the failure and
     continue with the remaining sources for that company.
   - If **every** source for a company fails, skip the company and
     report it in the final summary — do not edit its description.
2. **Synthesize** a new description:
   - One or two sentences. Keep it terse; this string renders inside a
     compact card and modal on the site.
   - Lead with what the company does, then add the most distinctive
     fact (scale, ownership, sector positioning).
   - Stay factual — only state things at least one source supports.
   - Match the tone of neighbouring `companies[].description` entries
     (declarative, no marketing fluff, no first person).
3. **Translate** to Swedish (`sv`) with the same length and emphasis as
   the English (`en`). Preserve proper nouns; do not translate company
   names or product names.
4. **Write** the new `{ en, sv }` pair into `companies[].description`.
   Leave every other field on the company untouched.
5. **Diff-check**: if the new description is materially the same as the
   existing one (e.g. only word-order changes or punctuation), keep the
   existing copy. Only emit edits that add information or improve
   accuracy.

## Conventions

- Don't add fields the schema doesn't allow. `sourceUrls` already
  exists; do not invent siblings (`lastUpdated`, `verifiedAt`, …).
- Don't edit `name`, `url`, `terminated`, `stack`, `id`, or any other
  company field. This skill only owns `description`.
- Don't touch companies whose `terminated: true` is set unless the
  user explicitly says so — their description is intentionally
  historical.
- Preserve JSON key order: `id`, `name`, `description`, `url`,
  `terminated`, `stack`, `sourceUrls`. Prettier (`make fmt`) does not
  reorder keys, so the writer must.

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
- `updated` / `unchanged` / `skipped (all sources failed)`.
- For `updated` entries, a one-line preview of the new English
  description.
- For `skipped` entries, the failing URL(s).

Do not commit. Leave the working tree dirty so the user can review the
diff before staging.

## Skill self-improvement

If you find yourself repeatedly adjusting the same description after a
fetch (e.g. trimming the same marketing phrase), add a guideline to the
"Synthesize" step above so future runs avoid it from the start.
