---
name: update-summary
description: "Use when the user wants to refresh the hero summary and the click-to-expand long summary in src/data/cv.json. The skill is interactive — it asks two short questions (where you are now / where you are going) before rewriting, so the long summary never hallucinates."
---

# update-summary

Interactive rewrite of `cv.summary` and `cv.longSummary` in
`src/data/cv.json`. The short summary is the clickable headline shown
in the hero; the long summary is the modal body opened when the user
clicks it (see `docs/DESIGN.md` §5.4). Both fields are bilingual
(`{ en, sv }`) and must satisfy the existing JSON Schema.

This skill is **intent-driven** — only run it when the user explicitly
asks ("refresh the summary", "rewrite my hero summary", "update the
long summary"). Never mutate `cv.json` without an explicit ask.

## Files

| File                              | Role                                                      |
| --------------------------------- | --------------------------------------------------------- |
| `src/data/cv.json`                | Source of `summary` and `longSummary`; the file you edit. |
| `schemas/cv.schema.json`          | Contract — both fields are required `localizedString`.    |
| `src/data/cv.types.ts`            | TS mirror used by `Hero` + `SummaryModal`.                |
| `src/components/Hero.tsx`         | Renders the short summary as a clickable button.          |
| `src/components/SummaryModal.tsx` | Renders the long summary in a modal.                      |

## Why two fields

| Field         | Audience                | Length        | Tone                                          |
| ------------- | ----------------------- | ------------- | --------------------------------------------- |
| `summary`     | Recruiter scan, ~3 sec  | 1–2 sentences | Headline. Where I am + where I'm going.       |
| `longSummary` | Curious reader, ~30 sec | 4–7 sentences | Narrative. Most of the CV, no boring details. |

Keep them in sync — they describe the same person at the same point in
time. Run them as one atomic edit, not two separate passes.

## Run procedure

The skill must be **interactive** so the long summary stays grounded in
facts that are actually true today. Hallucinating a "where I'm going"
sentence from the rest of the CV is the easiest way to embarrass the
author.

### 1. Read the schema first

Before opening `cv.json`, read `schemas/cv.schema.json`. The schema is
the map of the CV: it tells you which fields exist, which are required,
which are bilingual `localizedString` objects, how `experience[]` nests
`assignments[]` and `roles[]`, how `companies[]` is keyed by `id` and
referenced from `experience[].companyId` / `assignments[].clientId`,
and which fields (e.g. `endDate: null`) signal "still active".

Reading the schema first makes the next step quicker and cheaper:
`cv.json` is large (often >25k tokens) and you'll want to navigate it
in slices rather than reading it whole. The schema tells you which
slices matter.

### 2. Gather facts already in the CV

With the schema in hand, read the relevant slices of `src/data/cv.json`
and pull out, without inventing anything:

- `name`, `title`, `location`.
- `focus[]` — top entries are the current direction.
- `projects[]` — the first 3–4 are the ones the author wants surfaced.
- `experience[]` — the first 2–3 employers and the most recent role
  title; mark which entries are still active (`endDate: null`).
- `education[]` — institution + level for each entry. Skip if the user
  asks for a non-academic summary.

Skim `companies[]` for descriptions you can reference by name, but do
not paste their taglines into the summary.

### 3. Ask the user, before rewriting

Use `AskUserQuestion` (one tool call, multiple questions if the tool
allows it) to confirm the two facts the CV cannot tell you:

1. **Where are you now?** (One sentence: current role, current focus,
   what you are spending most of your time on this month.)
2. **Where are you going?** (One sentence: the direction over the next
   6–12 months — a deliberate next step, not a vague aspiration.)

If the user replies with bullet points or fragments, that is fine —
the writing pass below will turn them into prose.

If the user has already supplied both facts in the original prompt,
skip the question and proceed; **do not** invent answers from
`focus[]` alone, even if it looks obvious. The whole point of this
skill is that the answer must be confirmed by the human.

Optionally also ask:

- **Which audience?** (Recruiter, hiring manager, conference bio,
  freelance prospect.) Default: recruiter, the same audience as the
  rest of the CV.

### 4. Draft the short summary

- 1–2 sentences. Lead with what the author **is** today (role + focus),
  then what they are **moving toward**. Match the rhythm of the
  current `summary` so the rewrite is not jarring.
- No selling words ("leading", "world-class", "passionate"). No verbs
  of aspiration ("transforming", "empowering"). The hero summary is a
  CV headline, not a bio for a podcast.
- Tone matches `companies[].tagline` and `focus[].description`:
  declarative, factual, slightly understated.
- Stay under ~280 characters per language so the line wraps cleanly
  on the hero card on a 320px-wide phone.

### 5. Draft the long summary

- 4–7 sentences. A narrative that walks the reader from the past to
  the future:
  1. **What I do today** — current focus areas, the products / tools
     I am building, the role title.
  2. **How I got here** — a tight selection from `experience[]` and
     `education[]`. Mention the named clients/employers that the CV
     itself emphasizes; don't list every gig. Skip dates.
  3. **Where I'm going** — the answer to the user's question, framed
     as a direction (a kind of system, a class of problem), not as a
     job title or a specific employer.
- Every claim must be supported by something already in `cv.json` or
  by an answer the user just gave. If a sentence is not, drop it.
- No KPIs, no superlatives, no hedging ("perhaps", "I think").
- Avoid bullet lists — this is prose.
- Length: roughly 600–1200 characters. The modal body scrolls, but a
  long blob signals "read all of my CV instead", which defeats the
  purpose.

### 6. Translate

Translate both fields to Swedish (`sv`) with the same sentence count
and emphasis as the English (`en`). Preserve proper nouns: company
names, project names (zag, zig, zad, ztf, …), product names, course
codes. Do not translate them. Use Swedish IT-arkitekt terminology
where the rest of the CV already does (mirror neighboring entries).

### 7. Confirm before writing

Show the user a side-by-side preview of the proposed `summary` and
`longSummary` (both languages). Ask: **"Apply these as-is, or revise
first?"**

- If the user accepts, write to `cv.json`.
- If the user revises any sentence, apply only that sentence's change
  and re-show. Do not silently regenerate the rest.
- If the user rejects, stop. Leave the file untouched.

### 8. Write

Update both `summary` and `longSummary` in one edit. Preserve the
existing JSON key order: `location`, `summary`, `longSummary`,
`links` (Prettier does not reorder keys). Leave every other field
untouched.

## Conventions

- Don't add fields the schema doesn't allow. Both `summary` and
  `longSummary` already exist; do not invent siblings (`tldr`,
  `pitch`, `elevator`, …). If the user asks for a third length tier,
  promote it to the schema first via the `update-cv` skill's
  "Schema changes" path.
- Don't touch `meta.description` or `meta.documentTitle` — those are
  the SEO copy and live on a different cadence. If the user wants
  those refreshed, point them at `update-cv`.
- Don't quote the user's answers verbatim. Paraphrase them into the
  same voice as the surrounding CV.

## Verification

Always finish, in this order:

```sh
make validate    # ajv-cli check against schemas/cv.schema.json
make fmt         # Prettier rewrite of cv.json
make typecheck   # tsc -b --noEmit
```

If any step fails, fix the issue before reporting done. `make
validate` will fail loudly if the new copy is empty or missing one of
the two languages.

If `make dev` is already running, open the hero, click the summary,
and eyeball the modal in both languages and both themes before
declaring success.

## Reporting

End the run with:

- The new English `summary` and `longSummary` (one preview line
  each).
- A note that the Swedish translations were updated to match.
- Any answer the user gave that did not make it into the copy
  verbatim, so they can confirm it's still accurate.

Do not commit. Leave the working tree dirty so the user can review
the diff before staging.

## Skill self-improvement

If the user keeps revising the same kind of sentence (e.g. they
always strike "passionate about", or they always rephrase the
"where I'm going" line), capture the rule as a bullet under the
matching draft step above so future runs avoid the friction.
