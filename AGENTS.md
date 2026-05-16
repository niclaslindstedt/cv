# AGENTS.md

Guidance for AI coding agents working on this repository. This file is
the single source of truth for agent guidance — tool-specific guidance
files (e.g. `CLAUDE.md`) are symlinks pointing here (see
`OSS_SPEC.md` §7.1).

## What this project is

`niclaslindstedt.se` — a personal site / CV built with Vite, React 18,
and TypeScript. The built output is a static site deployed to GitHub
Pages via `.github/workflows/pages.yml`. There is no backend and no
CLI; tests live under `tests/` (Vitest + Playwright).

## Build and test commands

Prefer `make` targets over raw `npm run` commands so local and CI stay
in sync:

| Command                   | What it does                                                                                                                                                                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `make install`            | `npm ci`                                                                                                                                                                                                                                                                              |
| `make dev`                | Start Vite dev server                                                                                                                                                                                                                                                                 |
| `make build`              | Type-check and produce production build                                                                                                                                                                                                                                               |
| `make preview`            | Preview the production build                                                                                                                                                                                                                                                          |
| `make lint`               | ESLint + TypeScript type-check                                                                                                                                                                                                                                                        |
| `make typecheck`          | `tsc -b --noEmit` only                                                                                                                                                                                                                                                                |
| `make fmt`                | Prettier rewrite in place                                                                                                                                                                                                                                                             |
| `make fmt-check`          | Prettier check without writing                                                                                                                                                                                                                                                        |
| `make validate`           | Assemble `src/data/cv.json` + `src/data/cv/*.json` and validate against `schemas/cv.schema.json`                                                                                                                                                                                      |
| `make local`              | Build with `CV_LOCAL=1` so the gitignored `src/data/cv.local.json` override is merged in                                                                                                                                                                                              |
| `make test`               | Vitest suite — schema roundtrip, `load-cv` deep-merge, `utils/date`                                                                                                                                                                                                                   |
| `make test-coverage`      | Vitest with v8 coverage                                                                                                                                                                                                                                                               |
| `make test-visual`        | Playwright visual regression vs. baselines in `tests/visual/__screenshots__/`                                                                                                                                                                                                         |
| `make test-visual-update` | Re-record visual baselines after an intentional UI change                                                                                                                                                                                                                             |
| `make test-a11y`          | Playwright + axe-core WCAG 2.2 AA scan of the built site, plus an advisory AAA pass that logs but never fails (`playwright.a11y.config.ts`)                                                                                                                                           |
| `make test-a11y-manual`   | Local-only Playwright suite encoding the WCAG checks axe can't express — reflow at 320 CSS px (1.4.10), resize-text at 200% (1.4.4), focus-not-obscured (2.4.11). Driven by `playwright.a11y-manual.config.ts`. Not gated in CI; run before launches and after big UI overhauls.      |
| `make test-pa11y`         | pa11y-ci (HTML CodeSniffer) WCAG 2.2 AAA scan against the preview server. Slow; run locally before launches or via the daily `Accessibility (deep)` workflow. Set `PA11Y_ADVISORY=1` to log without failing.                                                                          |
| `make lighthouse`         | `lhci autorun` against `dist/`; budgets in `.lighthouserc.json`                                                                                                                                                                                                                       |
| `make check-seo`          | Walks every user-facing HTML file under `dist/` and asserts the §11.3.10 structural SEO invariants (per-route `<title>` + meta description + canonical, single `<h1>`, heading hierarchy, og:image resolves, sitemap completeness, robots/llms.txt presence). Run after `make build`. |
| `make clean`              | Remove `dist/` and Vite cache                                                                                                                                                                                                                                                         |

CI is split into independent workflows. The per-PR ones each carry a
one-word status badge and run on every push and pull request; the
scheduled ones run on cron and are advisory:

- **CI** (`.github/workflows/ci.yml`) — `make fmt-check`, `make validate`,
  `make lint`, `make build`, `make test`.
- **Visual** (`.github/workflows/visual.yml`) — `make build`, then
  `make test-visual` (Playwright on Chromium, desktop + mobile viewports).
