.PHONY: install build test lint typecheck fmt fmt-check clean dev preview

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

dev:
	npm run dev

preview:
	npm run preview

clean:
	rm -rf dist node_modules/.vite
