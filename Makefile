# Gemeinsame Kurzbefehle für dieses Paket (delegiert an Bun).
# Entscheidung: Makefile statt Taskfile — keine zusätzliche Binary nötig, Standard auf CI/Linux.
# Quelle der Wahrheit für Skriptnamen/Optionen: package.json („bun run …“).

.PHONY: install dev build preview check test verify verify-fast lint format clean hooks-help

# Einmalig Hooks aktivieren: make hooks-help
hooks-help:
	@echo 'git config core.hooksPath .githooks   # Repo-Root packager-automate'

install:
	bun install

dev:
	bun run dev

build:
	bun run build

preview:
	bun run preview

check:
	bun run check

test:
	bun run test

verify:
	bun run verify

verify-fast:
	bun run verify:fast

lint:
	bun run lint

format:
	bun run format

clean:
	rm -rf build .svelte-kit
