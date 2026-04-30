/**
 * Pfade unter `/api/*`, die **ohne** gültiges Session-Cookie erreichbar sind.
 * Alles andere wird in `hooks.server.ts` mit 401 abgewiesen, bevor der jeweilige Handler läuft.
 *
 * Nur hier pflegen — nicht in jedem Handler wiederholen.
 */
export function normalizeApiPathname(pathname: string): string {
	if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
	return pathname;
}

export function isApiPathSessionPublic(pathname: string, method: string): boolean {
	const p = normalizeApiPathname(pathname);
	const m = method.toUpperCase();

	if (p === '/api/csrf-token' && (m === 'GET' || m === 'HEAD')) return true;
	if (p === '/api/auth/config' && (m === 'GET' || m === 'HEAD')) return true;
	if (p === '/api/auth/login' && m === 'POST') return true;
	if (p === '/api/auth/dev-login' && m === 'POST') return true;
	/** Ohne Session: in Portfolio-Modus wird hier eine Gast-Session ausgestellt (`auth/me/+server.ts`). */
	if (p === '/api/auth/me' && (m === 'GET' || m === 'HEAD')) return true;

	return false;
}
