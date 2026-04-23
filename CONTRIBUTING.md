# Contributing to niclaslindstedt.se

## Prerequisites

- **Node.js** ≥ 24 (see `.nvmrc`)
- **npm** ≥ 10

## Getting the source

```bash
git clone https://github.com/niclaslindstedt/niclaslindstedt.se.git
cd niclaslindstedt.se
make install
```

## Build / test / lint

```bash
make build       # type-check + production build
make test        # run the test suite
make lint        # ESLint + TypeScript type-check
make fmt         # format with Prettier
make fmt-check   # verify formatting without modifying files
```

## Development workflow

1. Fork the repository and clone your fork.
2. Create a branch: `feat/<slug>` or `fix/<slug>`.
3. Make your changes and run `make fmt` and `make lint`.
4. Commit using [Conventional Commits](#commit-message-conventions).
5. Open a pull request against `main`.

## Commit message conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <summary>
```

Allowed types: `feat`, `fix`, `perf`, `docs`, `test`, `refactor`,
`chore`, `ci`, `build`, `style`.

Breaking changes: append `!` to the type (`feat!:`) or add a
`BREAKING CHANGE:` footer.

## Branch naming

| Change type     | Pattern        |
| --------------- | -------------- |
| New feature     | `feat/<slug>`  |
| Bug fix         | `fix/<slug>`   |
| Documentation   | `docs/<slug>`  |
| Chore / tooling | `chore/<slug>` |

## Testing expectations

Tests do not exist yet. When added:

- Files live under `tests/` at the repo root.
- File stems must end with `_test` or `_tests` (see `OSS_SPEC.md` §20.2).
- Wire `make test` to run them and add a `test` step to `ci.yml`.

## Documentation expectations

| If you change …         | Also update …                              |
| ----------------------- | ------------------------------------------ |
| `package.json` scripts  | `Makefile`, `README.md` Usage section      |
| `Makefile` targets      | `README.md` Usage section, `ci.yml`        |
| `src/` top-level layout | `README.md` Structure section, `AGENTS.md` |
| `src/data/cv.ts` types  | Components that consume the changed field  |
| Node version in CI      | `.nvmrc`, `deploy.yml` (keep them in sync) |

## Pull request process

- PR titles must follow Conventional Commits format — the title becomes
  the squash-merge commit on `main`.
- Squash-merge is the only permitted merge strategy.
- At least one review is required before merging.
- CI (`make fmt-check`, `make lint`, `make build`, `make test`) must pass.

## Code of conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md).
Please read it before contributing.

## Security reporting

To report a vulnerability, follow the process in [SECURITY.md](SECURITY.md).

## Governance

This is a personal project. The author has final say on all decisions,
including accepting or rejecting contributions.
