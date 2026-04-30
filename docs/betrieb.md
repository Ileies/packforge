# Betrieb, Deployment, Sicherheit

Ergänzt [`handbuch.md`](./handbuch.md) (Admin). KI-Datenflüsse: [`compliance.md`](./compliance.md).

---

## Dev-Login, JWT, Staging

- **Production:** `validate-env.ts` blockiert u. a. schwaches `JWT_SECRET`, `COOKIE_INSECURE`, und unkontrolliertes Dev-Login.
- **Dev-Login in Production:** nur mit **`AUTH_ENTRA_OPTIONAL_IN_PRODUCTION=true`** (Betrieb ohne Entra) **und** **`DEV_LOGIN_PASSWORD`** (≥ 16 Zeichen); sonst Start-Fehler.
- **Mit `ALLOW_DEV_LOGIN`:** `JWT_SECRET` ≥ 32 Zeichen, nicht Platzhalter — auch außerhalb `production`.
- **Öffentlich erreichbar:** TLS, Netz-Abschirmung (VPN/IP-Allowlist), `DEV_LOGIN_PASSWORD` zwingend, wenn die Dev-Karte erreichbar ist.

---

## Backup & Restore (SQLite)

1. Sichern: SQLite-Dateien unter `DATA_ROOT` (inkl. `-wal`/`-shm` falls vorhanden); Secrets nicht im Klartext ins Backup.
2. Stillstand oder konsistente Kopie; Rhythmus nach RPO; Verschlüsselung am Speicherort; Restore-Tests quartalsweise.

**Restore:** App stoppen → Dateien aus Backup an konfigurierte Pfade → starten; Schema-Migration laut Release-Notes.

---

## Migrationen (versioniert)

SQL unter `drizzle/main/` und `drizzle/packages/`; beim Start wendet die App `migrate` an (siehe `run-sqlite-migrations.ts`). CLI: `bun run db:migrate` / `db:migrate:packages`. Schema-Änderungen: `db:generate` → PR-Review → Release mit Backup. `drizzle-kit push` bleibt optional für schnelles lokales Abgleichen, nicht als alleiniges Prod-Upgrade.

---

## Graceful Shutdown

Bei SIGTERM/SIGINT: HTTP `server.close()`, laufende Requests kurz drainen, keine neuen Langläufer; Exit 0. Konkrete Signal-Handler = separates Hardening-Ticket — hier nur **Zielbild**.

---

## Secrets

Sensible Werte nicht im Image-Klartext: Kubernetes `Secret`, Vault (Azure Key Vault, HashiCorp Vault, ESO/Sealed Secrets), `--env-file` aus secure Store. Rotation: [Kurz-Playbook](#secret-rotation).

---

## Secret-Rotation

| Secret           | Rotation (Kurz)                                                                 |
| ---------------- | ------------------------------------------------------------------------------- |
| `JWT_SECRET`     | Neu generieren (≥32) → Neustart → alle Sessions ungültig; Wartungsfenster       |
| DB-Dateien       | Backup vor Pfad-/Rechte-Änderung                                                |
| OpenAI/Anthropic | Neuen API-Schlüssel beim Anbieter erstellen, in der UI setzen, alten widerrufen |
| Azure App        | Portal-Anleitung; `AZURE_*` anpassen                                            |
| OIDC (später)    | Client-Secret + Redirects je Umgebung                                           |

---

## CORS & Edge

**Gleiche Origin** für UI + API → meist **kein CORS**. Getrennte Hosts: nur vertrauenswürdige Origins. Production: `adapter-node`, `ORIGIN`/`PUBLIC_URL`, TLS am Proxy.

**Kompression (gzip/brotli):** am **Reverse-Proxy** für JS/CSS/HTML/JSON — Beispiel: [`deploy/nginx-reverse-proxy.example.conf`](../deploy/nginx-reverse-proxy.example.conf). Keine doppelte Kompression; keine `gzip` für bereits komprimierte Medien.

**HTTP/2 / HTTP/3:** TLS-Edge multiplext viele Requests; Upstream zu Node oft HTTP/1.1 + Keep-Alive — ausreichend. `X-Forwarded-Proto` korrekt setzen.

### Cache: fingerprintete Static Assets (SvelteKit / adapter-node)

- **Pfade:** Unter `/_app/immutable/` liegen gebündelte JS-/CSS-Chunks und Assets mit **Hash im Dateinamen**. Ändert sich der Inhalt, ändert sich die URL — damit sind diese Antworten **lang und aggressiv** cachebar, ohne dass Clients veraltete Bundles behalten.
- **Was die Node-App sendet:** Der Static-Handler von `@sveltejs/adapter-node` setzt für erfolgreiche Antworten unter `/_app/immutable/` den Header `Cache-Control: public, max-age=31536000, immutable` (ein Jahr + `immutable`). Andere statische Dateien aus dem Client-Build (z. B. `/_app/version.json`, feste Namen ohne Hash) bekommen **kein** dieses Profil — sie dienen u. a. der **Invalidierung** neuer Builds und dürfen nicht mit demselben TTL wie `immutable/` behandelt werden.
- **HTML & Daten:** HTML- und Daten-Routen brauchen weiterhin kurzes bzw. revalidierendes Caching (SvelteKit-Verhalten, teils `must-revalidate`). JSON-APIs in diesem Projekt sind überwiegend mit `private` / Revalidation abgesichert — nicht mit dem Static-Asset-Profil verwechseln.
- **Reverse-Proxy / CDN:** Upstream-`Cache-Control` für `/_app/immutable/` **durchreichen** (Standard); nicht pauschal überschreiben oder für alle Pfade „lang cachen“. Optional kann ein Edge **`proxy_cache`** (nginx) oder CDN-Cache **nur** für `/_app/immutable/` genutzt werden — Schlüssel typisch volle URL inkl. Hash-Dateiname. Nach Deployments Cache-Policy beachten (TTL oder Purge), falls der Edge getrennt vom Origin-Build steht.

---

## WAF / Edge-Schutz

TLS-Terminierung, Basis-Anomalie-Filter, Rate-Limit ergänzend zur App. Regeln schmal halten; JSON-APIs bei OWASP CRS auf False Positives prüfen.

---

## Container-Scanning

Wenn OCI-Images gebaut werden: z. B. `trivy image --severity HIGH,CRITICAL …` nach `docker build`; in CI Schritt nach Build (z. B. `aquasecurity/trivy-action`). Grype als Alternative.

---

## Signierte Releases (cosign)

Ziel: Integrität von Images/Binaries/SBOMs. Keyless (OIDC in CI) oder HSM-Schlüssel; `cosign sign` / `verify` auf geschützten Tags/Branches. Konkrete Workflow-Zeilen: organisationsabhängig.
