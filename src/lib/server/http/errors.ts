import { json } from './json';

/** Repository-Pfad zur API-Übersicht (Tabellen, Übersicht). */
export const API_DOC_OVERVIEW_REF = 'docs/api.md';

/** Anker zur normierten Fehlerbeschreibung (für alle `PF_*`-Antworten). */
export const API_DOC_ERROR_REF = 'docs/api.md#fehlerantwort-json';

export type ApiJsonErrorBody = {
	error: string;
	code: string;
	docRef: string;
};

type ErrorInit = ResponseInit & { extras?: Record<string, unknown> };

/**
 * Einheitliche JSON-Fehlerantwort: `error` (menschlich), `code` (stabil `PF_*`), `docRef`.
 * Zusatzfelder (z. B. `conflictSoftwareId`) über `extras`.
 */
export function apiJsonError(message: string, status: number, code: string, init?: ErrorInit): Response {
	const { extras, ...responseInit } = init ?? {};
	const body: Record<string, unknown> = {
		error: message,
		code,
		docRef: API_DOC_ERROR_REF,
		...(extras ?? {})
	};
	return json(body, { ...responseInit, status });
}

export function badRequest(message: string, code = 'PF_BAD_REQUEST') {
	return apiJsonError(message, 400, code);
}

export function jsonError(message: string, status: number, code = 'PF_ERROR') {
	return apiJsonError(message, status, code);
}

export function conflict(message: string, extras?: Record<string, unknown>) {
	return apiJsonError(message, 409, 'PF_CONFLICT_DUPLICATE_INSTALLER', { extras });
}

export function unauthorized(message: string, code = 'PF_UNAUTHORIZED') {
	return apiJsonError(message, 401, code);
}

export function forbidden(message: string, code = 'PF_FORBIDDEN', extras?: Record<string, unknown>) {
	return apiJsonError(message, 403, code, { extras });
}

export function notFound(message: string, code = 'PF_NOT_FOUND') {
	return apiJsonError(message, 404, code);
}

export function tooMany(message: string, code = 'PF_RATE_LIMIT', retryAfterSec?: number) {
	if (retryAfterSec === undefined) return apiJsonError(message, 429, code);
	return apiJsonError(message, 429, code, {
		headers: { 'Retry-After': String(retryAfterSec) },
		extras: { retryAfter: retryAfterSec }
	});
}

export function serverError(message: string, code = 'PF_INTERNAL') {
	return apiJsonError(message, 500, code);
}
