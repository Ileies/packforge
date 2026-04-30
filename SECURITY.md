# Sicherheitshinweise

## Geheimnisse

- **`JWT_SECRET`**, **`DEV_LOGIN_PASSWORD`**, API-Schlüssel und Azure-Credentials **nur** in `.env` (lokal) bzw. in den Geheimnis-Mechanismen eures Hostings — **niemals** ins Git-Repository committen.
- `.env` und Varianten sind per [`.gitignore`](./.gitignore) ausgeschlossen; vor dem ersten Push prüfen: `git ls-files | grep -E '\.env'` sollte **leer** sein (außer ggf. explizit gewollter Beispieldateien).
- Wurde eine echte `.env` oder ein Secret je versehentlich geteilt: **Werte sofort rotieren** (neues JWT → alle Sessions ungültig; neues Dev-Passwort; API-Keys im Provider widerrufen).

## Meldung von Schwachstellen

Bitte meldet Sicherheitsprobleme **vertraulich** (nicht als öffentliches GitHub-Issue mit Exploit-Details), z. B. per privater Nachricht an die Repository-Inhaber:in oder über die auf der persönlichen Website angegebene Kontaktmöglichkeit.

## Betrieb

- Produktion: TLS, starke Secrets, sinnvolle Rate-Limits (siehe `docs/betrieb.md`).
- Dev-Login auf öffentlich erreichbaren Hosts: nur mit **`DEV_LOGIN_PASSWORD`** (mindestens 16 Zeichen) und **`AUTH_ENTRA_OPTIONAL_IN_PRODUCTION`**, siehe `validate-env.ts` und `.env.example`.