- **Accessibility** (`.github/workflows/a11y.yml`) — `make build`, then
  `make test-a11y` (Playwright + axe-core, Chromium desktop + mobile,
  both languages and themes). Fails on any WCAG 2.0 / 2.1 / 2.2 Level A
  or AA violation. A second AAA pass (`wcag2aaa` / `wcag21aaa` /
  `wcag22aaa`) runs alongside as advisory only — its findings are
  printed to the workflow log and attached to the test report, but do
  not fail the build, so the badge stays green when AA passes.
- **Accessibility (deep)** (`.github/workflows/a11y-deep.yml`) — runs
  `make test-pa11y` (pa11y-ci / HTML CodeSniffer at WCAG 2.2 AAA)
  against the homepage in both languages plus the print views. Uses a
  different rule engine from axe-core, so it surfaces findings the
  per-PR job misses — a "second opinion" on conformance. Scheduled
  daily at 06:00 UTC and manually dispatchable; never runs on push or
  PR. Always advisory (`continue-on-error: true` + the runner exits 0
  with `PA11Y_ADVISORY=1`).
- **Lighthouse** (`.github/workflows/lighthouse.yml`) — `make build`,
  then `make lighthouse` to assert Web-Vitals + category-score budgets.
- **SEO** (`.github/workflows/seo.yml`) — `make build`, then
  `make check-seo` (Node script under `scripts/check-seo.mjs`) to
  enforce the §11.3.10 structural SEO invariants per page in `dist/`.
  Fails on any violation; emits `::error::` annotations on the
  offending file.
- **Dependabot** (`.github/workflows/dependabot.yml`) — fails when any
  Dependabot PR is open so the README badge turns red until the queue is
  cleared. Re-runs hourly via cron and on every push to `main`; does not
  run on individual pull requests so it never adds a failing check to
  unrelated PRs.

Deployment runs separately in **Pages** (`.github/workflows/pages.yml`)
on every push to `main`.

## Architecture summary

```
src/
├── App.tsx             # root component — composes sections in order
├── main.tsx            # React 18 entry, mounts <App /> into #root
├── styles.css          # global CSS — thin @import aggregator for ./styles/*.css
├── styles/             # per-domain CSS partials (tokens, hero, projects,
│                         experience, timeline-vis, modals, print, …)
├── components/         # one file per section (Hero, Focus, Projects, …)
│                         plus a generic <Section /> wrapper
├── data/cv.json        # CV skeleton — top-level "category" keys hold the
│                         literal sentinel "{...}" and are expanded from
│                         data/cv/<key>.json at build/validate time.
├── data/cv/*.json      # per-category content (focus, projects, companies,
│                         experience, education, courses, skills,
│                         skillDetails, languages, meta).
├── data/load-cv.mjs    # assembles cv.json + cv/*.json. Used by Vite, scripts,
│                         and the schema validator.
├── data/cv.ts          # typed wrapper around cv.json (post-assembly).
├── data/cv.types.ts    # TypeScript types mirroring the schema
├── data/timeline.types.ts # types for generated timeline.json
└── utils/date.ts       # date helpers used by Experience / Education
```

Dependency direction: `App.tsx` imports the assembled CV from
`data/cv` (which re-exports `data/cv.json` after the `cv-assembly`
Vite plugin expands the `{...}` placeholders). Components consume
`data/cv.types.ts` and `utils/date.ts`. Nothing in `data/` or `utils/`
imports from `components/`. Keep it that way.

## Where new code goes

