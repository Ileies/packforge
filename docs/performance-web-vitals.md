# Web-Vitals: Kernrouten und Zielwerte

Ergänzt die API-orientierte Baseline in [`performance-baseline.md`](./performance-baseline.md). Hier geht es um **Core Web Vitals** in der **Lab-Messung** (Lighthouse / lokale Navigation), damit Regressionen sichtbar werden. Feld-Daten (CrUX, RUM) sind optional und umgebungsabhängig.

---

## Metriken (Kurz)

| Metrik  | Bedeutung                                                                        | „Gut“ (Google, Orientierung) | „Schlecht“ (Orientierung) |
| ------- | -------------------------------------------------------------------------------- | ---------------------------- | ------------------------- |
| **LCP** | Largest Contentful Paint — wann der größte sichtbare Inhalt stabil gerendert ist | ≤ **2,5 s**                  | > **4 s**                 |
| **INP** | Interaction to Next Paint — Reaktionsfähigkeit nach Nutzereingaben               | ≤ **200 ms**                 | > **500 ms**              |
| **CLS** | Cumulative Layout Shift — unerwartete Layout-Sprünge                             | ≤ **0,1**                    | > **0,25**                |

Quelle: [Web Vitals](https://web.dev/articles/vitals) (Schwellen können sich weiterentwickeln — Tabelle bei großen Releases prüfen).

---

## Kernrouten (PackForge)

Routen, die den Alltag am stärksten prägen und bei denen wir Vitals **zuerst** betrachten:

| Route               | Rolle                                    | Schwerpunkt Vitals                                      |
| ------------------- | ---------------------------------------- | ------------------------------------------------------- |
| `/login`            | Einstieg, oft erste paintlastige Ansicht | **LCP**, CLS (Fonts/Layout)                             |
| `/welcome`          | Nach Login, viel Karten-Layout           | **LCP**, CLS                                            |
| `/software-library` | Liste, Filter, Paginierung               | **LCP** (Tabelle/Karten), **INP** (Suche, Klicks)       |
| `/script-editor`    | Ace-Editor, Sidebars, viel Interaktion   | **INP** (Tippen, Lint, Speichern), LCP nach Datenladung |
| `/script-maker`     | Formular + Generator-Flow                | **INP**, LCP                                            |
| `/template-editor`  | analog Script-Maker / Editor-Pattern     | **INP**, LCP                                            |
| `/stammdaten`       | große Tabellen + Formular                | **INP**, LCP                                            |

Öffentliche Statikseiten (`/impressum`, `/datenschutz`, …) bei Bedarf gezielt, nicht prioritär gegenüber den Arbeitsflächen oben.

---

## Projektziele (Lab, Ausgangslage)

Die folgenden Werte sind **Zielkorridore** für Messungen unter **Lighthouse „Navigation“**, Gerät **Mobile** (simuliertes Throttling), **kühler** Ladevorgang (Cache leeren oder Hard-Reload). Sie entsprechen den Google-„gut“-Schwellen, soweit für diese App sinnvoll.

| Metrik | Ziel (Lab, Mobile) | Anmerkung                                                                                                                                                  |
| ------ | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LCP    | **≤ 2,5 s**        | Auf `/script-editor` mit großem Skript kann die Datenphase dominieren — dann LCP nach sichtbarem Shell-Frame + primärem Block messen und Trend beobachten. |
| INP    | **≤ 200 ms**       | Schwergewicht **Script-Editor** / **Script-Maker**; Ace und große DOM-Bäume können drücken — Abweichung dokumentieren statt Ziel blind erzwingen.          |
| CLS    | **≤ 0,1**          | Besonders bei dynamischen Listen, Toasts und Dialogen prüfen.                                                                                              |

**Interpretation:** Liegen Werte dauerhaft über dem Ziel, zuerst **Ursache** (Netzwerk, Bundle, lange Tasks, Layout ohne feste Höhen) klären, dann gezielt optimieren; siehe `PERFORMANCE-LOGIC-TODO.md` (Vorher/Nachher).

---

## Messung (Chrome Lighthouse, manuell)

1. Entwicklertools öffnen → **Lighthouse** (oder Lighthouse-Panel).
2. Modus **Navigation**, Kategorie **Performance**, Gerät **Mobile** (für strengere INP/LCP-Simulation).
3. URL der **Kernroute** laden (eingeloggt, realistische Test-Session / Dev-Login).
4. **Analyse starten**; aus dem Report **LCP**, **INP** (bzw. „Interaction to Next Paint“ / TBT als Proxy in älteren Lighthouse-Versionen — bei neuen Builds **INP** verwenden) und **CLS** notieren.
5. **Dreimal** wiederholen, **Median** eintragen (Schwankungen durch JIT, Cache, Hintergrundtasks).

Optional Desktop-Profil zusätzlich dokumentieren, wenn die Hauptnutzung am großen Monitor erfolgt — Mobile bleibt der konservativere Standard.

---

## Messprotokoll (Vorlage)

| Route               | Datum / Build | Profil (Mobile/Desktop) | LCP (s) | INP (ms) | CLS | Notiz (z. B. Testnutzer, DB-Größe) |
| ------------------- | ------------- | ----------------------- | ------- | -------- | --- | ---------------------------------- |
| `/login`            |               |                         |         |          |     |                                    |
| `/welcome`          |               |                         |         |          |     |                                    |
| `/software-library` |               |                         |         |          |     |                                    |
| `/script-editor`    |               |                         |         |          |     |                                    |

---

## Später: Feld & CI

- **RUM:** Bibliothek [`web-vitals`](https://github.com/GoogleChrome/web-vitals) nur einführen, wenn Messwerte produktiv oder in Staging aggregiert werden dürfen (Datenschutz, Sampling).
- **CI:** Lighthouse als Schritt (z. B. gegen `vite preview` + Auth-Fixture) ist möglich, aber aufwändig wegen Login — getrenntes Ticket sinnvoll.
