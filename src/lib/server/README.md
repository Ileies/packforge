# Server-Code (`src/lib/server`)

Kurzüberblick für Onboarding — keine vollständige API-Doku.

## Schichten

| Bereich        | Ordner / Dateien                                                                                                                         |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**       | `auth/` — JWT-Session, Entra-Verify, Dev-Login                                                                                           |
| **HTTP**       | `http/json.ts`, `http/errors.ts` — einheitliche JSON-Antworten                                                                           |
| **Datenbank**  | `db/`, `schema/`, `repo/*.repo.ts` — Drizzle + SQLite                                                                                    |
| **KI**         | `ai/` — OpenAI/Anthropic-Clients, `model-selector` (aktives Modell aus DB pro Abruf; API-Schlüssel-Bootstrap einmal pro Worker), Prompts |
| **Pfade / IO** | `paths.ts`, `seed-app.ts`, `prompts.ts`                                                                                                  |

## Konventionen

- **`*.repo.ts`**: Listenabrufe als `list…` (z. B. `listSoftwareSummaries`, `listFormfields`), Einzelzeilen als `get…ById` — konsistent mit den bestehenden Repos unter `repo/`.
- JSON-POST-Bodies: bei strukturierten Payloads `$lib/server/http/parse-request-json` mit **Zod** nutzen (Beispiele: `/api/ai/response`, `/api/auth/login`).
- API-Routen: Fehler über `$lib/server/http/errors.ts` (`badRequest`, `notFound`, `apiJsonError`, …) — einheitlich `error`, `code` (`PF_*`), `docRef` (siehe `docs/api.md#fehlerantwort-json`).
- Mehrere DB-Writes, die zusammengehören: `getMainDb().transaction((tx) => { … })` (siehe `software.repo.ts`).
- KI-Anbieter-Konstanten: `$lib/app/ai-providers.ts` (`AI_PROVIDERS`, `isAiProvider`).

## Lifecycle

- `hooks.server.ts`: einmal pro Node-Prozess Prompts + App-Seed (Kommentar in der Datei).
