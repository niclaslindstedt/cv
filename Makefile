.PHONY: install build test lint typecheck fmt fmt-check validate release clean dev preview generate

install:
	npm ci

build:
	npm run build

test:
	@echo "no tests yet"

lint:
	npm run lint
	npm run typecheck

typecheck:
	npm run typecheck

fmt:
	npm run format

fmt-check:
	npm run format:check

validate:
	npm run validate:cv
	npm run validate:skill-tags
	npm run validate:timeline-json

generate:
	npm run generate:data

dev:
	npm run dev

preview:
	npm run preview

release:
	@echo "Releases are managed by CI via .github/workflows/version-bump.yml."
	@echo "Break-glass: bash scripts/release.sh [auto|patch|minor|major]"

clean:
	rm -rf dist node_modules/.vite
