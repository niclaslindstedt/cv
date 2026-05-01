.PHONY: install build test test-coverage test-visual test-visual-update test-a11y lighthouse lint typecheck fmt fmt-check validate clean dev preview generate og print-html pdf sitemap local

install:
	npm ci

build:
	npm run build

local:
	CV_LOCAL=1 npm run build

test:
	npm test

test-coverage:
	npm run test:coverage

test-visual:
	npm run test:visual

test-visual-update:
	npm run test:visual:update

test-a11y:
	npm run test:a11y

lighthouse:
	npm run lighthouse

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
	npm run validate:print-json
	npm run validate:search-index-json

generate:
	npm run generate:data

og:
	npm run generate:og

print-html:
	npm run generate:print-html

pdf:
	npm run generate:pdf

sitemap:
	npm run generate:sitemap

dev:
	npm run dev

preview:
	npm run preview

clean:
	rm -rf dist node_modules/.vite
