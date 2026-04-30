# Produkt und Markt

**Marktziel**, Positionierung, Marktreife, Launch-Checkliste. Operatives Backlog: [`TODO.md`](../TODO.md).

---

## Marktziel (Markteintritt)

**Ein Satz:** Self-hosted Web-App für Packaging-Teams/MSPs — PSADT-Pakete (Bibliothek, Vorlagen, Skripte, Exporte), optional Entra + KI, **Daten beim Kunden** (Linux-VM/Container, Bun, SQLite standard).

**Zielgruppe:** Packaging-/Client-Management in Mittelstand/Konzerne/MSPs; **DACH** primär (UI/Doku DE). **Buyer:** IT-/Ops-Leitung; **Champion:** Senior Packaging / Tooling.

**Angebot:** Self-hosted; Runtime siehe `README.md`; SQLite Standard; Postgres später möglich; Lizenzierung individuell (kein Pflicht-SaaS-Billing zum Launch).

**Muss zum Launch (Produkt + „verkaufbar“):** Was `README.md` als Kern nennt + **Doku** (Install/Backup/Upgrade, Nutzerkurz) + **Support-Kanal** + **rechtliche Minimalbesetzung** DE/EU (Impressum/Datenschutz, AVV-Prozess mit Legal).

**Non-Goals (Launch):** Multi-Tenant-SaaS für viele unkündbare Kunden; Voll-Billing/ERP; SAML/OIDC für beliebige IdPs als Pflicht; Mobile-first/Offline/VSCode-Extension/öffentlicher Template-Marktplatz; Moonshots (Voice/AR/…); Chaos-Programm / Multi-Region-HA als Standardversprechen.

**Erfolg „Launch“:** technisch Release+CI grün; Betrieb aus Doku reproduzierbar; **Pilot oder Rahmenvertrag**; Compliance zu KI/Hosting + Offboarding geklärt — siehe [Launch-Checkliste](#launch-checkliste).

**Verweise:** `CURSOR.md`, `README.md`, `TODO.md`, `roadmap-enterprise.md`, `compliance.md`.

---

## Positionierung (Kurz)

Web-basierte **Packaging-Automation** für IT/MSP — Silent-Install, Vorlagen, PSADT-Export, optionale KI, on-prem/eigene Cloud.

**Abgrenzung:** Fokus wiederholbare Windows-Paketierung + SQLite + Entra; kein generischer CI-Artefakt-Builder als Kern.

---

## Marktreife (Einordnung)

**Grob ~6/10** zum „MSP-verkäuflichen“ Stand — interne Bewertung; Launch konkret über Checkliste.

**Stärken:** klare Produktdefinition, Stack, Security-Baseline, CI (`verify`), Tests, Features jenseits reiner Demo.

**Lücken:** freigegebene Legal-Texte; ggf. WCAG über aktuelles Inkrement; **einmalige** Launch-Review; KI-Versprechen mit Legal/Vertrieb wenn verkauft; Pilot/Vertrag = Geschäftsziel außerhalb Repo.

Technik/Betrieb eher **7–8**; GtM/Recht/A11y-Formalien eher **~5–6**.

---

## Launch-Checkliste

Owner/Datum im Ticket/Wiki.

**Technik**

- [ ] Release + **CHANGELOG**; SemVer/Tag konsistent
- [ ] `bun run verify` grün (CI)

**Betrieb**

- [ ] Deploy, Backup, Restore aus `handbuch.md` / `betrieb.md` **durchgespielt**

**Geschäft**

- [ ] Pilot oder Rahmenvertrag — außerhalb Code

**Compliance**

- [ ] KI/Hosting-Datenschutz dokumentiert (`compliance.md`)
- [ ] Export/Prozess Vertragsende (`compliance.md`, `TODO.md`)

_Orientierung im Repo: Admin-Export `POST /api/admin/instance-export`; Offboarding in `compliance.md`._
