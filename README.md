# PackForge

**PackForge** ist eine interne Webanwendung zum Erstellen und Betreiben von **PowerShell App Deployment Toolkit (PSADT)**-Paketen: Stammdaten, Vorlagen, Skripte und Exporte laufen in einer gemeinsamen Oberfläche mit **Software-Bibliothek** — weniger Wechsel zwischen Shares, Editoren und Einzelscripts.

|               |                                                                                                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stack**     | [SvelteKit 2](https://kit.svelte.dev), [Svelte 5](https://svelte.dev) (Runes), [Vite](https://vitejs.dev), [Tailwind CSS 4](https://tailwindcss.com), [SQLite](https://www.sqlite.org/) über **`bun:sqlite`** |
| **Runtime**   | [Bun](https://bun.sh) ≥ 1.1 (Dev **und** Produktion — der Server nutzt den Bun-SQLite-Treiber)                                                                                                                |
| **Paketname** | `packforge` (`package.json`) · Anzeigename in der UI: `$lib/app/brand.ts`                                                                                                                                     |

**Öffentliche Produktions-URL:** [https://packforge.ileies.de](https://packforge.ileies.de) — kanonische Domain und MSAL-Redirect-Fallback stehen in `$lib/app/brand.ts` (`PRODUCT_PUBLIC_ORIGIN`); Entra muss dieselbe Redirect-URI (`…/login`) verwenden.

---

## Was die App leistet

- **Software-Bibliothek** — angelegte Pakete listen, als PSADT-ZIP exportieren, verwalten.
- **Script Maker / Script-Editor** — neue Pakete aus Installern und Vorlagen erzeugen; bestehende Deploy-Skripte bearbeiten (Ace-Editor); optionale **serverseitige PowerShell-Prüfung** (`POST /api/script/lint`, instanzweites Profil streng/locker unter Einstellungen).
- **Template-Editor & Daten-Editor** — Vorlagenversionen und Formular-/Metadatenfelder pflegen.
- **Stammdaten** (`/stammdaten`) — Paket-Stammdaten tabellarisch, Daten aus **`GET /api/packages`** (Suche, Sortierung, Paginierung; siehe `docs/api.md`).
- **Einstellungen** — optional Microsoft Entra ID (MSAL), KI-Anbieter und API-Schlüssel nach Konfiguration.
- **Sicherheit** — Session per JWT (HttpOnly-Cookie), CSRF Double-Submit für mutierende API-Aufrufe, rollenbasierte Bereiche; **CSP-Baseline** über SvelteKit (`kit.csp` in `svelte.config.js`, u. a. Microsoft-Login-Domains).

**Session & CSRF:** HttpOnly-Cookie `authToken`; mutierende `/api/*` mit CSRF-Cookie + Header `X-CSRF-Token` (Details: [`CURSOR.md`](./CURSOR.md)).

---

## Voraussetzungen

- **Bun** ≥ 1.1 und **Node** ≥ 20.10 (Tools wie ESLint; siehe `engines` in `package.json`)
- Für **Entra-/Microsoft-Login**: Azure-App-Registrierung und passende Redirect-URI (siehe `.env.example`)

---

## Schnellstart (Entwicklung)

```bash
git clone <URL-des-Repositories> packager-automate
cd packager-automate

cp .env.example .env
# JWT_SECRET setzen (mind. ausreichend lang für nicht-triviale Umgebungen)
# Optional lokalen Dev-Login auf der Login-Seite: ALLOW_DEV_LOGIN=true — dann JWT_SECRET mindestens 32 Zeichen (siehe validate-env / .env.example)

bun install
bun run dev
```

Standard: **http://localhost:5173** — Login wie in eurer Umgebung konfiguriert (Microsoft Entra und/oder Dev-Login nur bei **`ALLOW_DEV_LOGIN=true`** in `.env`, siehe `.env.example`).

### Datenbankschema (lokal / Deployment)

**Versionierte SQL-Migrationen** liegen unter `drizzle/main/` und `drizzle/packages/`. Beim **ersten Öffnen** der jeweiligen SQLite-Datei wendet die App sie automatisch an (Drizzle `migrate` in `run-sqlite-migrations.ts`). Bestehende Datenbanken aus früherem **`db:push`** ohne Journal werden einmalig per **Baseline** (`init: true`) auf den Migrationsstand gebracht, ohne doppelte `CREATE TABLE`.

Frischen Stand aus den Migrationen (ohne laufende App):

```bash
bun run db:migrate           # Haupt-DB (MAIN_DB_PATH)
bun run db:migrate:packages  # Paket-DB (PACKAGES_DB_PATH)
```

Nach **Schemaänderungen** im Code:

1. `bun run db:generate` bzw. `db:generate:packages` — neue SQL-Migration erzeugen, im PR reviewen.
2. `bun run db:check` — prüft, dass Schema und Migrationen zusammenpassen (läuft auch in `verify:fast`).

Optional weiterhin **`db:push` / `db:push:packages`** (`--force`) für schnelles lokales Syncen: kann bei Drift **destruktiv** sein — nicht als einziges Upgrade-Verfahren für Produktion.

SQLite-Dateien liegen standardmäßig unter `./data/` (siehe `.env.example`). **Deploy:** Arbeitsverzeichnis muss den Ordner **`drizzle/`** enthalten (neben `build/` o. Ä.).

---

## Umgebungsvariablen

Vorlage und Kommentare: **`.env.example`**. Wesentliche Punkte:

| Thema     | Variablen (Auszug)                                                                                                                                                                                    |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Session   | **`JWT_SECRET`** — für echte Deployments setzen                                                                                                                                                       |
| Microsoft | `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_REDIRECT_URI`, ggf. Secret je nach Flow                                                                                                                  |
| Dev-Login | `ALLOW_DEV_LOGIN=true` (oder `1`/`yes`) zum Aktivieren, `DEV_LOGIN_PASSWORD` — siehe `.env.example`                                                                                                   |
| KI        | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` optional                                                                                                                                                        |
| Pfade     | `DATA_ROOT`, `MAIN_DB_PATH`, `PACKAGES_DB_PATH`, `UPLOADS_DIR` bei Bedarf                                                                                                                             |
| Cookies   | `COOKIE_INSECURE=1` z.B. für HTTP-Preview ohne HTTPS                                                                                                                                                  |
| Betrieb   | `LOG_HTTP_ACCESS`, `LOG_LEVEL` (Server-Konsole: error/warn/info/debug), Dateilog (`LOG_DIR` / `DATA_ROOT/logs`), optional `PUBLIC_LOG_VERBOSE` (Browser-Logs), Retention, Rate-Limits — `.env.example` |

---

## NPM-/Bun-Skripte

| Befehl                                         | Zweck                                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `bun run dev`                                  | Dev-Server (Vite)                                                                    |
| `bun run build`                                | Production-Build → Ordner `build/`                                                   |
| `bun run preview`                              | Preview des Builds                                                                   |
| `bun run check`                                | `svelte-check` (Typen + Svelte)                                                      |
| `bun run test`                                 | Vitest (Unit)                                                                        |
| `bun run e2e`                                  | Playwright (Dev-Server separat starten, siehe `playwright.config.ts`)                |
| `bun run verify`                               | **Volle Pipeline**: Sync, Check, ESLint, Prettier, Tests, Build, Bundle-Budget, Knip |
| `bun run verify:fast`                          | Wie `verify`, aber **ohne** Build/Budget; inkl. `db:check` + Vitest + Knip           |
| `bun run lint` / `format`                      | ESLint bzw. Prettier                                                                 |
| `bun run db:migrate` / `db:migrate:packages`   | SQL-Migrationen anwenden (CLI; App macht dasselbe beim DB-Zugriff)                   |
| `bun run db:generate` / `db:generate:packages` | Neue Migration aus Schema-Diff (nach Schema-Edit)                                    |
| `bun run db:check`                             | Schema vs. Migrationen (Haupt- + Paket-DB-Konfiguration)                             |
| `bun run db:push` / `db:push:packages`         | Drizzle `push --force` (nur Dev/Notfall, siehe oben)                                 |

Vor größeren Änderungen oder vor einem Merge ist **`bun run verify`** die empfohlene Referenz. Für Zwischenchecks: **`bun run verify:fast`**.

**Dev Container:** [`.devcontainer/devcontainer.json`](./.devcontainer/devcontainer.json) nutzt das Image `oven/bun:1` (Bun 1.x). Abgleich mit **`engines.bun`** in `package.json` (aktuell ≥ 1.1) bei Major-Upgrades im Blick behalten.

---

## Produktion

Build erzeugen und Server mit **Bun** starten (SQLite bindet an `bun:sqlite`):

```bash
bun install --frozen-lockfile   # in CI empfehlenswert
bun run build
bun build/index.js              # adapter-node; Port/Host via Umgebung / Hosting
```

Details zum Node-Adapter (Umgebungsvariablen `HOST`, `PORT`, Body-Limits): [SvelteKit adapter-node](https://svelte.dev/docs/kit/adapter-node).

Reverse Proxy (TLS, große Uploads): Limits ggf. am Proxy und am Node-/HTTP-Server abstimmen.

---

## Tests & Qualität

- **Unit:** Vitest (`src/**/*.test.ts`, `tests/`) — **nur Node-Umgebung**; Strategie für DOM/Komponenten vs. Playwright: [`CURSOR.md`](./CURSOR.md) (Abschnitt Env, Tests, Doku → Vitest).
- **E2E:** Playwright (`e2e/`). `bun run e2e` startet einen Dev-Server auf Port **9299** (siehe `playwright.config.ts`; Überschreiben mit `PLAYWRIGHT_DEV_PORT` / `PLAYWRIGHT_BASE_URL`). **Lokal** nutzt Playwright `reuseExistingServer`: läuft bereits ein alter Prozess auf **9299**, können Tests irreführend grün werden — ggf. Prozess beenden oder anderen Port setzen. Barrierefreiheit: `e2e/a11y-core.spec.ts` (axe, kritisch/schwer) für Login, Rechtsseiten und angemeldete Kernpfade — setzt Dev-Login voraus (lokale `.env` wie für `bun run dev`).
- **Hooks:** optional `.githooks/pre-commit` → nur **`bun run lint`** (schnell); Merge-Qualität: **`bun run verify`** (Aktivierung: `git config core.hooksPath .githooks`; Hinweis `make hooks-help`)

---

## CI

GitHub Actions (bei Pfadänderungen unter `src/`, Tests, E2E, Tooling u.a.):

- **`packforge-ci.yml`** — zwei parallele Jobs:
  - **`verify`:** `bun install --frozen-lockfile` + `bun run verify`
  - **`e2e`:** leere SQLite-Dateien, dann `db:migrate` / `db:migrate:packages`; Playwright Chromium (`install --with-deps`), dann `bun run e2e`. Umgebung u. a. `NODE_ENV=development`, **`ALLOW_DEV_LOGIN=true`**, **`JWT_SECRET`** (≥32 Zeichen, nur für CI im Workflow gesetzt), **`COOKIE_INSECURE=1`**, `LOG_FILE_ENABLED=false` — entspricht einem sicheren Dev-Login nur auf dem Runner. Wenn ihr **`DEV_LOGIN_PASSWORD`** in eurer App nutzt, dieselbe Variable als Repository-Secret setzen und im Workflow an den `e2e`-Job durchreichen.
- **`packforge-codeql.yml`** — CodeQL JavaScript

---

## Dokumentation im Repo

| Datei / Ordner                                               | Inhalt                                                            |
| ------------------------------------------------------------ | ----------------------------------------------------------------- |
| [`AGENTS.md`](./AGENTS.md)                                   | Einstieg für Coding-Agenten (verweist auf `CURSOR.md`)            |
| [`CURSOR.md`](./CURSOR.md)                                   | Stack, Verzeichnisse, Agenten-/Review-Konventionen                |
| [`TODO.md`](./TODO.md)                                       | Markteintritt + Ideenpool (Bezug: `docs/produkt-und-markt.md`)    |
| [`CHANGELOG.md`](./CHANGELOG.md)                             | Versionsnotizen (Keep a Changelog)                                |
| [`docs/README.md`](./docs/README.md)                         | Inhaltsverzeichnis der gebündelten Doku                           |
| [`docs/produkt-und-markt.md`](./docs/produkt-und-markt.md)   | Marktziel, Positionierung, Marktreife, Launch-Checkliste          |
| [`docs/handbuch.md`](./docs/handbuch.md)                     | Nutzer, Admin, Support, RBAC-Matrix                               |
| [`docs/api.md`](./docs/api.md)                               | HTTP-API-Überblick, Race-Hinweis                                  |
| [`docs/openapi.yaml`](./docs/openapi.yaml)                   | OpenAPI 3.1-Skelett (ergänzend zu `docs/api.md`)                  |
| [`docs/betrieb.md`](./docs/betrieb.md)                       | Backup, Migrationen, Secrets, Deployment, WAF, Scanning, Releases |
| [`SECURITY.md`](./SECURITY.md)                               | Geheimnisse, vertrauliche Schwachstellen-Meldung (GitHub)         |
| [`docs/compliance.md`](./docs/compliance.md)                 | DSGVO, Legal, Offboarding, Retention, Audit, Upload               |
| [`docs/roadmap-enterprise.md`](./docs/roadmap-enterprise.md) | Mandanten, IdP, SCIM, Architektur-Outlines                        |

---

## Produktmarken

Konstanten (Name, JWT-Issuer, CSRF-Cookie-Name, Theme-Storage-Key) sind zentral in **`src/lib/app/brand.ts`** — dort bei Umbenennungen anpassen; **JWT-Issuer/Audience- oder CSRF-Änderungen** invalidieren bestehende Sessions bzw. Cookies bis zum nächsten Laden.
