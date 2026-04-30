# Performance-Baseline: Kern-Workflow

Szenario für Vergleiche vor/nach Optimierungen: **Dev-Login (oder Entra) → Software-Bibliothek → Script-Editor (bestehender Eintrag) → Speichern**.  
Ziel ist die **API-Schicht** (XHR/`fetch`): Anzahl, übertragene Nutzlast und Dauer — nicht jedes Bild/Font.

---

## Messung (Browser)

1. Chromium/Chrome: **Entwicklertools → Netzwerk**, „Fetch/XHR“ filtern, **Cache deaktivieren** optional (erste Ladung realistischer).
2. Seite neu laden, Szenario **einmal sauber** durchspielen.
3. Pro relevantem Request notieren: **URL (Pfad)** , **Methode** , **Größe** (Spalte „Größe“ / transferred) , **Dauer** (Wasserfall).
4. Optional: **Lighthouse / Web-Vitals** für LCP, INP, CLS — siehe [`performance-web-vitals.md`](./performance-web-vitals.md).

**Hinweis:** Nutzlast hängt stark von **Skriptlänge** (`generated_script`) und **Formular-JSON** ab; Baselines immer mit **gleicher Test-DB** / gleichem Eintrag vergleichen.

---

## Erwartete API-Requests (Reihenfolge)

### 1. Login (`/login`)

| #   | Methode | Pfad                                                    | Kurzbeschreibung                                      |
| --- | ------- | ------------------------------------------------------- | ----------------------------------------------------- |
| 1   | `GET`   | `/api/auth/config`                                      | Öffentliche Login-Konfiguration (Azure/Dev-Karten).   |
| 2   | `POST`  | `/api/auth/dev-login` **oder** `POST` `/api/auth/login` | Session-Cookie setzen; Response enthält Nutzerobjekt. |

_Microsoft-Login:_ zusätzlich Token-Flow im Browser (kein PackForge-Endpunkt bis Schritt 2).

### 2. Erste geschützte App-Shell (`(app)`-Layout, z. B. nach Weiterleitung auf `/welcome` oder direkt `/software-library`)

| #   | Methode | Pfad              | Kurzbeschreibung                      |
| --- | ------- | ----------------- | ------------------------------------- |
| 3   | `GET`   | `/api/csrf-token` | CSRF-Cookie (parallel zu `me`).       |
| 4   | `GET`   | `/api/auth/me`    | Session prüfen, Nutzer für die Shell. |

Diese beiden laufen **parallel** (`Promise.all` in `src/routes/(app)/+layout.svelte`).

### 3. Software-Bibliothek (`/software-library`)

| #   | Methode | Pfad                                             | Kurzbeschreibung                  |
| --- | ------- | ------------------------------------------------ | --------------------------------- |
| 5   | `GET`   | `/api/software?limit=24&offset=0&search=&sort=…` | Paginierte Liste (Standardseite). |

Weitere Requests nur bei Suche (debounced), Pagination oder Aktionen (Export, Löschen).

### 4. Script-Editor (`/script-editor` bzw. `/script-editor?id=<id>`)

| #   | Methode | Pfad                                           | Kurzbeschreibung                                                                               |
| --- | ------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 6   | `GET`   | `/api/software` _(ohne `limit`)_               | **Alle** Software-Summaries für die linke Auswahl — kann bei vielen Einträgen spürbar wachsen. |
| 7   | `GET`   | `/api/software/<id>` _(Default `view` = voll)_ | Detail inkl. `generated_script`, `form_data` — **größter JSON-Typ** im Workflow.               |
| 8   | `GET`   | `/api/software/<id>/checkpoints`               | Checkpoint-Liste.                                                                              |

Ohne `?id=` entfällt 7–8 bis zur Auswahl eines Eintrags.

### 5. Speichern (Button „Speichern“ / gleichwertig)

| #   | Methode | Pfad                 | Kurzbeschreibung                                                                          |
| --- | ------- | -------------------- | ----------------------------------------------------------------------------------------- |
| 9   | `PUT`   | `/api/software/<id>` | Body: `name`, `version`, `generatedScript`, `formData` — Umfang ≈ aktueller Editorinhalt. |

Server-Antwort: kompaktes JSON (`{ success: true }` o. Ä.); dominant ist **Request-Payload**.

---

## Messprotokoll (Vorlage)

| Phase              | Metrik                                       | Wert (Notiz: Datum, Build, DB-Stand) |
| ------------------ | -------------------------------------------- | ------------------------------------ |
| Login              | Anzahl API-Requests (Schritte 1–2)           |                                      |
| Login              | Summe transferred (nur XHR)                  |                                      |
| Login              | bis Session gültig (subjektiv / Performance) |                                      |
| Shell              | Anzahl (3–4)                                 |                                      |
| Shell              | Summe transferred                            |                                      |
| Bibliothek         | Anzahl (5)                                   |                                      |
| Bibliothek         | Summe transferred                            |                                      |
| Editor (inkl. 6–8) | Anzahl                                       |                                      |
| Editor             | Summe transferred                            |                                      |
| Save (9)           | Request-Größe `PUT`                          |                                      |
| Save (9)           | Dauer bis Response                           |                                      |

_Nach Optimierungen:_ dieselbe Tabelle duplizieren und **Vorher/Nachher** kurz in [`performance-vorher-nachher.md`](./performance-vorher-nachher.md) festhalten.

---

## Code-Referenzen

- App-Shell: `src/routes/(app)/+layout.svelte` (`csrf-token`, `auth/me`).
- Bibliothek: `src/routes/(app)/software-library/+page.svelte` → `GET` mit `limit`/`offset`/`search`/`sort`.
- Editor Liste + Detail: `src/lib/client/script-editor-api.ts` , Laden in `src/routes/(app)/script-editor/+page.svelte` (`loadList`, `loadDetail`, `loadCps`).
- Software-Liste ohne `limit`: `src/routes/api/software/+server.ts` (`listSoftwareSummaries()`).
