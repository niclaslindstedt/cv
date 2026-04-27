.PHONY: install build test lint typecheck fmt fmt-check validate clean dev preview generate og pdf sitemap local

install:
	npm ci

build:
	npm run build

local:
	CV_LOCAL=1 npm run build

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
	npm run validate:print-json

generate:
	npm run generate:data

og:
	npm run generate:og

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
