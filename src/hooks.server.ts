import type { Handle } from '@sveltejs/kit';

import { appLog } from '$lib/server/app-log';
import { isApiPathSessionPublic } from '$lib/server/auth/api-public-paths';
import { getCurrentUser } from '$lib/server/auth/auth-service';
import { sessionTokenFromCookie } from '$lib/server/auth/request-session';
import { CSRF_COOKIE } from '$lib/server/auth/session-cookies';
import { isCsrfExemptApi, MUTATING_METHODS } from '$lib/server/csrf-paths';
import { forbidden, tooMany, unauthorized } from '$lib/server/http/errors';
import { writeHttpAccessLog } from '$lib/server/http-access-log';
import { initPrompts } from '$lib/server/prompts';
import { checkRateLimit } from '$lib/server/rate-limit';
import { ensureAppSeed } from '$lib/server/seed-app';
import { traceIdFromRequest } from '$lib/server/trace-request-id';
import { assertValidPrivateEnv } from '$lib/server/validate-env';

/**
 * Einmal pro Server-Worker (Bun oder Node, je nach Start/Adapter): Prompts laden + App-Seed
 * (kein paralleles Doppel-Seed im selben Worker). Bei mehreren Workern hat jeder eigene RAM-Kopie —
 * bei Bedarf später Mutex/DB-Lock.
 */
let booted = false;

export const handle: Handle = async ({ event, resolve }) => {
	if (!booted) {
		booted = true;
		assertValidPrivateEnv();
		initPrompts();
		try {
			ensureAppSeed();
		} catch (e) {
			const bootTraceId = traceIdFromRequest(event.request);
			appLog.error('ensureAppSeed:', bootTraceId, e);
		}
	}

	const traceId = traceIdFromRequest(event.request);
	event.locals.traceId = traceId;
	const started = performance.now();

	const applySecurityHeaders = (response: Response): void => {
		response.headers.set('x-request-id', traceId);
		response.headers.set('X-Content-Type-Options', 'nosniff');
		response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
		response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	};

	const logAndReturn = async (response: Response): Promise<Response> => {
		applySecurityHeaders(response);
		const durationMs = Math.round(performance.now() - started);
		const user = event.locals.sessionUser ?? (await getCurrentUser(sessionTokenFromCookie(request)));
		writeHttpAccessLog({
			traceId,
			method: event.request.method,
			path: event.url.pathname,
			route: event.route.id,
			status: response.status,
			durationMs,
			userId: user?.id ?? null,
			tenantId: null
		});
		return response;
	};

	const { url, request } = event;

	const rl = checkRateLimit(event.getClientAddress(), url.pathname, request.method);
	if (rl.limited) {
		return logAndReturn(
			tooMany(
				'Zu viele Anfragen. Bitte kurz warten und es erneut versuchen.',
				'PF_RATE_LIMIT',
				rl.retryAfterSec
			)
		);
	}

	if (url.pathname.startsWith('/api')) {
		if (!isApiPathSessionPublic(url.pathname, request.method)) {
			const token = sessionTokenFromCookie(request);
			const user = await getCurrentUser(token);
			if (!user) {
				return logAndReturn(unauthorized('Nicht angemeldet', 'PF_AUTH_REQUIRED'));
			}
			event.locals.sessionUser = user;
		}
	}

	if (
		url.pathname.startsWith('/api') &&
		MUTATING_METHODS.has(request.method) &&
		!isCsrfExemptApi(url.pathname, request.method)
	) {
		const c = event.cookies.get(CSRF_COOKIE);
		const h = request.headers.get('x-csrf-token');
		if (!c || !h || c !== h.trim()) {
			return logAndReturn(forbidden('CSRF ungültig oder fehlend', 'PF_CSRF_INVALID'));
		}
	}

	const response = await resolve(event);
	return logAndReturn(response);
};
