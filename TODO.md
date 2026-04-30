# Backlog & Ideenpool

**Verbindliches Marktziel:** `docs/produkt-und-markt.md`.

- **Oben:** Markteintritt (kurz, abhakbar).
- **Unten:** Ideen und Ausbaustufen — blockieren den Launch nicht; Priorisierung immer gegen das Marktziel.

---

## 1. Markteintritt

**Go-Live:** Launch-Checkliste in `docs/produkt-und-markt.md` (Owner/Datum im Ticket).

---

## 2. Ideenpool — Produkt & UX

_PackForge-spezifisch; Reihenfolge frei._

**Packaging:** Gesundheitsscore; Diff zwischen Versionen; PSADT-Wizard; Rule Sets; Vendor-Profile.

**KI:** Modellwahl pro Aufgabe; Kostenschätzung; Input-Cache; Batch-Jobs; Prompt-Bibliothek; Evals; optional On-Prem/RAG.

**UX:** Undo/Redo Editor; Split-View; Mandanten-Branding; Drag-and-drop wo sinnvoll; Webhooks/CLI/PSGallery; Jira/DevOps; Automation-Tools später. **Redundanz / Ballast:** abarbeitbare Liste in `UX-STREAMLINE-TODO.md`.

**Templates:** Kurierter Marktplatz (nicht Launch-Blocker laut Marktziel).

**Daten:** Externe Produkt-IDs (Winget/Choco). **Kollaboration:** Kommentare, Freigaben, Feed, Benachrichtigungen.

**KI-Output:** Konfigurierbare Lint-Stufen pro Umgebung.

**Hilfe & Leerzustände:** Konfig-Hilfe-Links (`EmptyState`, Env-Hilfe-URLs) — umgesetzt wo markiert.

---

## 3. Technik & Skalierung

_Nach erstem Kundenwachstum oder reiferem Ops._

Konventionen: `CURSOR.md`.

Postgres-Option; Object Storage; Queue/Outbox; Worker; Chunked-Upload; Feature Flags; API-Versionierung; OpenAPI/SDK; Preview-Deploys; Contract-/Load-Tests.

**Observability:** OpenTelemetry/Metriken/Alerting an Kunden-Stack — wenn SLAs.

---

## 4. Vertrieb & Organisation (später)

Responsible Disclosure; Rollout-Playbook; Schulungen; Retros; Wettbewerbsmatrix; Win/Loss.

---

## 5. Fernziel & Experimente

| Idee              | Hinweis                        |
| ----------------- | ------------------------------ |
| VS Code Extension | Hoher Aufwand; Non-Goal Launch |
| Offline-PWA       | Ambitioniert                   |
| IPv6-only / ARM64 | Bei Kundenbedarf               |

---

## Baseline

Kernfunktionen, Security-/CI-Baseline und Doku unter `docs/` sind tragfähig; der Pool oben ist **Zukunft**, kein Muss-Backlog.

---

_Bei Marktziel-Änderung: zuerst `docs/produkt-und-markt.md`, dann Prioritäten hier sortieren._
