# niclaslindstedt.se

[![CI](https://github.com/niclaslindstedt/cv/actions/workflows/ci.yml/badge.svg)](https://github.com/niclaslindstedt/cv/actions/workflows/ci.yml)
[![Pages](https://github.com/niclaslindstedt/cv/actions/workflows/pages.yml/badge.svg)](https://github.com/niclaslindstedt/cv/actions/workflows/pages.yml)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)

Personal site and CV for Niclas Lindstedt — AI/agentic coding work, built
with Vite, React 18, and TypeScript.

## Why?

- **Single source of truth** — all CV content lives in `src/data/cv.json` (skeleton) and `src/data/cv/*.json` (per-category parts), assembled at build/validate time and validated against `schemas/cv.schema.json`; no CMS, no database.
- **Static output** — deploys as a plain HTML/CSS/JS bundle; no server required.
- **Type-safe content** — TypeScript strict mode and JSON-schema validation both guard the data shape.
- **Fast iteration** — Vite's instant dev server and HMR make local edits visible in milliseconds.
- **Fully automated deploy** — every push to `main` ships to GitHub Pages automatically.

## Prerequisites

- **Node.js** ≥ 24 (see `.nvmrc` — use `nvm use` to activate)
- **npm** ≥ 10 (bundled with Node 24)

## Install

```bash
git clone https://github.com/niclaslindstedt/cv.git
cd cv
make install
```

## Quick start

```bash
make dev    # start Vite dev server at http://localhost:5173
```

Edit content under `src/data/cv/` (one file per category — `focus.json`, `projects.json`, `experience.json`, …) or top-level scalars in `src/data/cv.json` itself. Types live in `src/data/cv.types.ts`. The Vite dev server hot-reloads when any part changes. Prefer the `update-cv` Claude skill for guided edits and recommendations.

## Usage

All developer entry points are exposed via `make`:

| Command                   | What it does                                                                                                                                                                                                                                                                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `make install`            | `npm ci`                                                                                                                                                                                                                                                                                                                                        |
| `make dev`                | Start Vite dev server                                                                                                                                                                                                                                                                                                                           |
| `make build`              | Type-check and produce production build                                                                                                                                                                                                                                                                                                         |
| `make preview`            | Preview the production build                                                                                                                                                                                                                                                                                                                    |
| `make lint`               | ESLint + TypeScript type-check                                                                                                                                                                                                                                                                                                                  |
| `make typecheck`          | `tsc -b --noEmit` only                                                                                                                                                                                                                                                                                                                          |
| `make fmt`                | Prettier rewrite in place                                                                                                                                                                                                                                                                                                                       |
| `make fmt-check`          | Prettier check without writing                                                                                                                                                                                                                                                                                                                  |
| `make validate`           | Validate the assembled CV against `schemas/cv.schema.json`, the skill-tag registry, `src/data/timeline.json` against `schemas/timeline.schema.json`, and `src/data/print.json` against `schemas/print.schema.json`                                                                                                                              |
| `make generate`           | Regenerate `src/data/timeline.json` and `src/data/print.json` from `cv.json`                                                                                                                                                                                                                                                                    |
| `make og`                 | Regenerate `public/og-image.png` from `cv.json`                                                                                                                                                                                                                                                                                                 |
| `make pdf`                | Render one PDF per UI language (`dist/cv-en.pdf`, `dist/cv-sv.pdf`) via headless Chromium (run after `vite build`)                                                                                                                                                                                                                              |
| `make sitemap`            | Write `dist/sitemap.xml` (run after `vite build`)                                                                                                                                                                                                                                                                                               |
| `make local`              | Build the site and PDFs with the gitignored `src/data/cv.local.json` override merged in. PDFs are written to `dist/<base>-<lang>.pdf` where `<base>` is `cv.print.pdfFilename` minus its extension (defaults to `cv`, producing `cv-en.pdf` / `cv-sv.pdf`; set the override to e.g. `"cv.local.pdf"` for `cv.local-en.pdf` / `cv.local-sv.pdf`) |
| `make test`               | Run the Vitest suite (schema roundtrip, `load-cv` deep-merge, date utils)                                                                                                                                                                                                                                                                       |
| `make test-coverage`      | Same suite with v8 coverage report                                                                                                                                                                                                                                                                                                              |
| `make test-visual`        | Run Playwright visual-regression tests against committed snapshots in `tests/visual/__screenshots__/` (requires a built `dist/`)                                                                                                                                                                                                                |
| `make test-visual-update` | Re-record the visual snapshots after an intentional UI change                                                                                                                                                                                                                                                                                   |
| `make lighthouse`         | Run Lighthouse CI against `dist/` and assert budgets defined in `.lighthouserc.json` (LCP / CLS / TBT, plus accessibility & SEO category scores)                                                                                                                                                                                                |
| `make clean`              | Remove `dist/` and Vite cache                                                                                                                                                                                                                                                                                                                   |

`src/data/timeline.json`, `src/data/print.json`,
`src/data/github-activity.json`, and `src/data/project-stats.json` are
generated artifacts (gitignored). They are rebuilt automatically on
`npm ci`, `npm run build`, `npm run dev`, `npm run lint`, and
`npm run typecheck`, or on demand via `make generate`.
The GitHub activity fetch reads from a `GITHUB_TOKEN` env var (needs
`read:user` scope). The per-project stats fetch reads
`PROJECT_STATS_TOKEN` first, falling back to `GITHUB_TOKEN`; reaching
private project repositories requires a PAT with `repo` scope, which the
default workflow `GITHUB_TOKEN` does not have. In CI, set a
`PROJECT_STATS_TOKEN` repository secret to a PAT scoped to the private
project repos. Without a token, the timeline's GitHub track and project
commit stats are omitted but the build still succeeds.

## Structure

```
src/
├── App.tsx              # root component — composes CV sections in order
├── main.tsx             # React 18 entry, mounts <App /> into #root
├── output.ts            # shared console output helpers
├── styles.css           # @import aggregator — see styles/ for partials
├── styles/              # per-domain CSS partials (tokens, hero, projects,
│                        # experience, timeline-vis, modals, print, …)
├── components/          # Hero, Focus, Projects, Experience, Skills,
│                        # Education, Courses, Languages, Timeline,
│                        # CelestialSky, Section, and modals
│                        # (Project, Company, Skill, Focus, Summary,
│                        # ProgramCourses, CourseMoments)
├── data/
│   ├── cv.json          # CV skeleton; "{...}" placeholders point at cv/*.json
│   ├── cv/              # per-category part files (focus, projects, experience, …)
│   ├── cv.ts            # typed wrapper around the assembled CV
│   ├── cv.types.ts      # types mirroring the CV schema
│   ├── load-cv.mjs      # pure-Node assembler used by Vite, scripts, validators
│   └── timeline.types.ts
└── utils/               # date, skills, theme, i18n + LanguageProvider,
                         # glassReflections, useSwipeClose
```

Top-level supporting directories: `schemas/` (JSON schemas), `scripts/`
(timeline generator, validators), `docs/` (contributor guides), and
`.agent/skills/` (Claude maintenance skills, symlinked from
`.claude/skills/`). See [AGENTS.md](AGENTS.md) for architecture rules and
dependency direction.

## Configuration

No runtime config file. CV content is edited in `src/data/cv.json` (top-level
scalars and the `"{...}"` placeholders) and the per-category files in
`src/data/cv/` (shape enforced by `schemas/cv.schema.json`; TypeScript types
in `src/data/cv.types.ts`). No environment variables are required for local
development.

### Local CV override (private PDFs)

The committed CV is the public version that ships to GitHub Pages. For a
private PDF that includes contact details, fuller job descriptions, or
anything else you don't want indexed online, drop a gitignored override
at `src/data/cv.local.json`:

```bash
cp src/data/cv.local.example.json src/data/cv.local.json
$EDITOR src/data/cv.local.json
make local
```

`make local` sets `CV_LOCAL=1` and runs the full build with the override
deep-merged into the assembled CV. Each supported UI language gets its
own PDF at `dist/<base>-<lang>.pdf` (where `<base>` is `cv.print.pdfFilename`
minus its extension) — set `print.pdfFilename` in your override
(e.g. `"cv.local.pdf"`) to keep your private PDFs (`cv.local-en.pdf` /
`cv.local-sv.pdf`) distinct from the public `cv-en.pdf` / `cv-sv.pdf`.

Merge rules used by `src/data/load-cv.mjs`:

- **Plain objects** — merge key-by-key, override values win.
- **Arrays** — merge element-by-element by index. Use `null` to leave a
  base entry unchanged at that position; entries past the base length
  are appended.
- **Scalars** — override replaces base.

Both `src/data/cv.local.json` and any `*.pdf` are gitignored. Drop the
override file when you want to confirm a clean public build.

For CI and deployment the following GitHub secrets are used:

| Secret                      | Purpose                                                                                                                           |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `PROJECT_STATS_TOKEN`       | PAT with `repo` scope so per-project commit stats can read private repos                                                          |
| `VITE_GOATCOUNTER_ENDPOINT` | GoatCounter pageview endpoint (e.g. `https://niclaslindstedt.goatcounter.com/count`); when unset, no analytics snippet is emitted |

## SEO & analytics

The site emits a fully-populated `<head>` (Open Graph, Twitter card,
canonical URL, keywords, `Person` + `WebSite` JSON-LD), a 1200×630 OG
image, a `sitemap.xml`, and a `robots.txt` — all derived from
`src/data/cv.json` at build time by `vite.config.ts` (`cvMetaHtmlPlugin`)
and the helper scripts under `scripts/`. To preview the rendered head
locally, run `make build && make preview` and view source.

**GoatCounter (one-time setup)**

1. Sign up at [goatcounter.com](https://www.goatcounter.com) and
   register a site (e.g. `niclaslindstedt`).
2. Copy the count endpoint —
   `https://<site-code>.goatcounter.com/count`.
3. Add it as the GitHub repo secret `VITE_GOATCOUNTER_ENDPOINT`.
4. Trigger a deploy (push to `main` or re-run the Pages workflow).
5. Visit the live site once and confirm a pageview lands in the
   GoatCounter dashboard within ~1 minute.

**Google Search Console**

Verification is performed out-of-band (DNS or another mechanism) — no
verification meta tag or HTML file is committed to the repo. Once
verified, submit `https://niclaslindstedt.se/sitemap.xml` to the
property to seed indexing.

## Quality gates

Three CI jobs run on every pull request:

- **`ci`** — formatting, schema validation, ESLint + TypeScript, the production
  build, and the Vitest suite (see `tests/`).
- **`visual`** — Playwright visual regression. Spec lives in
  `tests/visual/site.spec.ts`; baselines are committed under
  `tests/visual/__screenshots__/` and were recorded on Linux. Re-record them
  after an intentional UI change with `make test-visual-update` and commit the
  new pixels.
- **`lighthouse`** — `lhci autorun` against the built `dist/`. Assertions live
  in `.lighthouserc.json` and gate Web Vitals (LCP ≤ 2.5 s, CLS ≤ 0.1, TBT ≤
  300 ms) plus accessibility and SEO category scores.

The `visual` and `lighthouse` jobs both consume the `dist/` artifact uploaded
by the `ci` job, so they don't rebuild from source.

## Examples

See the deployed site at
[niclaslindstedt.se](https://niclaslindstedt.se) for the live output.

This project is a website, not a library — there are no runnable code
examples beyond the live site itself.

## Troubleshooting

**Build fails with TypeScript errors**
Run `make typecheck` for the full error list. If the error points at
`src/data/cv.json`, run `make validate` — schema errors usually give a
clearer message than the structural type mismatch.

**Dev server is slow to start**
Delete the Vite cache: `make clean`, then `make dev`.

**Styles look wrong after a change**
Hard-refresh the browser (`Cmd+Shift+R` / `Ctrl+Shift+R`) to bypass HMR cache.

**`npm ci` fails**
Delete `node_modules/` manually and re-run `make install`.

**Wrong Node version**
Run `nvm use` in the repo root — `.nvmrc` pins the correct version.

## Documentation

- [`docs/getting-started.md`](docs/getting-started.md) — step-by-step local setup guide.
- [`docs/DESIGN.md`](docs/DESIGN.md) — design language, components, and patterns (the source of truth for visual changes).
- [`docs/SEARCH.md`](docs/SEARCH.md) — how the in-page search index, ranking model, and aliases work.
- [`AGENTS.md`](AGENTS.md) — architecture summary and guidance for AI coding agents.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for prerequisites, workflow, commit
conventions, and PR guidelines.

## License

See [LICENSE](LICENSE). This is a personal site; all rights reserved.
