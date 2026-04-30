# Handbuch — Nutzer, Admin, Support

---

## Nutzer (Kurz)

**UI:** „du“, Produktbegriffe wie PackForge, Software-Bibliothek, Script Maker/Editor, Template-/Daten-Editor, Stammdaten (`/stammdaten`), PSADT. Rechtstexte: „Sie“.

- **Login:** Entra oder Dev-Login (nur Entwicklung); bei Problemen Cookies, Proxy, Azure-Redirect prüfen.
- **Script Maker:** Installer + optional Zusatzdateien; Upload erzeugt Eintrag.
- **Script-Editor:** Bearbeiten + Speichern; KI nur nach Konfiguration.
- **Bibliothek:** Liste, Export, Löschen je Rolle.
- **Template-/Daten-Editor:** Import/Export, Größenlimits beachten.
- **Einstellungen:** Modell, API-Schlüssel, Transparenz-Hinweise zu KI-Anbietern.

**Barrierefreiheit:** Kernpfade gegen kritische/schwere axe-Probleme geprüft (`e2e/a11y-core.spec.ts`; Dev-Server typ. Port **9299**, überschreibbar). H1, Seitentitel, ARIA wo nötig. **Kein Ersatz** für formales WCAG-Gutachten bei Vertragsbedarf.

---

## Admin (Betrieb)

- **Runtime:** Node ≥ 20 oder Bun ≥ 1.1 (`package.json` `engines`); Env: `.env.example` (mind. `JWT_SECRET` in Production).
- **Start (Production-ähnlich):** `bun install` → `bun run build` → **`bun build/index.js`** (SQLite braucht Bun — siehe README).
- **Modell:** Eine Installation = eine Organisation (kein Multi-Tenant-SaaS im Kern) — Details `roadmap-enterprise.md`.
- **Daten:** SQLite unter `DATA_ROOT` / `./data/database/`; Backup/Restore ausführlich [`betrieb.md`](./betrieb.md).
- **Uploads:** `MAX_UPLOAD_BYTES`; Signaturprüfung Hauptinstaller (PE/OLE); typische Binärformate für Zusatzdateien.
- **Auth:** optional Entra; Dev-Login nur mit **`ALLOW_DEV_LOGIN=true`** + starkes `JWT_SECRET` — öffentliches Staging: `betrieb.md`.
- **Logs:** JSON `http_access` / `audit`; Dateien unter `<DATA_ROOT>/logs/` mit Rotation (`LOG_MAX_BYTES`, `LOG_RETENTION_*`, `LOG_FILE_ENABLED`, `LOG_STDOUT`) — vollständig `.env.example`. Orientierung Retention: [`compliance.md`](./compliance.md).

**Troubleshooting:** KI 5xx → API-Schlüssel, Provider, Netzwerk, `x-request-id`, Rate-Limits. Upload/Export → Typen, Größe, Speicher, ZIP-Pfade in Metadaten. Auth → `JWT_SECRET`, HTTPS/Cookies, CSRF bei Mutationen.

---

## Rollen × Berechtigungen

Kanonisch: `src/lib/server/auth/roles.ts` (`ROLES`); Client: `hasPermission`.

| Permission            | Besucher | Mitarbeiter | Admin |
| --------------------- | :------: | :---------: | :---: |
| VIEW_WELCOME          |    ✓     |      ✓      |   ✓   |
| VIEW_SOFTWARE_LIBRARY |    ✓     |      ✓      |   ✓   |
| CREATE_SCRIPTS        |    —     |      ✓      |   ✓   |
| EDIT_OWN_SCRIPTS      |    —     |      ✓      |   ✓   |
| EDIT_ALL_SCRIPTS      |    —     |      ✓      |   ✓   |
| VIEW_SCRIPT_EDITOR    |    —     |      ✓      |   ✓   |
| EXPORT_PSADT          |    —     |      ✓      |   ✓   |
| USE_AI_FEATURES       |    —     |      ✓      |   ✓   |
| VIEW_SETTINGS         |    —     |      ✓      |   ✓   |
| VIEW_TEMPLATE_EDITOR  |    —     |      ✓      |   ✓   |
| EDIT_TEMPLATES        |    —     |      —      |   ✓   |
| VIEW_DATA_EDITOR      |    —     |      ✓      |   ✓   |
| VIEW_STAMMDATEN       |    —     |      ✓      |   ✓   |
| MANAGE_FORMFIELDS     |    —     |      —      |   ✓   |
| MANAGE_ROLES          |    —     |      —      |   ✓   |
| MANAGE_AI_KEYS        |    —     |      —      |   ✓   |
| ADMIN_INSTANCE_EXPORT |    —     |      —      |   ✓   |

**ABAC:** nicht im Produkt — erst bei konkretem Bedarf (`roadmap-enterprise.md`).
