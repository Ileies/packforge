# CURSOR.md — PackForge (Cursor / Agenten)

Kurzreferenz für **gleiche Annahmen** und **reproduzierbare** Änderungen am Repo. Details: `README.md`, `docs/`. Kurzer Agenten-Einstieg: `AGENTS.md`.

---

## Projekt & Stack

**PackForge** — SvelteKit-2-App (Legacy: Node-Express im übergeordneten Repo). Dieses Repo = UI + `/api/*`.

| Bereich    | Technologie                                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| Framework  | Svelte 5 (Runes), SvelteKit 2                                                                                            |
| Build      | Vite 8, `@sveltejs/adapter-node` → `build/`                                                                              |
| Styling    | Tailwind 4, shadcn-svelte / bits-ui                                                                                      |
| DB         | SQLite (`bun:sqlite`) + Drizzle                                                                                          |
| Auth       | JWT-Session (HttpOnly `authToken`), Profil aus `/api/auth/me`; optional Entra; Dev-Login per Env                         |
| Sicherheit | CSRF Double-Submit (`packforge_csrf` + `X-CSRF-Token`) für mutierende `/api/*` (Ausnahmen: `csrf-paths.ts`, Login-POSTs) |
| Editor     | ace-builds (client-only, dynamisch)                                                                                      |
| Tests      | Vitest (node), Playwright (`e2e`)                                                                                        |

**Paketmanager:** `bun`. Skripte: `bun --bun` vor vite/svelte-kit/vitest/drizzle-kit wo vorgesehen. CSP-Baseline: `svelte.config.js` (`kit.csp`).

**Session & CSRF (wo nachlesen):** `session-jwt-core.ts`, `session-cookies.ts`, `request-session.ts`, `hooks.server.ts`, `api-public-paths.ts`, `api-route-guards.ts`, `validate-env.ts` (Production: kein schwaches Secret, kein `ALLOW_DEV_LOGIN`, kein `COOKIE_INSECURE`).

---

## Verzeichnis

```
src/
  hooks.server.ts    # DB-Seed, CSRF (mutierende /api)
  routes/(app)/      # Shell; Auth-Check im Layout
  routes/api/**      # REST
  lib/app/           # brand, Section-Permissions
  lib/client/        # Browser: Session-Store, fetch, Theme
  lib/components/
  lib/server/        # nur Server — nicht aus Browser-Komponenten importieren
```

---

## Befehle (Projektroot)

| Befehl                                 | Zweck                                                     |
| -------------------------------------- | --------------------------------------------------------- |
| `bun run dev`                          | Dev-Server                                                |
| `bun run check`                        | svelte-check                                              |
| `bun run verify`                       | Sync, check, ESLint, Prettier, Tests, Build, Budget, Knip |
| `bun run verify:fast`                  | wie oben ohne Build/Budget; inkl. `db:check`, Tests, Knip |
| `bun run test` / `bun run e2e`         | Unit / Playwright                                         |
| `bun run db:migrate` / `db:migrate:*`  | versionierte SQL-Migrationen (siehe README)               |
| `bun run db:check`                     | Schema vs. Migrationen                                    |
| `bun run db:push` / `db:push:packages` | Drizzle `push --force` — nur Dev/Notfall (README)         |

Nach Dependency-/Kit-Änderungen: `bun run prepare` (`svelte-kit sync || true`, damit `bun install` nicht hart scheitert); verlässlich: `bun run check` / `verify`.

---

## Git & Remote

**Ziel:** Mehrere Cursor-/KI-Sessions parallel ohne sich gegenseitig Arbeitsstände zu zerstören — dafür **`main` nur als Integrationslinie**, jede inhaltliche Session auf **eigenem Branch** mit klarem Merge.

### Branch je Feature / je größerem Fix

- **Neues Feature** → Branch `feature/<kurz>` (z.B. `feature/script-editor-tabs`).
- **Größerer Fix** (mehrere Dateien, riskante Stelle, längere Session) → Branch `fix/<kurz>` (z.B. `fix/csrf-login-redirect`).
- **Kleinkram** (Tippfehler, eine Zeile Doku): optional direkt auf `main` — nur wenn **keine** andere Session gleichzeitig am Repo arbeitet; sonst trotzdem kurzer Branch.

### Ablauf pro Session (Checkout → Arbeit → Merge)

1. **`git fetch origin`** und **`git checkout main`**, dann **`git pull origin main`** (aktueller Stand).
2. **`git checkout -b feature/…`** bzw. **`fix/…`** — ein Branch pro Task, nicht wiederverwenden für themenfremde Folgearbeit.
3. Arbeiten, committen; Branch **`git push -u origin <branch>`** pushen.
4. **Zusammenführen:** bevorzugt **Pull Request** auf GitHub (`gh pr create` oder Web-UI), nach Review **`main` mergen**. Alternativ lokal: auf `main` wechseln, pullen, **`git merge <branch>`** (oder Rebase nur wenn du die Geschichte sauber halten willst — einheitliche Teamregel vermeidet Chaos).
5. Wenn **`main`** während der Session weitergezogen ist: auf dem Feature-Branch **`git merge origin/main`** (oder `git rebase origin/main` — dann force-push nur mit Absprache), Konflikte dort lösen, danach erst PR/Merge.
6. **Nie** zwei parallelen Sessions denselben Branch bearbeiten lassen, ohne dass sich Mensch oder Agent die Reihe absprechen.

### Sonstiges

