# AGENTS.md — PackForge

Kurze **Einstiegsseite für Coding-Agenten** (Cursor, automatisierte Reviews mit Repo-Kontext). Technische Tiefe, Stack-Tabelle und Review-Checkliste stehen in **`CURSOR.md`** — hier nur Navigation und Erwartungen.

---

## Lesereihenfolge

1. **`CURSOR.md`** — Stack, `src/`-Layout, Befehle (`verify`, `verify:fast`), Konventionen (Svelte 5, SSR, API, CSRF, Knip), Fallstricke, größere Aufgaben-Checkliste.
2. **`README.md`** — Produktüberblick, Schnellstart, CI/E2E, Verweistabelle auf übrige Doku.
3. **`docs/api.md`** und **`docs/openapi.yaml`** — bei Änderungen an `routes/api/**` oder zugehörigen Clients.

Weitere gebündelte Doku: **`docs/README.md`**.

---

## Erwartetes Verhalten

- **Scope:** nur dieses Repo-Root; keine Ausweitung über die in `CURSOR.md` unter „Bewusst zurückgestellt“ genannten Grenzen hinaus.
- **Änderungen:** minimal und aufgabenbezogen; Namensgebung, Imports und Zentralisierung wie im bestehenden Code (`CURSOR.md` → Konventionen).
- **Sprache:** Antworten **Deutsch**, wenn der Nutzer nichts anderes verlangt.
- **Vor größeren PRs:** `bun run verify` bzw. die Checkliste am Ende von `CURSOR.md`.

---

## Backlogs

Bei passenden Aufgaben mitpflegen oder konsultieren: `TODO.md` — Übersicht in **`docs/README.md`** und in der README-Tabelle „Dokumentation im Repo“.
