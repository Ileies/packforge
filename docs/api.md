# HTTP-API — Überblick

Endpunkte unter `/api/*` (SvelteKit); Handler unter `src/routes/api/`.

**OpenAPI:** [`docs/openapi.yaml`](./openapi.yaml) — gemeinsames **Fehler-JSON**, Session-**SecurityScheme**, Kernpfade (Auth, Software inkl. Checkpoints/Export, Pakete, Formfelder, Vorlagen, Admin-Instanzexport, KI, Lint). Feinheiten der Request-Bodies weiterhin in den Handlern / dieser Datei; bei neuen Routen OpenAPI und Tabelle unten abstimmen.

## Authentifizierung

- **Session:** HttpOnly-Cookie `authToken` — kein `Authorization: Bearer` im Web-Client.
- **Gate:** `hooks.server.ts` — ohne Session-JWT → **401** (`PF_AUTH_REQUIRED`), außer Pfade in `api-public-paths.ts`.

### Öffentlich (ohne Session)

| Methode   | Pfad                  | Zweck                                                                                                                   |
| --------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| GET, HEAD | `/api/csrf-token`     | CSRF-Cookie + Token                                                                                                     |
| GET, HEAD | `/api/auth/config`    | MSAL/öffentliche Auth-Config                                                                                            |
| GET, HEAD | `/api/auth/me`        | Aktueller Nutzer; ohne Session: bei `PUBLIC_OPEN_PORTFOLIO_MODE=true` wird eine **Gast-Session** gesetzt (`Set-Cookie`) |
| POST      | `/api/auth/login`     | Login                                                                                                                   |
| POST      | `/api/auth/dev-login` | Dev-Login (wenn erlaubt)                                                                                                |

Alle anderen `/api/*` sind session-pflichtig.

### CSRF

Mutierende Methoden: Header **`X-CSRF-Token`** = Wert aus `/api/csrf-token` (Double-Submit-Cookie). Ausnahmen: `csrf-paths.ts`, Login-POSTs.

