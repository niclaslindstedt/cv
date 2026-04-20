# niclaslindstedt.se

[![CI](https://github.com/niclaslindstedt/niclaslindstedt.se/actions/workflows/ci.yml/badge.svg)](https://github.com/niclaslindstedt/niclaslindstedt.se/actions/workflows/ci.yml)
[![Deploy](https://github.com/niclaslindstedt/niclaslindstedt.se/actions/workflows/pages.yml/badge.svg)](https://github.com/niclaslindstedt/niclaslindstedt.se/actions/workflows/pages.yml)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)

Personal site and CV for Niclas Lindstedt — AI/agentic coding work, built
with Vite, React 18, and TypeScript.

## Why?

- **Single source of truth** — all CV content lives in `src/data/cv.ts`; no CMS, no database.
- **Static output** — deploys as a plain HTML/CSS/JS bundle; no server required.
- **Type-safe content** — TypeScript strict mode ensures every component gets the shape it expects.
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

Edit `src/data/cv.ts` to update content. Changes hot-reload instantly.

## Usage

All developer entry points are exposed via `make`:

| Command          | What it does                            |
| ---------------- | --------------------------------------- |
| `make install`   | `npm ci`                                |
| `make dev`       | Start Vite dev server                   |
| `make build`     | Type-check and produce production build |
| `make preview`   | Preview the production build            |
| `make lint`      | ESLint + TypeScript type-check          |
| `make typecheck` | `tsc -b --noEmit` only                  |
| `make fmt`       | Prettier rewrite in place               |
| `make fmt-check` | Prettier check without writing          |
| `make test`      | Run the test suite                      |
| `make release`   | Cut a new release (CI-managed)          |
| `make clean`     | Remove `dist/` and Vite cache           |

## Configuration

No runtime config file. All content is edited directly in `src/data/cv.ts`.
No environment variables are required for local development.

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
Run `make typecheck` for the full error list. Most errors originate in
`src/data/cv.ts` — verify all required fields match their declared types.

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