| Change                                            | Location                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| New CV section (e.g. Talks, Awards)               | `src/components/<Name>.tsx` + slot into `src/App.tsx`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| New field on existing section                     | Extend `schemas/cv.schema.json` and `src/data/cv.types.ts`, then the component                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Content-only edits (roles, projects, skills)      | `src/data/cv/<category>.json` (focus, projects, companies, …) — prefer the `update-cv` skill. Top-level scalar fields stay in `src/data/cv.json`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Date formatting / parsing                         | `src/utils/date.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Global styles, layout, typography                 | `src/styles/<domain>.css` (e.g. `hero.css`, `projects.css`, `print.css`); `src/styles.css` only `@import`s them                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Timeline tracks, layout, zoom behaviour           | `scripts/generate-timeline.mjs` + `src/components/Timeline.tsx`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Print / PDF rendering                             | `scripts/generate-print.mjs` bakes `src/data/print.json` (incl. `settings` from `cv.print` / `src/data/cv/print.json`); `src/components/PrintView.tsx` renders it and emits an inline `<style>` for `@page` + CSS variables; `src/styles/print.css` consumes those variables; `scripts/generate-print-html.mjs` SSRs PrintView per language into `dist/print-<lang>.html` so generate-pdf can skip booting the SPA                                                                                                                                                                                                                               |
| Print font, sizes, margins, page-break rules      | `src/data/cv/print.json` — see `docs/DESIGN.md` §6.1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Per-entry print copy (project / job / assignment) | `printDescription` field on `projects[]`, `experience[]`, `experience[].assignments[]` in `src/data/cv/*.json` — see `update-cv` skill ("Print descriptions"). Falls back to the company/client/project `tagline` when omitted.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| GitHub commit activity fetch                      | `scripts/generate-github-activity.mjs`. Builds and CI restore the cached JSON from the `data-cache` branch instead of calling the API; the daily `data-refresh.yml` workflow is the sole writer. Pass `--full` (or `FULL_REFRESH=1`) to bypass incremental cache reuse.                                                                                                                                                                                                                                                                                                                                                                          |
| Per-project repo commit stats fetch               | `scripts/generate-project-stats.mjs` (uses `PROJECT_STATS_TOKEN` if set, else `GITHUB_TOKEN`; needs `repo` scope to read private project repos). Same data-cache flow as activity; per-repo head-SHA check skips repos whose HEAD hasn't changed since the cached snapshot.                                                                                                                                                                                                                                                                                                                                                                      |
| GitHub-derived data cache                         | `data-cache` orphan branch holds the latest `src/data/github-activity.json` + `src/data/project-stats.json`. Refreshed daily by `.github/workflows/data-refresh.yml` (the sole API caller); consumed by `pages.yml` and `ci.yml` as a pre-`npm ci` step. Deploys never call the GraphQL API. Trigger `data-refresh.yml` via `workflow_dispatch` with `full=true` to force a clean backfill.                                                                                                                                                                                                                                                      |
| `<head>` meta, OG, Twitter, JSON-LD               | `vite.config.ts` (`cvMetaHtmlPlugin`) — derived from `cv.meta` + `cv.links` + `cv.skills` + `cv.education`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Social-share OG image                             | `scripts/generate-og-image.mjs` (satori → `public/og-image.png`); runs in `prebuild`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Downloadable PDF resume                           | `scripts/generate-pdf.mjs` (puppeteer → `dist/<cv.print.pdfFilename ?? "cv.pdf">`); loads `dist/print-<lang>.html` (no SPA boot); runs as part of `npm run build` after `vite build` and `generate:print-html`                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Local CV override (private contact / copy)        | `src/data/cv.local.json` (gitignored, deep-merged by `src/data/load-cv.mjs` when `CV_LOCAL=1`); see `cv.local.example.json` for the starter shape. Drives `make local`. The `update-cv` skill must keep sensitive content out of `src/data/cv*.json` and route it here.                                                                                                                                                                                                                                                                                                                                                                          |
| Local facts scratch pad (agent context only)      | `src/data/facts.local.json` (gitignored, free-form JSON, no schema). Read by the `update-cv` and `update-company-descriptions` skills as background context — internal scope, real metrics, NDA boundaries, voice preferences, "what I actually did" notes — to ground descriptions and avoid hallucination. Never bundled, never rendered, never committed. See `facts.local.example.json` for a starter shape.                                                                                                                                                                                                                                 |
| Sitemap                                           | `scripts/generate-sitemap.mjs` (writes `dist/sitemap.xml` post-build, lists `/`, `/timeline`, `/resume.json`, `/cv.json`, and `/llms.txt`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Standalone `/timeline` page                       | `scripts/generate-timeline-html.mjs` writes `dist/timeline.html` (a copy of `dist/index.html` with canonical, title, description, OG/Twitter tags retargeted to the timeline view) so direct hits to `/timeline` get a 200 on GitHub Pages instead of falling through to `public/404.html` (which carries `noindex`). The SPA still owns rendering — the static file just gives crawlers something indexable.                                                                                                                                                                                                                                    |
| Machine-readable résumé (`/resume.json`)          | `scripts/generate-resume-json.mjs` writes the fully assembled CV to `dist/resume.json` post-build so agents can fetch the structured source instead of scraping HTML, plus a byte-identical `dist/cv.json` alias for the path LLMs commonly guess. Discoverable via `public/robots.txt`, the sitemap entry, and `<link rel="alternate" type="application/json">` tags injected by `cvMetaHtmlPlugin` in `vite.config.ts`. Respects `CV_LOCAL=1`, so the public deploy never includes private content.                                                                                                                                            |
| LLM index (`/llms.txt`)                           | `scripts/generate-llms-txt.mjs` writes `dist/llms.txt` post-build, following the [llmstxt.org](https://llmstxt.org/) convention: a small markdown index pointing LLMs at `/resume.json` plus a baked-in summary of the experience and side-projects so an agent that only reads this one file can still answer high-level questions. Discoverable via `public/robots.txt`, the sitemap entry, and `<link rel="alternate" type="text/markdown">` injected by `cvMetaHtmlPlugin`. Respects `CV_LOCAL=1`.                                                                                                                                           |
| Search trigger / modal / ranker                   | Trigger button is part of `src/components/FloatingControls.tsx` + `src/styles/floating-controls.css`; modal in `src/components/SearchModal.tsx` + `src/styles/search.css`; ranker + fuzzy logic in `src/utils/search.ts` (no third-party search dep). Index baked by `scripts/generate-search-index.mjs` into gitignored `src/data/search-index.json` (schema `schemas/search-index.schema.json`). Hidden alternative names (`aliases` arrays) live on the source records under `skillDetails`, `projects`, `companies`, `focus`, `education`, `courses`, `experience`, and `assignments`. Full reference in [`docs/SEARCH.md`](docs/SEARCH.md). |
| `robots.txt`, `404.html`                          | Static files in `public/`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Analytics (GoatCounter)                           | Snippet injected by `cvMetaHtmlPlugin` only when `VITE_GOATCOUNTER_ENDPOINT` env var is set at build time                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

## Conventions

- **TypeScript strict mode is on** (`tsconfig.app.json`: `strict`,
  `noUnusedLocals`, `noUnusedParameters`). Don't disable these.
- **React function components only**, named exports, prop types declared
  inline as a `type Props = { … }`.
- **Prettier** (`.prettierrc.json`) owns formatting — double quotes,
  semicolons, trailing commas, 80-column width. Run `make fmt` before
  pushing.
- **Imports**: relative paths (no path aliases configured). External
  packages first, then relative, separated by a blank line.
- **Commit style**: conventional commits (`feat:`, `fix:`, `chore:`, …)
  per `OSS_SPEC.md` §8.1.
- **PR conventions**: PR titles must follow Conventional Commits format
  because the title becomes the squash-merge commit on `main`. Individual
  in-branch commits are not changelog-relevant. Squash-merge is the only
  permitted merge strategy. **Always rebase the branch on the latest
  `main` before opening a pull request** so the PR diff is clean and
  CI runs against the current trunk:
  `git fetch origin main && git rebase origin/main`.
- **Visual changes** (anything affecting CSS, layout, color, type,
  spacing, motion, or component shape) must conform to
  [`docs/DESIGN.md`](docs/DESIGN.md). Read the relevant section
  before changing styles. If the change introduces a pattern not yet
  described there, **update `docs/DESIGN.md` first in the same PR**.
  PR descriptions for visual changes should reference the section(s)
  they conform to.
- **Visual snapshots.** Any change that alters rendered pixels — text
  in a snapshotted view, styles, layout, fonts, component shape —
  needs the affected baselines re-recorded in the same branch. See
  `.claude/rules/visual-snapshots.md` for the workflow. Run it
  proactively; don't wait for CI to flag the drift.
- **Bilingual copy (`en` / `sv`).** User-visible strings in
  `src/data/cv.json` and `src/data/cv/*.json` are
  `{ "en": "...", "sv": "..." }` pairs. Both must convey the same
  thing at the same level of polish. **Do not translate technical
  terms into Swedish** — Swedish developers use the English term in
  conversation, so the English token stays verbatim inside the
  Swedish sentence (`events`, not `händelser`; `lifecycle events`,
  not `livscykelhändelser`; `pull request`, `commit`, `prompt`,
  `guardrails`, `edge cases`, `rate limit`, `vibe coding`, etc.).
  Ordinary words that happen to appear in technical sentences
  (`tjänst`, `databas`, `körning`, `nätverk`, `arbetsflöde`) do
  translate cleanly. The `update-cv` skill has the longer rationale
  and term list under "Bilingual copy (`en` / `sv`)".

## Path-scoped rules

Detailed guidance for specific areas of the codebase lives in
`.claude/rules/*.md`, each scoped via `paths:` frontmatter. Claude
Code auto-loads a rule file when it reads a file matching the rule's
`paths:` glob, so the always-loaded `AGENTS.md` stays small. Other
agents (which only read `AGENTS.md`) should consult the matching rule
file directly when working in the listed area — the content is
authoritative and not duplicated here.

| Rule file                           | Read when working on …                                                                                            |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `.claude/rules/visual-snapshots.md` | UI-touching files: `src/styles/**`, `src/components/**`, `src/data/cv.json`, `src/data/cv/**`, `tests/visual/**`. |
| `.claude/rules/tests.md`            | `tests/**`, `vitest.config.ts`, any `playwright*.config.ts`.                                                      |

When you add a new rule file, list it here so non-Claude agents can
find it.

## Documentation sync points

When you change X, update Y:

| If you change …                                     | Also update …                                                                                              |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `package.json` scripts                              | `Makefile`, `README.md` Scripts section                                                                    |
| `Makefile` targets                                  | `README.md` Scripts section, `.github/workflows/ci.yml`                                                    |
| Visual snapshots in `tests/visual/__screenshots__/` | Same PR — re-record only when the UI intentionally changed                                                 |
| Lighthouse budgets in `.lighthouserc.json`          | Mention in `README.md` Quality gates section                                                               |
| `src/` top-level layout                             | `README.md` Structure section                                                                              |
| `schemas/cv.schema.json`                            | `src/data/cv.types.ts` + any component consuming the changed field                                         |
| `src/data/cv.types.ts`                              | `schemas/cv.schema.json` + any component consuming the changed field                                       |
| `schemas/timeline.schema.json`                      | `src/data/timeline.types.ts` + `scripts/generate-timeline.mjs`                                             |
| `schemas/print.schema.json`                         | `src/data/print.types.ts` + `scripts/generate-print.mjs` + `PrintView` + `scripts/generate-print-html.mjs` |
| `schemas/search-index.schema.json`                  | `src/data/search-index.types.ts` + `scripts/generate-search-index.mjs` + `src/utils/search.ts`             |
| `cv.meta` (website / seo)                           | `vite.config.ts` `cvMetaHtmlPlugin` reads these directly                                                   |
| Node version in CI                                  | `.nvmrc`, `.github/workflows/pages.yml` (keep in sync)                                                     |
| `src/styles/tokens.css` or any new visual pattern   | `docs/DESIGN.md` (in the **same** PR)                                                                      |

## Test conventions

Tests live under `tests/` at the repo root (`OSS_SPEC.md` §20.3),
split into per-domain subdirectories: `data/`, `unit/`, `visual/`,
`a11y/`, `a11y-manual/`. All test files end in `.test.ts` /
`.test.mts` / `.tests.ts` per `OSS_SPEC.md` §20.2 (regex
`_?[Tt]ests?$` on the stem). Vitest picks them up via
`vitest.config.ts`; Playwright suites under `tests/visual/`,
`tests/a11y/`, and `tests/a11y-manual/` are excluded from the
Vitest `include` so Playwright owns them. Don't import test code
from `src/`. When adding a new top-level test domain, extend
`vitest.config.ts` `include` rather than scattering discovery
across multiple configs.

See `.claude/rules/tests.md` for the per-domain breakdown (what
each suite covers, how it runs, what gates CI).

## Debugging PDF prints

Agents can't open PDFs directly, but they can render the generated
`dist/cv-<lang>.pdf` to JPEG and read it back as an image to verify
layout, page-break behaviour, header position, and other print-only
visuals.

Tooling: `pdftoppm` (poppler) is preinstalled on the dev machine.
`pdfinfo` (also poppler) shows page count + Info-dict metadata.

Round-trip:

1. Refresh the PDF. **Always go through Vite when CSS changed**, or
   the print HTML will reference a stale hashed bundle and the PDF
   will look unchanged:
   - **CSS or component changes** (almost always the case when
     debugging visuals): `make build` (public) or `make local`
     (with `cv.local.json` merged in). These run `vite build` so
     `dist/assets/index-*.css` and the `<link href>` in
     `dist/print-<lang>.html` get a fresh hash.
   - **Data-only changes** (you only edited
     `src/data/cv/*.json` and not styles): the cheaper
     `npm run generate:print && npm run generate:print-html && npm run generate:pdf`
     loop is fine — no CSS rebuild needed. Prefix with `CV_LOCAL=1`
     to merge the local override.
   - When in doubt, use `make local`. It's slower but never
     leaves you debugging stale CSS.
2. Render to JPEG into a scratch dir:
   `pdftoppm -jpeg -r 110 dist/cv-en.pdf /tmp/cv-debug/page`
   Flags: `-r 110` is enough resolution to read body text; bump to
   `-r 150` for fine spacing checks. Add `-f 1 -l 1` to render only
   page 1 (faster, smaller payload). Output is
   `/tmp/cv-debug/page-1.jpg`, `page-2.jpg`, …
3. Read the rendered page back via the `Read` tool — the
   harness renders the JPEG as a visible image so layout can
   actually be inspected.
4. Inspect Info-dict metadata (Title, Author, Creator/Producer,
   CreationDate) with `pdfinfo dist/cv-en.pdf`.

Sanity check after a CSS edit: `grep -o "<class>{[^}]*}" dist/assets/index-*.css`
should show the new declarations. If it doesn't, you skipped Vite —
re-run `make local`.

Anything print-only — `src/components/PrintView.tsx`,
`src/styles/print.css`, `scripts/generate-print.mjs`,
`scripts/generate-print-html.mjs`, `src/data/cv/print.json` —
should be verified through this round-trip before claiming a fix
landed. Visual snapshots (`tests/visual/__screenshots__/`) only
cover the SPA, not the PDF.

## Maintenance skills

The repo ships Claude skills under `.agent/skills/` (with
`.claude/skills` symlinked to it — `OSS_SPEC.md` §21.2). Each skill is
self-describing via its frontmatter; Claude lists them automatically.
The high-level shape: `update-*` skills (`update-cv`,
`update-company-descriptions`, `update-summary`, `update-readme`,
`update-docs`) mutate drift-prone artifacts; `sync-*` skills
(`sync-design`, `sync-cross-browser`, `sync-oss-spec`) audit and
propose patches; `debug-visual` and `verify-wcag` handle their named
workflows; `maintenance` is the umbrella that routes through every
`update-*` and `sync-*` in order. `sync-oss-spec` in particular is the
residual-drift sweep against `OSS_SPEC.md` itself — it runs the
upstream nonbinary validator and fixes whatever structural conformance
gaps the per-artifact skills did not touch (`OSS_SPEC.md` §21.5).

Invoke `maintenance` when you've landed a batch of changes and want a
single pass that brings everything back in sync. Invoke a specific
skill when you know which artifact is stale.

## Website staleness policy

This project does not yet ship a dedicated `website/` directory with a
source-extraction script (see `OSS_SPEC.md` §11.2). The deployed site
**is** the built React app. When a `website/` scaffold is added, it must
be regenerated whenever source-derived content changes; the `pages.yml`
workflow must chain the extraction step before the build step so that
the deployed site always reflects the latest released version.

## OSS_SPEC.md conformance

`OSS_SPEC.md` lives at the repo root for reference. The project follows
it to the extent applicable for a frontend static site with no CLI and
no LLM calls. The known, intentional deviations are:

- **§2 proprietary license.** The repo ships a proprietary `LICENSE`
  (all rights reserved) rather than an SPDX-identified open-source
  license. It is a personal site, not an OSS library.
- **§8.4 CHANGELOG.md, §10.3 release pipeline.** The site deploys to
  GitHub Pages on every push to `main` (see `.github/workflows/pages.yml`)
  and does not publish versioned artifacts — there are no `v*` tags,
  no semver bumps, and no package registry to publish to. The §8.4
  CHANGELOG.md, §10.3 `version-bump.yml`, and §10.3 `release.yml`
  workflows therefore do not apply. The `sync-oss-spec` skill knows
  these are expected and lists them under "Known deviation".
- **§12 CLI requirements.** There is no CLI in this project; the entire
  §12 checklist is skipped.
- **§19 logging in non-CLI build tooling.** The `console.log` calls
  inside `scripts/*.mjs` are diagnostic-only build output, not a
  user-facing CLI surface; §19's structured-logging mandate does not
  apply.

All other spec requirements are followed.
