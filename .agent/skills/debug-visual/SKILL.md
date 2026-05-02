---
name: debug-visual
description: "Use when the Visual workflow (.github/workflows/visual.yml) is failing on `main` or on a PR. Reproduces the failure, identifies which commit broke each snapshot, decides whether the diff is intentional, re-records baselines if so, and commits the new pixels."
---

# debug-visual

Visual is the Playwright snapshot workflow defined in
`.github/workflows/visual.yml`. It runs `make build && make test-visual`
on `ubuntu-latest` and compares Chromium screenshots against the PNGs
checked in under `tests/visual/__screenshots__/site.test.ts/`. A failure
means a current screenshot drifted past `maxDiffPixelRatio: 0.01` (or
changed dimensions) versus its baseline.

This skill is **diagnostic-first**: it never re-records baselines until
it has explained the drift and confirmed the change was intentional.

## When to run

- The Visual badge is red on `main`, or a PR shows the `visual` check
  failing.
- A local `make test-visual` reports failures after a code change.
- Any change to `src/`, `vite.config.ts`, `scripts/generate-*.mjs`, or
  the per-category data under `src/data/cv/` is about to land and the
  PR author wants to know if the baselines need re-recording.

Do **not** use this skill to mask a real regression. If the diff
doesn't match the change's intent, the answer is "fix the code", not
"update the baseline".

## Inputs the skill needs

- A clean working tree on the branch under investigation.
  `git status --short` must be empty before re-recording, so the only
  staged changes at the end are the regenerated snapshot pixels.
- Linux. The committed baselines were recorded on Linux and CI runs on
  `ubuntu-latest` for the same reason. Re-recording on macOS or Windows
  produces sub-pixel font drift that fails CI immediately. If the
  current host is not Linux, stop and surface that to the user.
- `node_modules/` installed (`npm ci`) and Chromium fetched
  (`npx playwright install chromium`).

## Procedure

### 1. Locate the last green Visual run

Find the most recent commit on `main` whose Visual check was green —
that's the baseline-correct state. Use the GitHub MCP tools:

```text
mcp__github__list_commits  → recent commits on main
mcp__github__pull_request_read (method: get_check_runs) → per-PR status
```

For a red `main`, the breakage is between the last green Visual
conclusion and `HEAD`. For a red PR, the breakage is on the PR's head
branch versus its base.

A common cause is a PR merged with the `visual` check still red:
branch protection on this repo does not block merges on a single
failing workflow. Check the merging PR's check runs first — if its
`visual` conclusion was `failure` and `ci` was `success`, that PR is
the culprit and the diff is almost always intentional.

### 2. Reproduce locally

```sh
npm ci
npx playwright install chromium
make build
CI=1 npm run test:visual
```

Use `CI=1` so retries and worker count match GitHub Actions. The run
writes per-failure artifacts into `test-results/<test-id>/`:

- `<name>-actual.png` — what the current code renders.
- `<name>-expected.png` — the committed baseline.
- `<name>-diff.png` — pixel diff overlay.
- `trace.zip` — full Playwright trace, openable with
  `npx playwright show-trace`.

Record, for each failing snapshot:

- Test name (e.g. `focus section — en / dark`).
- Project (`chromium-desktop` / `chromium-mobile`).
- Expected vs received dimensions. **A size change is the strongest
  signal** — pixel drift inside the same box can be a font-rendering
  fluke; a height change is structural and points at content.

### 3. Map each failing snapshot to its source files

The visual specs live in `tests/visual/site.test.ts`. Snapshot →
likely-source mapping:

| Snapshot                                  | Source files                                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `hero-{en,sv}-{dark,light}`               | `src/components/Hero.tsx`, `src/styles/hero.css`, `src/data/cv.json` (`name`, `summary`, `links`) |
| `focus-en-dark`                           | `src/components/Focus.tsx`, `src/styles/focus.css`, `src/data/cv/focus.json`                      |
| `homepage-en-dark` (full page above-fold) | Anything above the fold — typically a knock-on from a hero or focus change                        |

Cross-cutting changes that can ripple into every snapshot:

