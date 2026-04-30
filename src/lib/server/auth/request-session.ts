import { getCurrentUser } from './auth-service';
import { type SessionPayload, verifySessionToken } from './session-jwt';

/** Session-JWT nur aus dem HttpOnly-Cookie `authToken` (kein Bearer-Header). */
export function sessionTokenFromCookie(request: Request): string | undefined {
	const raw = request.headers.get('cookie');
	if (!raw) return undefined;
	const parts = raw.split(';').map((s) => s.trim());
	for (const p of parts) {
		if (p.startsWith('authToken=')) return decodeURIComponent(p.slice('authToken='.length));
	}
	return undefined;
}

/** Für Observability (Logs): gültige Session oder null — ohne Entra-Side-Effects. */
export async function getOptionalSessionUser(request: Request): Promise<SessionPayload | null> {
	const token = sessionTokenFromCookie(request);
	if (!token) return null;
	return verifySessionToken(token);
}

export async function requireSession(request: Request): Promise<SessionPayload> {
	const token = sessionTokenFromCookie(request);
	const user = await getCurrentUser(token);
	if (!user) {
		const e = new Error('Nicht angemeldet') as Error & { status: number };
		e.status = 401;
		throw e;
	}
	return user;
}
