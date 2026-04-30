/** Öffentlicher Produktname (Sidebar, Login, Seitentitel, Meta). */
export const PRODUCT_NAME = 'PackForge';

/** Kurzbeschreibung des Einsatzgebiets (Navigation, kein UI-Badge). */
export const PRODUCT_DOMAIN_LINE = 'PSADT · Windows-Verteilung';

/**
 * Öffentliche Live-Instanz (eine Domain). Dient u. a. kanonischen Links, Open-Graph und
 * MSAL-Redirect, wenn `AZURE_REDIRECT_URI` nicht gesetzt ist (nur außerhalb `dev`).
 */
export const PRODUCT_PUBLIC_ORIGIN = 'https://packforge.ileies.de';

/** Hostname der Live-Instanz (ohne Schema). */
export const PRODUCT_PUBLIC_HOST = 'packforge.ileies.de';

/** Öffentliches Git-Repository (Sidebar / Kopfzeile). */
export const PRODUCT_GITHUB_REPO_URL = 'https://github.com/ileies/packforge';

/** npm-/Paketname (`package.json`). */
export const PRODUCT_PACKAGE_NAME = 'packforge';

/** localStorage-Schlüssel für Hell-/Dunkel-Theme. */
export const THEME_STORAGE_KEY = 'packforge-theme';

/**
 * CSRF-Double-Submit-Cookie (nicht HttpOnly); muss mit Client übereinstimmen.
 * Bei Umbenennung erhalten Nutzer ein neues Cookie nach nächstem Laden.
 */
export const CSRF_COOKIE_NAME = 'packforge_csrf';

/**
 * JWT issuer / audience für Session- und Dev-Login-Tokens.
 * Änderung invalidiert bestehende Sessions.
 */
export const JWT_ISS = 'packforge.app';
export const JWT_AUD = 'packforge-api';
