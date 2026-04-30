# Dokumentation (PackForge)

Die technische und produktliche Doku ist in **wenige zusammenhängende Dateien** gegliedert. Architekturentscheidungen stehen in [`roadmap-enterprise.md`](./roadmap-enterprise.md) und in [`CURSOR.md`](../CURSOR.md), soweit sie den Alltag der Entwicklung betreffen.

| Dokument                                                   | Inhalt                                                                                           |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [`produkt-und-markt.md`](./produkt-und-markt.md)           | Marktziel, Positionierung, Marktreife, Launch-Checkliste                                         |
| [`handbuch.md`](./handbuch.md)                             | Nutzer-Kurzanleitung, Admin-Betrieb, Support-Playbooks, RBAC-Matrix                              |
| [`api.md`](./api.md)                                       | HTTP-API-Überblick, Race-Hinweis, **PR-Checkliste** bei API-Änderungen                           |
| [`openapi.yaml`](./openapi.yaml)                           | OpenAPI 3.1-Skelett (Fehler-Schema, Session-Cookie, Beispielpfade)                               |
| [`betrieb.md`](./betrieb.md)                               | Backup/Restore, Migrationen, Shutdown, Secrets, Rotation, CORS, WAF, Container-Scanning, cosign  |
| [`compliance.md`](./compliance.md)                         | DSGVO, Legal-Checkliste, Offboarding/Export, Consent, Retention, Audit, Upload-Hardening, AV/TOM |
| [`roadmap-enterprise.md`](./roadmap-enterprise.md)         | Mandanten, Teams, Hexagonal light, SAML/OIDC, RBAC/ABAC, SCIM, API-Schlüssel (Automation)        |
| [`performance-baseline.md`](./performance-baseline.md)     | Kern-Workflow: erwartete API-Requests, Messprotokoll (Login → Bibliothek → Editor → Save)        |
| [`performance-web-vitals.md`](./performance-web-vitals.md) | Core Web Vitals (LCP/INP/CLS), Kernrouten, Lab-Ziele, Lighthouse-Messprotokoll                   |

**Root:** [`README.md`](../README.md) (Projektüberblick), [`AGENTS.md`](../AGENTS.md) (Agenten-Einstieg), [`CURSOR.md`](../CURSOR.md) (Agenten-Konventionen, u. a. **Konstanten/Magic Strings**), [`TODO.md`](../TODO.md) (Markt/Backlog), [`CHANGELOG.md`](../CHANGELOG.md).
