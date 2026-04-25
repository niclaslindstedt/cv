# niclaslindstedt.se

[![CI](https://github.com/niclaslindstedt/niclaslindstedt.se/actions/workflows/ci.yml/badge.svg)](https://github.com/niclaslindstedt/niclaslindstedt.se/actions/workflows/ci.yml)
[![Pages](https://github.com/niclaslindstedt/niclaslindstedt.se/actions/workflows/pages.yml/badge.svg)](https://github.com/niclaslindstedt/niclaslindstedt.se/actions/workflows/pages.yml)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)

Personal site and CV for Niclas Lindstedt — AI/agentic coding work, built
with Vite, React 18, and TypeScript.

## Why?

- **Single source of truth** — all CV content lives in `src/data/cv.json`, validated against `schemas/cv.schema.json`; no CMS, no database.
- **Static output** — deploys as a plain HTML/CSS/JS bundle; no server required.
- **Type-safe content** — TypeScript strict mode and JSON-schema validation both guard the data shape.
- **Fast iteration** — Vite's instant dev server and HMR make local edits visible in milliseconds.
- **Fully automated deploy** — every push to `main` ships to GitHub Pages automatically.

## Prerequisites

- **Node.js** ≥ 24 (see `.nvmrc` — use `nvm use` to activate)
- **npm** ≥ 10 (bundled with Node 24)

## Install

```bash
git clone https://github.com/niclaslindstedt/niclaslindstedt.se.git
cd niclaslindstedt.se
make install
```

## Quick start

```bash
make dev    # start Vite dev server at http://localhost:5173
```

Edit `src/data/cv.json` to update content (types live in `src/data/cv.types.ts`). Changes hot-reload instantly. Prefer the `update-cv` Claude skill for guided edits and recommendations.

## Usage

All developer entry points are exposed via `make`:

| Command          | What it does                                                 |
| ---------------- | ------------------------------------------------------------ |
| `make install`   | `npm ci`                                                     |
| `make dev`       | Start Vite dev server                                        |
| `make build`     | Type-check and produce production build                      |
| `make preview`   | Preview the production build                                 |
| `make lint`      | ESLint + TypeScript type-check                               |
| `make typecheck` | `tsc -b --noEmit` only                                       |
| `make fmt`       | Prettier rewrite in place                                    |
| `make fmt-check` | Prettier check without writing                               |
| `make validate`  | Validate `src/data/cv.json` against `schemas/cv.schema.json` |
| `make generate`  | Regenerate `src/data/timeline.json` from `cv.json`           |
| `make test`      | Run the test suite                                           |
| `make release`   | Cut a new release (CI-managed)                               |
| `make clean`     | Remove `dist/` and Vite cache                                |

`src/data/timeline.json`, `src/data/github-activity.json`, and
`src/data/project-stats.json` are generated artifacts (gitignored). They
are rebuilt automatically on `npm ci`, `npm run build`, `npm run dev`,
`npm run lint`, and `npm run typecheck`, or on demand via `make generate`.
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
├── styles.css           # global CSS (includes print-optimised CV styles)
├── components/          # Hero, Focus, Projects, Experience, Skills,
│                        # Education, Timeline, SkillModal, Section
├── data/
│   ├── cv.json          # CV content (validated against schemas/cv.schema.json)
│   ├── cv.types.ts      # types mirroring the CV schema
│   └── timeline.types.ts
└── utils/               # date, skills, and theme helpers
```

Top-level supporting directories: `schemas/` (JSON schemas), `scripts/`
(timeline generator, release helpers, validators), `docs/` (contributor
guides), and `.agent/skills/` (Claude maintenance skills, symlinked from
`.claude/skills/`). See [AGENTS.md](AGENTS.md) for architecture rules and
dependency direction.

## Configuration

No runtime config file. All content is edited directly in `src/data/cv.json`
(shape enforced by `schemas/cv.schema.json`; TypeScript types in
`src/data/cv.types.ts`). No environment variables are required for local
development.

For CI and deployment the following GitHub secret must be set:

| Secret          | Purpose                                    |
| --------------- | ------------------------------------------ |
| `RELEASE_TOKEN` | PAT with write access for release pipeline |

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
- [`AGENTS.md`](AGENTS.md) — architecture summary and guidance for AI coding agents.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for prerequisites, workflow, commit
conventions, and PR guidelines.

## License

See [LICENSE](LICENSE). This is a personal site; all rights reserved.
