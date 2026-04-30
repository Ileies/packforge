# Roadmap: Enterprise-Features und Architekturentscheidungen

**Verbindliches Marktziel** (Non-Goals, Launch): [`produkt-und-markt.md`](./produkt-und-markt.md). Diese Seite sammelt **nachgelagerte** Entscheidungen und Todos — nicht alles ist Launch-pflichtig.

---

## Mandantenfähigkeit

**Entscheidung:** **Ein Self-hosted-Deploy = eine Organisation** — ein logischer Mandant pro Instanz (SQLite, Daten beim Kunden). Kein gemeinsames Multi-Tenant-SaaS zum Markteintritt. Erst wenn MSP oder geteilte Instanz **bewusst** verkauft wird: technisches Mandantenmodell nachziehen (dann typischerweise Postgres + strikte Filter oder RLS).

### Todos

- [x] In **`handbuch.md`** festhalten: eine Installation = eine Organisation; keine `tenant_id`-Pflicht im Code erzwingen.
- [ ] **Später (Trigger: Vertrag/Produkt „mehrere Mandanten eine DB“):** Schema-Design mit `tenant_id` auf allen Geschäftstabellen + keine Queries ohne Mandantenfilter; Postgres evaluieren statt SQLite für dieses Modell.

---

## Organisationen und Teams

**Entscheidung:** **Nach** einem stabilen Mandantenmodell (siehe [Mandantenfähigkeit](#mandantenfähigkeit)). Für Launch und Einzelorganisation pro Instanz reichen **globale Rollen** (Admin/User o.Ä.) — keine Pflicht für Teams.

### Todos

- [x] Teams/`team_id` **nicht** vor klarem Mandanten- und Berechtigungsbedarf implementieren — festgehalten in dieser Datei und [`handbuch.md`](./handbuch.md) (Rollenmatrix).
- [ ] Sobald Teams anstehen: `team_id` auf Software/Templates; Nutzer mehreren Teams zuordenbar; globale Admins sehen alles — **Matrix in `docs/`** ergänzen.

---

## Architektur: Domain vs. HTTP vs. Persistenz

**Entscheidung:** „Clean Architecture light“ — **kein Big-Bang-Refactor**. Neue und wachsende Features strikter schichten; dünne Routen dürfen dünn bleiben. Passt zur schlanken Self-hosted-Lieferung (ein Deploy, fokussierte Iteration).

### Todos

- [x] Konvention dokumentiert: `src/lib/server/domain/README.md` — Use-Cases ohne HTTP; Repos für DB.
- [x] Bestehende Routen **nicht** flächig umgebaut; bei neuen Features dort ablegen, sobald die Route unübersichtlich wird.

---

## SAML 2.0 / OIDC neben Entra

**Entscheidung:** **Nicht Launch-Pflicht**. Wenn Erweiterung nötig wird: **zuerst OIDC** (ein konfigurierbarer Provider: Issuer, Client-ID, Secret, Redirect) — deckt viele IdPs (Keycloak, Okta, Google …). **SAML SP** nur wenn ein Pilot **ausdrücklich** nur SAML anbietet.

### Todos

- [ ] OIDC: Umgebungsvariablen + Callback-Route; Nutzer wie bei Entra an interne ID anbinden (stabiles `sub`).
- [x] Redirect-URIs / Secret-Rotation: [`betrieb.md`](./betrieb.md) Abschnitt Secret-Rotation (Zeile OIDC-Client).
- [ ] SAML: Backlog bis Pilot-Anforderung; nicht parallel drei Protokolle pflegen.

---

## RBAC und ABAC

**Entscheidung:** **RBAC mit wenigen, klaren Permissions** — konsistent in API und UI. **ABAC** (Attribut-Regeln) erst bei **konkretem Kunden-Audit**, nicht spekulativ bauen.

### Todos

- [x] Permissions benannt in **`src/lib/server/auth/roles.ts`** — konsistent über `getRolePermissions` / Client `hasPermission`.
- [x] **Tabelle Rolle × Permission:** [`handbuch.md`](./handbuch.md).
- [ ] ABAC: erst Ticket mit **konkretem Regelbeispiel** (z.B. Export nur ohne Klassifizierung „secret“); bis dahin nicht implementieren.

---

## SCIM User Provisioning

**Entscheidung:** **Nach erstem kommerziellen Traktion**, nicht zum Markteintritt. Bis dahin: Nutzer **manuell** oder über **bestehenden IdP-Flow** (Entra/OIDC).

### Konfliktregel (Policy vor Implementierung)

Wenn SCIM später gebaut wird:

- **IdP ist führend** für Identität und Gruppenmitgliedschaft: Änderungen aus SCIM überschreiben die den Nutzer betreffenden **Rollen-Zuordnungen**, die aus SCIM-Gruppen gemappt sind.
- **Manuelle Sonderrollen** im Produkt (falls vorhanden): entweder **nicht mit SCIM gemischt** oder explizit als „lokal und wird nicht von SCIM angefasst“ markiert — Detail beim Implementieren festlegen.

### Todos

- [x] Policy: SCIM **nicht** implementieren ohne **schriftlichen Bedarf** (Vertrag/Security-Review) — hier dokumentiert.
- [ ] Wenn go: SCIM 2.0 unter `/scim/v2`, Bearer-Token nur für diesen Pfad; IdP-Gruppen → Rollen mapping konfigurierbar; Deaktivieren bei User-Delete aus IdP.
- [x] Konfliktregel dokumentiert (siehe Abschnitt oben).

---

## Service Accounts und API-Schlüssel (CI/CD)

**Entscheidung:** Maschinenzugang ist für **Packaging-Pipelines** oft wichtiger als zusätzliche IdPs — **mittelfristig priorisieren**, sobald API stabil genug für Automation verkauft wird. API-Schlüssel **nur gehasht**, Klartext nur bei Erstellung.

### Todos

- [x] Datenmodell: Hash des API-Schlüssels, optional Label, Ablaufdatum, **Scopes** analog zu Permissions (`export:run`, …) — Tabelle `api_keys`, `src/lib/server/auth/api-key-scopes.ts`, `api-key-crypto.ts`, `repo/api-keys.repo.ts`.
- [ ] Auth-Middleware: Bearer-API-Schlüssel akzeptieren; gleiche Rate-Limits wie schreibende User.
- [ ] Einmal-Anzeige des Klartext-API-Schlüssels bei Erstellung; Rotation = zweiten API-Schlüssel anlegen, alten widerrufen.

---

## Step-Up Authentication

**Stand:** Nicht im Produkt — früherer MVP (JWT `stepUpUntilMs`, `POST /api/auth/step-up`, Passwort vor PSADT-Export für Dev-Login) wurde in der Alpha wieder entfernt. Wiederaufnahme: eigenes Epic mit klarem Threat-Model.
