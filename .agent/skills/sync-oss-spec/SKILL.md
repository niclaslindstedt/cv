---
name: sync-oss-spec
description: "Use when this repo may have drifted out of conformance with OSS_SPEC.md. Runs the bash mirror of the oss-spec validator (no Rust toolchain required), walks the violations, and fixes each one until the validator reports zero violations."
---

# Syncing the repo with OSS_SPEC.md

`OSS_SPEC.md` at the repo root is the specification this project claims
to conform to. Upstream, [niclaslindstedt/oss-spec](https://github.com/niclaslindstedt/oss-spec)
ships the reference Rust binary (`oss-spec validate .`) plus a
language-agnostic bash mirror (`scripts/validate.sh`) that implements
the same deterministic §19 checks and prints the AI quality checklist
as a manual prompt at the end.

This repo is a **consumer** of the spec, not the reference
implementation — there is no local `cargo run -- validate` available,
and this project is a static frontend (Vite + React + TypeScript) with
no Rust toolchain. This skill therefore uses the **nonbinary fallback**
as its primary validator: the bash mirror, fetched on demand via
`curl`. That keeps the skill runnable inside sandboxed agent sessions,
ephemeral CI without a Rust toolchain, and freshly-cloned checkouts
where installing the binary would be too slow.

## Known deviation

`AGENTS.md` records one intentional deviation from the spec: this
project ships a **proprietary `LICENSE`** (all rights reserved) rather
than an SPDX-identified open-source license. The site is a personal
CV, not an OSS library. Treat any §2 finding about the license as
**expected** — do not silently rewrite `LICENSE` to MIT/Apache/etc. If
the validator flags §2, confirm with the user before changing it.

All other spec requirements are followed to the extent applicable for
a frontend static site with no CLI and no LLM calls. CLI-only sections
(§12 in full, §19 structured logging for diagnostic CLI output) do not
apply and any findings tied to those sections can be skipped.

## Tracking mechanism

`.agent/skills/sync-oss-spec/.last-updated` contains the git commit
hash of the last successful run. Empty means "never run" — use the
repo's initial commit (`git rev-list --max-parents=0 HEAD`) as the
baseline.

## Discovery process

1. Read the baseline:

   ```sh
   BASELINE=$(cat .agent/skills/sync-oss-spec/.last-updated)
   BASELINE=${BASELINE:-$(git rev-list --max-parents=0 HEAD)}
   ```

2. Check whether `OSS_SPEC.md` itself changed since the baseline — that
   is the input that can invalidate previously-passing conformance:

   ```sh
   git log --oneline "$BASELINE"..HEAD -- OSS_SPEC.md
   git diff --name-only "$BASELINE"..HEAD
   ```

3. Run the **nonbinary fallback** against this repo. It is the source
   of truth for what is currently out of spec:

   ```sh
   curl -fsSL https://raw.githubusercontent.com/niclaslindstedt/oss-spec/main/scripts/validate.sh | bash -s -- .
   ```

   If the script has been vendored locally at `scripts/validate.sh`,
   prefer that copy:

   ```sh
   ./scripts/validate.sh .
   ```

   Each structural violation names the spec section (e.g. `§7.1`,
   `§10.3`, `§21.5`) and the file or directory at fault. The script
   prints the AI quality checklist as a manual prompt at the end of
   its run — walk that checklist and record any finding worth acting
   on.

4. For each violation, read the relevant section of `OSS_SPEC.md` so
   the fix matches the spec's intent rather than just silencing the
   check.

## Mapping table

| Violation spec section                                                    | Where to fix it                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| §2 missing or non-SPDX `LICENSE`                                          | **Expected deviation** — this repo ships a proprietary `LICENSE`. Confirm with the user before touching it.                                                                                                                                                                                                                                                                                                                                                                                                                               |
| §3 missing `README.md` sections                                           | Edit `README.md`; run `update-readme` afterwards if extensive rewording is needed                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| §4/§5/§6 missing `CONTRIBUTING.md` / `CODE_OF_CONDUCT.md` / `SECURITY.md` | Create the file with the minimum content mandated by the corresponding spec section                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| §7.1 tool-specific guidance file is not a symlink                         | Replace the regular file with `ln -s AGENTS.md <path>` (e.g. `ln -s AGENTS.md CLAUDE.md`, `ln -s ../AGENTS.md .github/copilot-instructions.md`)                                                                                                                                                                                                                                                                                                                                                                                           |
| §8.4 missing `CHANGELOG.md`                                               | Create an empty Keep-a-Changelog-formatted file; do **not** hand-author entries                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| §9 Makefile target missing                                                | Add the missing target to `Makefile` and verify it runs end-to-end. The full target set this repo maintains is documented in `AGENTS.md` § "Build and test commands".                                                                                                                                                                                                                                                                                                                                                                     |
| §10.1/§10.3/§10.4 missing workflow                                        | Create `.github/workflows/<file>.yml`; cross-reference the upstream `templates/_common/.github/workflows/` for the canonical template                                                                                                                                                                                                                                                                                                                                                                                                     |
| §10.3 floating or under-pinned toolchain                                  | Edit the workflow to pin at or above the spec minimums (see upstream `MIN_TOOLCHAIN_VERSIONS` in `src/validate/toolchain.rs`). Node version in `.nvmrc` and `.github/workflows/pages.yml` must stay in sync — see `AGENTS.md` "Documentation sync points".                                                                                                                                                                                                                                                                                |
| §11.1 missing `docs/` content                                             | Create the topic file under `docs/` (this repo currently ships `docs/DESIGN.md` and `docs/SEARCH.md`).                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| §11.2 website drift                                                       | **N/A for this repo** — the deployed site _is_ the built React app; there is no separate `website/` scaffold yet. See `AGENTS.md` § "Website staleness policy". When/if a `website/` directory is added, follow up with `update-website`.                                                                                                                                                                                                                                                                                                 |
| §12 CLI requirements                                                      | **N/A** — there is no CLI in this project. Skip the entire §12 checklist.                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| §13.5 `prompts/<name>/` has no versioned file                             | Add `prompts/<name>/1_0_0.md` with the required YAML front matter (`name`, `description`, `version: 1.0.0`) and `## System` / `## User` sections                                                                                                                                                                                                                                                                                                                                                                                          |
| §15 missing issue / PR templates                                          | Create the templates under `.github/ISSUE_TEMPLATE/` or `.github/PULL_REQUEST_TEMPLATE.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| §19 raw print statement outside the project's output module               | **Largely N/A** — there is no CLI surface. `console.log` calls inside `scripts/*.mjs` are diagnostic-only build tooling, not user-facing output, and are out of scope. Only treat as a violation if a real CLI is added later.                                                                                                                                                                                                                                                                                                            |
| §20 inline test block embedded in production source                       | Move the tests into `tests/<domain>/<name>.test.ts` (this repo's convention) and remove the inline block. Vitest discovers tests via `tests/**/*.test.{ts,mts}` per `vitest.config.ts` — do not scatter tests inside `src/`.                                                                                                                                                                                                                                                                                                              |
| §20.2 test file stem does not end with `_test(s)` / `Test(s)`             | Rename the file so the stem matches the regex `_?[Tt]ests?$`. This repo's `*.test.ts` / `*.test.mts` / `*.tests.ts` convention already matches (stem ends in `.test` or `.tests`); a stray `*.spec.ts` does not and must be renamed.                                                                                                                                                                                                                                                                                                      |
| §20.5 source file exceeds 1000 lines                                      | **Preferred:** split the file by concern into sibling modules / helpers (a `*.tsx` component, a `scripts/*.mjs` generator, a `src/styles/*.css` partial). **Common easy case:** if the file also has a §20 inline-test violation, extracting the test block usually resolves both at once. **Escape hatch:** if the size is genuinely justified (generated code, cohesive state machine, third-party snapshot), add `oss-spec:allow-large-file: <reason>` in any comment within the file's first 20 lines — the reason must be non-empty. |
| §21.2 `.claude/skills` is not a symlink                                   | Replace it with `ln -s ../.agent/skills .claude/skills`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| §21.3 SKILL.md missing front matter fields                                | Add `name:` / `description:` to the front matter                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| §21.4 missing `.last-updated`                                             | Touch the file and record the current `HEAD`: `git rev-parse HEAD > .agent/skills/<skill>/.last-updated`                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| §21.5 missing required `update-*` skill                                   | Create `.agent/skills/<skill>/SKILL.md` (+ `.last-updated`); register it in `.agent/skills/maintenance/SKILL.md` and list it in the `AGENTS.md` "Maintenance skills" section                                                                                                                                                                                                                                                                                                                                                              |
| §21.6 `maintenance` skill registry row missing                            | Add the row in `.agent/skills/maintenance/SKILL.md`, alphabetical within its order slot, with a deterministic run-order number                                                                                                                                                                                                                                                                                                                                                                                                            |

## Update checklist

- Read the baseline from `.last-updated` and diff `OSS_SPEC.md`.

- Run the nonbinary fallback (`curl … | bash -s -- .`, or
  `./scripts/validate.sh .` if vendored) and record every structural
  violation plus every AI checklist item worth acting on.

- Walk the mapping table and fix each violation at its source. Skip
  the known deviations (§2 proprietary license; §12 CLI requirements;
  §19 print statements in non-CLI build tooling) without silencing
  them — note them in the run report so the deviation stays visible.

- If a fix requires a propagation step (e.g. a new mandate in the
  spec needs to land upstream first), hand off to the upstream
  `oss-spec` repo's `update-spec` workflow before re-running this
  skill.

- Re-run the nonbinary fallback — it must exit 0 with zero structural
  violations (or only the known deviations remaining, and those must
  match the list above unchanged).

- Run the per-PR gate locally so the repo is still healthy after the
  edits:
  - `make fmt-check`
  - `make validate`
  - `make lint`
  - `make build`
  - `make test`

- Write the new baseline:

  ```sh
  git rev-parse HEAD > .agent/skills/sync-oss-spec/.last-updated
  ```

## Verification

1. The nonbinary fallback (`./scripts/validate.sh .` or the
   `curl … | bash -s -- .` one-liner) exits 0 and reports the repo
   as conforming — with the only remaining findings being the known
   deviations enumerated above.
2. `make fmt-check`, `make validate`, `make lint`, `make build`, and
   `make test` all pass.
3. Every violation present before this run has a matching edit in the
   diff — no violations were silenced by editing `OSS_SPEC.md` itself
   or pinning to an older mirror.
4. `.agent/skills/sync-oss-spec/.last-updated` was rewritten with the
   current `HEAD`.

## Skill self-improvement

After a run, extend this file:

1. **Grow the mapping table** whenever a new §X.Y section starts
   producing violations the table does not yet cover.
2. **Record fix recipes** (exact commands or edit patterns) for
   violations that required more than a one-line change.
3. **Flag recurring drift** — if the same violation keeps coming
   back, either CI is missing a check or another skill's mapping
   table is missing a row. Fix the upstream cause, not just the
   symptom.
4. **Promote a deviation to a permanent exception** by editing the
   "Known deviation" section above (and the matching note in
   `AGENTS.md` § "OSS_SPEC.md conformance") only when the user has
   explicitly approved making it permanent. Otherwise, surface it
   per-run.
5. **Commit the skill edit** alongside the repo fixes so the
   knowledge compounds.
