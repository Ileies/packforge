# Compliance, Recht, Daten

Keine Rechtsberatung — Checklisten mit **Legal** abstimmen. Betrieb: [`handbuch.md`](./handbuch.md), [`betrieb.md`](./betrieb.md).

---

## DSGVO (Stichpunkte)

- **VVT:** Welche Personendaten (Accounts, Logs, KI)? Self-hosted: Speicherort beim **Kunden** (`DATA_ROOT`, Backup).
- **KI:** Nur wenn API-Schlüssel gesetzt sind — Datenfluss/Region mit Anbieter klären.
- **Ausgehende KI-Daten:** Kurz in der App (Einstellungen) + Abschnitt [KI-Datenfluss](#ki-datenfluss) unten.
- **AVV:** Host/KI nur bei tatsächlicher Nutzung; SCC/TIA bei Bedarf.
- **Minimierung, Löschung, Portabilität:** Export-Umfang mit Legal/Produkt festlegen.

---

## KI-Datenfluss (technisch, für VVT)

**Keine Rechtsberatung.** Unterstützte Cloud-KI: **OpenAI**, **Anthropic** (keine weiteren im Code).

- **API-Schlüssel:** Umgebungsvariablen (`OPENAI_API_KEY`, …) und/oder Eingabe in der App (RAM bis Neustart, siehe `.env.example`).
- **Transport:** nur HTTPS zu den jeweiligen Anbieter-APIs.
- **Prompts:** Vorlagen unter `data/prompts/*.txt` gehen in die Anfrage mit.
- **Skript-KI:** Inhalt + Nutzeranfrage über `script-improve` / `script-fix`.
- **Enrichment:** An den Anbieter gehen der **Nutzerfreitext**, optional **Softwarename und -version** sowie das Prompt-Template (`data/prompts/enrichment.txt`). Der JSON-Body darf optional **`formData`** enthalten; der Server prüft die serialisierte Länge (`MAX_AI_FORM_DATA_JSON_CHARS`). **`formData` wird in `enrichUserRequest` nicht an das Modell angehängt** — nur bei künftiger Änderung dieser Logik VVT und UI-Hinweise anpassen.
- **`/api/ai/response`:** Prompt/Instructions vom Client — Umfang liegt bei Aufrufer; Antwort als **JSON** (kein SSE im Produktcode).
- **Anthropic:** Chat-Completion ohne Web-Search im Produktcode.
- **Verbindungstest:** minimaler Traffic zu den APIs.

Ergänzung für Verarbeitungsverzeichnis: Ziel-URLs, Subprozessor-Namen, Verweis auf Anbieter-DPA.

---

## Checkliste Legal / Enterprise-Einkauf (technische Fakten)

**Unterschriebene Texte nur durch Legal.**

- [ ] Self-hosted Datenhaltung, Backup — siehe `betrieb.md` / `handbuch.md`.
- [x] Runtime Bun/Node — `README.md` / `engines`.
- [x] Optional Entra; Session JWT + CSRF — `CURSOR.md` / `README.md`.
- [x] KI-API-Schlüssel und Datenarten — Einstellungen + Abschnitt oben.
- [x] Subprozessoren (nur bei Nutzung): OpenAI, Anthropic, Microsoft Entra — DPA/TIA mit Legal; ohne gesetzte API-Schlüssel bzw. ohne Entra keine aktiven KI-/SSO-Calls.
- [x] Hosting-Beispiel dokumentiert; konkrete AV mit Legal.
- [x] Logs: stdout/Datei, Retention-Env — `handbuch.md`, `.env.example`.
- [x] Aufbewahrung: Richtwerte in [Retention](#aufbewahrung--audit); verbindliche Fristen im Vertrag.

---

## Offboarding

- **Export:** `POST /api/admin/instance-export` (ZIP inkl. Manifest) — siehe Handbuch/Einstellungen; auditgeloggt.
- **Ablauf:** Export zu ruhiger Zeit; Restore testen; Löschung `DATA_ROOT` nach internem Runbook + Legal/IT.
- **Außerhalb App:** IdP, Netzwerk, Vault, Storage-Backups im Offboarding-Ticket listen.

---

## Cookies / Consent

**Produktentscheidung:** kein Marketing-/Third-Party-Analytics-Cookie-Banner für funktionale Session/CSRF-Cookies; Analytics serverseitig/DB möglich — mit **Legal** abstimmen.

- [x] Policy dokumentiert.
- [ ] Bei Browser-Tracking (PostHog, Matomo, …): CMP/Consent **versioniert** planen.

---

## Aufbewahrung & Audit

**Richtwerte:** HTTP-Zugriff typ. **30–90 Tage**; Audit sensible Aktionen **mind. 12 Monate** — länger nur per Vertrag/Branche. Geschäftsdaten bis Kundenlöschung oder Exportfrist.

Technik: `LOG_RETENTION_*`, Dateien unter `<DATA_ROOT>/logs` — `handbuch.md`, `.env.example`.

**Audit:** JSON-Zeilen (`type: "audit"`) + HTTP-Logs mit `traceId`; kein WORM/Blockchain zum Launch.

---

## Upload-Hardening

Magic-Bytes, `MAX_UPLOAD_BYTES`, Zip-Slip-Schutz — siehe Code und `handbuch.md`. Optional später: AV/Quarantäne bei Vertragsanforderung.

---

_File-Upload-Todos im Repo sind größtenteils umgesetzt; optionale ClamAV-Erweiterung bleibt Backlog._