- `src/styles/tokens.css`, `src/styles/base.css`, `src/styles.css`
- `vite.config.ts` `cvMetaHtmlPlugin` (font preloads, theme-color)
- Font assets under `node_modules/@fontsource*` after a dep bump
- `src/data/cv.json` top-level scalars consumed by Hero (`name`,
  `summary`, `tagline`, `links`)

### 4. Compare against the change

```sh
LAST_GREEN=<sha from step 1>
git log --oneline "$LAST_GREEN..HEAD" -- \
  src/ scripts/ vite.config.ts package.json package-lock.json
```

For each candidate commit, ask:

1. **Does the change touch the file map for the failing snapshot?**
   If a `focus-*` snapshot fails and the only changed file is
   `src/data/cv/focus.json`, the commit explains the diff cleanly.
2. **Does the change explain the size delta?** Adding a card grows the
   section by roughly one card height; removing one shrinks it.
   Tightening padding shifts dimensions by a few px, not 50.
3. **Are unrelated snapshots also failing?** If `hero-*` is red after a
   focus-only change, that's collateral damage — investigate before
   re-recording. The hero is above the focus section, so its layout
   doesn't depend on focus content.

Open the `*-diff.png` artifact for each failure. The highlighted
pixels confirm or refute the hypothesis from the file diff.

### 5. Decide: expected or regression

- **Expected.** The diff matches the change's intent (added/removed
  content, moved a card, retuned a token). Continue to step 6.
- **Regression.** The diff does not match the change's intent (an
  unrelated section moved, colors shifted unexpectedly, font changed
  weight). Stop. Surface the finding to the user with the file/line
  responsible and the diff artifact path. Do **not** re-record.
- **Ambiguous.** Some failures are expected, some aren't. Stop and
  ask — re-recording mixes the two and hides the regression.

### 6. Re-record baselines

Only after step 5 confirms "expected":

```sh
CI=1 npm run test:visual:update   # writes new PNGs in place
CI=1 npm run test:visual          # confirm clean run
```

`git status --short` should now show only modifications under
`tests/visual/__screenshots__/site.test.ts/`. If anything else changed,
revert it before committing.

### 7. Commit

Use a Conventional-Commits subject scoped to the rebaseline. Examples:

- `test(visual): rebaseline focus and homepage after cybersecurity card`
- `test(visual): rebaseline hero after summary copy edit`
- `test(visual): rebaseline after tokens.css colour retune`

The commit body should:

- Name the upstream commit / PR that drove the change
  (e.g. "Follow-up to #269").
- List which snapshots were re-recorded.
- Confirm the diff was intentional (one sentence is enough).

Push and open a PR. The Visual workflow on the PR must come back
green before merging.

## Guardrails

- **Linux only for re-recording.** Other OSes produce font-rendering
  drift that fails CI on the next run.
- **Never re-record on a dirty tree.** Snapshot regeneration must be
  the only diff in the resulting commit.
- **Never re-record to silence an unintended regression.** If the
  failing diff includes a section the change didn't touch, fix the
  code instead.
- **Don't widen `maxDiffPixelRatio`.** The 0.01 tolerance in
  `playwright.config.ts` is calibrated for sub-pixel font noise; a
  failing test means real drift.
- **Don't add `--no-retries` or `forbidOnly`.** Both are CI-only knobs;
  changing them masks flakiness without fixing it.
- **Re-recording can move the homepage snapshot too.** Anything above
  the fold can shift the full-page composition. That is the one
  expected exception to the "unrelated snapshot drift = regression"
  rule.

## Failure modes to recognise

- **PR merged with `visual` red.** Branch protection lets a PR merge
  while Visual is failing, so `main` inherits the breakage. The fix is
  to re-record on top of `main` and commit the pixels — not to revert
  the merging PR.
- **Font dependency bump.** A `@fontsource/*` upgrade can shift glyph
  metrics across every snapshot. The diff is uniform sub-pixel noise,
  not structural. Re-record after confirming the bump is the only
  change.
- **`devices["Desktop Chrome"]` upgrade.** A Playwright update can
  bump the bundled Chromium and shift rendering. Re-record only after
  reading the Playwright changelog entry to confirm the shift is
  expected.
- **Real regression.** A CSS edit that lands an unintended z-index or
  colour. The diff localises to one section but the file change
  history shows no edit there — investigate the cascade.
