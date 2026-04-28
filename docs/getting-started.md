# Getting Started

This guide walks you through running `niclaslindstedt.se` locally and
covers every developer entry point exposed via `make`.

## Prerequisites

- **Node.js** ≥ 24 — install via [nvm](https://github.com/nvm-sh/nvm):
  ```bash
  nvm install    # reads .nvmrc, installs the pinned version
  nvm use
  ```
- **npm** ≥ 10 (bundled with Node 24)

## Clone and install

```bash
git clone https://github.com/niclaslindstedt/cv.git
cd cv
make install
```

## Start the dev server

```bash
make dev
```

Open `http://localhost:5173` in your browser. The page hot-reloads on
every file change.

## Build for production

```bash
make build
```

Output lands in `dist/`. Preview it locally before deploying:

```bash
make preview
```

## Editing CV content

CV content lives in `src/data/cv.json` (top-level scalars and the
`"{...}"` placeholders) and the per-category files in `src/data/cv/`
(`projects.json`, `experience.json`, `companies.json`,
`skillDetails.json`, …). Shape is enforced by
`schemas/cv.schema.json`; TypeScript types in `src/data/cv.types.ts`
mirror it.

The Vite dev server hot-reloads when any part changes. Prefer the
`update-cv` Claude skill for guided edits and recommendations.

## Local CV override (private PDFs)

The committed CV is the public version that ships to GitHub Pages. For
a private PDF that includes contact details, fuller job descriptions,
or anything else you don't want indexed online, drop a gitignored
override at `src/data/cv.local.json`:

```bash
cp src/data/cv.local.example.json src/data/cv.local.json
$EDITOR src/data/cv.local.json
make local
```

`make local` sets `CV_LOCAL=1` and runs the full build with the
override deep-merged into the assembled CV. Each supported UI language
gets its own PDF at `dist/<base>-<lang>.pdf` (where `<base>` is
`cv.print.pdfFilename` minus its extension) — set `print.pdfFilename`
in your override (e.g. `"cv.local.pdf"`) to keep your private PDFs
(`cv.local-en.pdf` / `cv.local-sv.pdf`) distinct from the public
`cv-en.pdf` / `cv-sv.pdf`.

Merge rules used by `src/data/load-cv.mjs`:

- **Plain objects** — merge key-by-key, override values win.
- **Arrays** — merge element-by-element by index. Use `null` to leave
  a base entry unchanged at that position; entries past the base
  length are appended.
- **Scalars** — override replaces base.

Both `src/data/cv.local.json` and any `*.pdf` are gitignored. Drop the
override file when you want to confirm a clean public build.

## Make targets

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
| `make print-html`         | SSR the print view per UI language to `dist/print-<lang>.html` (run after `vite build`; consumed by `make pdf`)                                                                                                                                                                                                                                 |
| `make pdf`                | Render one PDF per UI language (`dist/cv-en.pdf`, `dist/cv-sv.pdf`) via headless Chromium from `dist/print-<lang>.html` (run after `vite build` + `make print-html`)                                                                                                                                                                            |
| `make sitemap`            | Write `dist/sitemap.xml` (run after `vite build`)                                                                                                                                                                                                                                                                                               |
| `make local`              | Build the site and PDFs with the gitignored `src/data/cv.local.json` override merged in. PDFs are written to `dist/<base>-<lang>.pdf` where `<base>` is `cv.print.pdfFilename` minus its extension (defaults to `cv`, producing `cv-en.pdf` / `cv-sv.pdf`; set the override to e.g. `"cv.local.pdf"` for `cv.local-en.pdf` / `cv.local-sv.pdf`) |
| `make test`               | Run the Vitest suite (schema roundtrip, `load-cv` deep-merge, date utils)                                                                                                                                                                                                                                                                       |
| `make test-coverage`      | Same suite with v8 coverage report                                                                                                                                                                                                                                                                                                              |
| `make test-visual`        | Run Playwright visual-regression tests against committed snapshots in `tests/visual/__screenshots__/` (requires a built `dist/`)                                                                                                                                                                                                                |
| `make test-visual-update` | Re-record the visual snapshots after an intentional UI change                                                                                                                                                                                                                                                                                   |
| `make lighthouse`         | Run Lighthouse CI against `dist/` and assert budgets defined in `.lighthouserc.json` (LCP / CLS / TBT, plus accessibility & SEO category scores)                                                                                                                                                                                                |
| `make clean`              | Remove `dist/` and Vite cache                                                                                                                                                                                                                                                                                                                   |

## Generated artifacts

`src/data/timeline.json`, `src/data/print.json`,
`src/data/github-activity.json`, `src/data/project-stats.json`, and
`src/data/search-index.json` are generated artifacts (gitignored). They
are rebuilt automatically on `npm ci`, `npm run build`, `npm run dev`,
`npm run lint`, and `npm run typecheck`, or on demand via
`make generate`.

The GitHub activity fetch reads from a `GITHUB_TOKEN` env var (needs
`read:user` scope). The per-project stats fetch reads
`PROJECT_STATS_TOKEN` first, falling back to `GITHUB_TOKEN`; reaching
private project repositories requires a PAT with `repo` scope, which
the default workflow `GITHUB_TOKEN` does not have. In CI, set a
`PROJECT_STATS_TOKEN` repository secret to a PAT scoped to the private
project repos. Without a token, the timeline's GitHub track and
per-project commit stats are omitted but the build still succeeds.

## CI / deployment secrets

| Secret                      | Purpose                                                                                                                           |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `PROJECT_STATS_TOKEN`       | PAT with `repo` scope so per-project commit stats can read private repos                                                          |
| `VITE_GOATCOUNTER_ENDPOINT` | GoatCounter pageview endpoint (e.g. `https://niclaslindstedt.goatcounter.com/count`); when unset, no analytics snippet is emitted |

## Analytics setup (one-time)

1. Sign up at [goatcounter.com](https://www.goatcounter.com) and
   register a site (e.g. `niclaslindstedt`).
2. Copy the count endpoint —
   `https://<site-code>.goatcounter.com/count`.
3. Add it as the GitHub repo secret `VITE_GOATCOUNTER_ENDPOINT`.
4. Trigger a deploy (push to `main` or re-run the Pages workflow).
5. Visit the live site once and confirm a pageview lands in the
   GoatCounter dashboard within ~1 minute.

## Search Console

Verification is performed out-of-band (DNS or another mechanism) — no
verification meta tag or HTML file is committed to the repo. Once
verified, submit `https://niclaslindstedt.se/sitemap.xml` to the
property to seed indexing.

## Troubleshooting

**Build fails with TypeScript errors**
Run `make typecheck` for the full error list. If the error points at
`src/data/cv.json`, run `make validate` — schema errors usually give a
clearer message than the structural type mismatch.

**Dev server is slow to start**
Delete the Vite cache: `make clean`, then `make dev`.

**Styles look wrong after a change**
Hard-refresh the browser (`Cmd+Shift+R` / `Ctrl+Shift+R`) to bypass
HMR cache.

**`npm ci` fails**
Delete `node_modules/` manually and re-run `make install`.

**Wrong Node version**
Run `nvm use` in the repo root — `.nvmrc` pins the correct version.

## Next steps

- See [`AGENTS.md`](../AGENTS.md) for the full architecture summary
  and change routing table.
- See [`CONTRIBUTING.md`](../CONTRIBUTING.md) for branch naming, commit
  conventions, and PR guidelines.
- See [`DESIGN.md`](DESIGN.md) for design language and visual patterns.
- See [`SEARCH.md`](SEARCH.md) for the in-page search internals.