Fehlerformat: [JSON-Fehler](#fehlerantwort-json).

### Query `view` (GET-Details)

Steuert Payload-Größe. Gültig u. a.: `full`, `detail`, `summary`, `minimal`. Ungültig → **400** (`PF_INVALID_VIEW`).

| GET-Pfad              | `summary` / `minimal` (Kurz)                      |
| --------------------- | ------------------------------------------------- |
| `/api/software/[id]`  | Ohne große Blobs (Skript, Formular-JSON, Dateien) |
| `/api/packages/[id]`  | Ohne `original_script_text`                       |
| `/api/templates/[id]` | Ohne `content`                                    |

Client: `apiRoutes.*.detail(id, { view: 'summary' })`.

---

## Fehlerantwort (JSON)

| Feld     | Bedeutung                            |
| -------- | ------------------------------------ |
| `error`  | Kurztext                             |
| `code`   | Stabiler Code (`PF_*`)               |
| `docRef` | oft `docs/api.md#fehlerantwort-json` |

Zusatzfelder je Endpoint möglich (`retryAfter`, `conflictSoftwareId`, …).

---

## Routen (Kurz)

**Auth:** `GET /api/auth/me`, `POST /api/auth/logout`.

**Software:** `GET/POST /api/software`, `GET|PUT|DELETE /api/software/[id]`, `POST …/export`, Checkpoints unter `…/checkpoint…`.

**Templates / Formfields:** `GET|POST /api/templates`, `GET /api/templates/[id]`, `GET …/next-minor/[majorVersion]`; Formfields CRUD + `export`, `import`, `reorder`.

**Packages:** `GET /api/packages`, `GET|PUT /api/packages/[id]` (Legacy-Stammdaten).

**KI:** siehe [KI: Rolle der Endpunkte](#ki-rolle-der-endpunkte); Endpunkte für API-Schlüssel und KI-Modell, Tests. **`script-improve`:** optional `scriptAnalyzer` (PSScriptAnalyzer auf `code` — siehe `.env.example`: `PACKFORGE_PWSH`, `PACKFORGE_DISABLE_PSSA`).

**PowerShell-Lint:** `GET|POST /api/settings/powershell-lint-profile`; `POST /api/script/lint` (JSON `script`).

**Sonstiges:** `GET /api/system-fields` (mit passender Permission).

---

## KI: Rolle der Endpunkte

| Endpoint                      | Rolle                                                                                                                                                                                                                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/ai/script-improve` | Skript + Nutzerwunsch; **festes** Server-Prompting (`script-optimization`), Zeichenlimits wie andere KI-Routen.                                                                                                                                                                                         |
| `POST /api/ai/script-fix`     | Skript + Problembeschreibung; festes Fix-Prompting.                                                                                                                                                                                                                                                     |
| `POST /api/ai/enrichment`     | Nutzerwunsch + festes Enrichment-Prompting; optional `softwareName` / `softwareVersion`. Optional `formData` im Body (Längenvalidierung) — **derzeit ohne Übergabe an das KI-Modell** (siehe `docs/compliance.md`).                                                                                     |
| `POST /api/ai/response`       | **Ad-hoc-Freitext** (u. a. Script-Editor-Sidebar): Nutzereingabe geht an den **aktiven** KI-Anbieter; gleiches **Tagesbudget** und **Rate-Limit** wie andere `POST /api/ai/*`. Kein Ersatz für die drei strukturierten Routen — dort sind Eingaben und Prompts serverseitig klar begrenzt und gepflegt. |

**Konsolidierung / Erweiterung:** Neue fachliche KI-Flows möglichst als **eigene Route** mit Zod-Schema und dediziertem Prompt (wie Improve/Fix/Enrichment), statt dauerhaft generischer Text über `/api/ai/response`. Optional unterstützt diese Route OpenAI-**`promptId`** / `instructions` / `model` — alle Felder sind **längenbegrenzt** (`PF_AI_INPUT_TOO_LONG`, Konstanten in `src/lib/server/ai/input-limits.ts`).

---

## Paralleles Speichern (Software)

`PUT /api/software/:id` ist **last-write-wins** (kein Optimistic Locking). Risiko: zwei Tabs überschreiben still. Mitigation später: Version/ETag + Konflikt-UX. Für Einzelnutzer oft akzeptabel.

---

## PR-Checkliste: API-Änderungen

Bei Änderungen an `src/routes/api/**`, zugehörigen Repos oder Client-Fetchpfaden kurz prüfen (im PR-Text abhaken oder kopieren):

- [ ] **`docs/openapi.yaml`:** betroffene Pfade/Schemas ergänzen oder bewusst auslassen (Kommentar im PR).

### Nutzlast (Payload)

- [ ] Große Felder nur bei Bedarf: Detail-GETs mit `?view=` / Projektionen abstimmen ([Query `view`](#query-view-get-details)).
- [ ] Listen: Pagination, Defaults und harte Obergrenzen — kein unerwarteter „Full-Table“-Transfer.
- [ ] Body-Limits und klare **Fehlercodes** (`PF_*`) bei zu großen oder ungültigen Payloads.

### Redundante Aufrufe

- [ ] Client: kein doppelter Fetch derselben Ressource ohne neuen Bedarf; Suche/Filter **debounced**, wo Eingaben sonst jeden Tastendruck triggern.
- [ ] Nach Mutationen: gezielt **nachladen**, was sich geändert hat — nicht pauschal größere Bausteine neu ziehen, wenn es vermeidbar ist.

### Cache & Konsistenz

- [ ] GET: `Cache-Control`, **ETag** / bedingte GETs (`jsonWithConditionalGet`, `varyCookie` bei session-sensiblen Listen) analog zu vergleichbaren Endpoints.
- [ ] Statische fingerprintete Assets nicht über `/api/*` „ersetzen“; API-Responses nicht mit `immutable`-Profilen verwechseln (s. [betrieb.md](./betrieb.md), Abschnitt **Cache: fingerprintete Static Assets**).

Verwandt: [`performance-baseline.md`](./performance-baseline.md), [`performance-web-vitals.md`](./performance-web-vitals.md), [`performance-vorher-nachher.md`](./performance-vorher-nachher.md), `PERFORMANCE-LOGIC-TODO.md`.
