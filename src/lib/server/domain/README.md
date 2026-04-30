# Server-Domain (`lib/server/domain`)

**Zweck:** Hier Use-Case-Logik **ohne** HTTP- oder SvelteKit-Typen ablegen, sobald eine Funktion **wächst** oder wieder verwendet wird.

**Konvention:**

- Reine Funktionen mit explizitem Input/Output (Typen aus `$lib/server/...` oder lokale DTOs).
- Datenbankzugriffe über bestehende Repositories oder neue kleine Repository-Module — nicht aus Routen duplizieren.

Noch kein Pflicht für bestehende Routen; neue Features hier ablegen, wenn die Route sonst unübersichtlich wird ([`docs/roadmap-enterprise.md`](../../../../docs/roadmap-enterprise.md) Abschnitt Architektur).
