# niclaslindstedt.se

Personal site — CV and portfolio of AI/agentic coding work.

Built with Vite + React 18 + TypeScript, deployed as a static site to
GitHub Pages.

## Prerequisites

- Node.js 22 (matches `.github/workflows/ci.yml`)
- npm

## Scripts

Prefer the `make` targets — CI uses them, so local and CI stay in sync.

| Command          | What it does                              |
| ---------------- | ----------------------------------------- |
| `make install`   | `npm ci`                                  |
| `make dev`       | Start the Vite dev server                 |
| `make build`     | Type-check and produce a production build |
| `make preview`   | Preview the production build              |
| `make lint`      | ESLint + `tsc -b --noEmit`                |
| `make typecheck` | `tsc -b --noEmit` only                    |
| `make fmt`       | Prettier rewrite in place                 |
| `make fmt-check` | Prettier check without writing            |
| `make test`      | Placeholder — no tests yet                |
| `make clean`     | Remove `dist/` and the Vite cache         |

The underlying `npm` scripts (`dev`, `build`, `preview`, `lint`,
`typecheck`, `format`, `format:check`) are defined in `package.json`.

## Structure

```
src/
├── App.tsx          # root component — composes sections in order
├── main.tsx         # React 18 entry, mounts <App /> into #root
├── styles.css       # global CSS
├── components/      # Hero, Focus, Projects, Experience, Education,
│                    # Skills, plus a generic <Section /> wrapper
├── data/cv.ts       # all CV content + TypeScript types
└── utils/date.ts    # date helpers used by Experience / Education
```

## CI and deployment

- `.github/workflows/ci.yml` runs `make fmt-check`, `make lint`, and
  `make build` on every push and pull request.
- `.github/workflows/deploy.yml` builds and publishes to GitHub Pages on
  pushes to `main`.

## Contributing

- `AGENTS.md` is the single source of truth for agent / contributor
  guidance (architecture, conventions, where new code goes).
  `CLAUDE.md` is a symlink to it.
- `OSS_SPEC.md` documents the OSS repo spec this project tracks.
  Conformance is incremental — see the note at the bottom of
  `AGENTS.md`.

## License

Proprietary — see `LICENSE`. The source is published for portfolio
purposes and is not open-source.