- **Remote:** `origin` → GitHub **`Ileies/packforge`** (SSH z.B. `git@github.com:Ileies/packforge.git`). Öffentliche Produkt-URL: `package.json` → `homepage`, `src/lib/app/brand.ts`.
- **Nicht versionieren:** alles aus **`.gitignore`** — v.a. **`.env`**, lokale DBs unter `data/database/`, Uploads, Logs, `build/`, Playwright-Reports; vor Commit **`git status`** prüfen.
- **Commits:** kurze Messages (`feat:` / `fix:` / `chore:` optional); sinnvolle Commit-Häufung.
- **Vor PR / Merge in `main`:** Checkliste — **`bun run verify`** oder **`verify:fast`** bei Codeänderungen.
- **Version & Release:** **`package.json`** → `version` (SemVer); Releases: Tag **`v1.2.3`**, `git push origin v1.2.3`; optional `gh release create v1.2.3 --generate-notes`.
- **Hilfen:** `gh repo view`, `gh auth status`; Klonen: `git clone git@github.com:Ileies/packforge.git`.

---

## Konventionen

- **Svelte 5:** Runes (`$state`, `$derived`, `$effect` mit Cleanup). Kein Legacy-`export let` für Neues.
- **SSR:** Kein `window`/`document`/`localStorage` ohne Guard.
- **API:** Bestehende JSON-/Session-Helfer; `authHeaders()` + `credentials: 'same-origin'` für Mutationen. PR-Review: `docs/api.md` → **PR-Checkliste: API-Änderungen**. OpenAPI-Skelett: **`docs/openapi.yaml`** (bei neuen Routen nachziehen).
- **Konstanten:** Literal nah am Ort; erst bei zweitem sinnvollen Aufruf zentralisieren (`brand.ts`, `api-routes.ts`).
- **Styling:** Tailwind + bestehende shadcn-Komponenten; Dark Mode über App-Shell / `brand.ts`.

**DB:** Schema unter `src/lib/server/schema/`; versionierte SQL unter `drizzle/`; Pfade/Env siehe `.env.example`.

**Knip:** Ignorierte Pfade in `knip.json` (u. a. shadcn-`ui/`, Barrel `src/lib/index.ts`) — vor Erweiterung `bun run knip`; Änderungen an der Liste kurz im PR erklären.

---

## Env, Tests, Doku

- **`.env.example`** — keine echten Secrets ins Repo.
- **Vitest:** `environment: 'node'` (`vitest.config.ts`) — reine Logik, Server-Code, API-Tests mit Mocks; schnell, ohne DOM. **`$app/*`:** vermeiden oder mocken (z.B. `tests/mocks/`); `$app/environment` in Helfern unnötig machen, wo möglich.
- **Vitest vs. DOM / Svelte-Komponenten:** Der Standardlauf bleibt **node-only** (`bun run test` / `verify`). **UI mit Session, Routing, Ace, shadcn:** **Playwright** (`e2e/`) — echte Browserumgebung, bereits etabliert. **Optional später:** separates Vitest-Projekt (eigene Config oder Vitest-Workspace) mit `happy-dom` oder `jsdom` + `@testing-library/svelte` und Svelte-Vite-Plugin nur für kleine, isolierte Komponenten; eigenes Script (z.B. `test:dom`) und erst bei Bedarf CI — nicht den bestehenden `test`-Pfad aufblähen.
- **Backlog-Doku:** `TODO.md`, `PERFORMANCE-LOGIC-TODO.md`, `docs/README.md` — nur bei Doku-Tasks mitpflegen.
- **CI-E2E:** `packforge-ci.yml` → Job `e2e`; lokale Parität: vor `bun run e2e` `db:migrate` + `db:migrate:packages` (oder früheres `db:push`) + `.env` mit Dev-Login (siehe README „CI“).
- **ESLint:** `**/*.svelte` nutzt `projectService` + **`@typescript-eslint/no-floating-promises`** (`eslint.config.js`) — schwebende Promises mit `await`, `void` o. Ä. auflösen.

---

## Fallstricke

1. SSR-500 durch unguarded `window`/`document`.
2. **SQLite:** nur mit **Bun**-Prozess (`bun:sqlite`); nicht `node build` ohne angepassten Stack.
3. **Produktion:** `build/`; große Uploads: Proxy-Limits abstimmen.
4. **CSRF:** Layout lädt `/api/csrf-token`; nach Login ggf. frisches Cookie.

---

## Bewusst zurückgestellt

- Kein Scope-Creep über `docs/produkt-und-markt.md` + fokussiertes `TODO.md` hinaus (inkl. `roadmap-enterprise.md` „mitziehen“).
- **Entra/MSAL-Vollständigkeit** (Redirect/Silent-Renew): erst bei Bedarf.
- **File-Analyzer:** kein Binary im Repo — erst nach Klärung.

---

## Agenten-Umgang

Kontext: relevante `+page.svelte` / `+server.ts`-Pfade nennen. Änderungen: **minimal**, taskbezogen. Sprache: **Deutsch**, wenn der Nutzer nichts anderes verlangt. Grenze: dieses Repo-Root.

**Parallel zu anderen Sessions:** Zu Beginn der Task **eigenen Branch** anlegen (siehe **Git & Remote**); nicht unkoordiniert auf `main` committen, wenn gleichzeitig andere Agenten oder Editoren am selben Klon arbeiten.

---

## Checkliste (größere Aufgaben)

- [ ] `bun run verify` grün
- [ ] Git: Arbeit auf **`feature/…`** oder **`fix/…`**, nicht unkontrolliert auf `main` bei parallelen Sessions; kein `.env` / keine ignorierten Geheimnisse im Commit
- [ ] Keine neuen `svelte-check`-Warnungen ohne Grund
- [ ] SSR/Client-Pfade bei `+page.svelte`-Änderungen geprüft
- [ ] `.env.example` bei neuen Env-Vars
