import { CSRF_COOKIE_NAME } from '$lib/csrf-constants';

import type { ApiErrorSurface } from './api-error-present';

function readCsrfFromDocument(): string | undefined {
	if (typeof document === 'undefined') return undefined;
	const m = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE_NAME}=([^;]*)`));
	return m?.[1] ? decodeURIComponent(m[1]) : undefined;
}

/** Header für API-Aufrufe: CSRF-Double-Submit; Session per HttpOnly-Cookie (`credentials: same-origin`). */
export function authHeaders(json = false): Record<string, string> {
	const h: Record<string, string> = {};
	const csrf = readCsrfFromDocument();
	if (csrf) h['X-CSRF-Token'] = csrf;
	if (json) h['Content-Type'] = 'application/json';
	return h;
}

export async function parseFailedResponse(r: Response): Promise<ApiErrorSurface> {
	const parsed = await readErrorBody(r);
	return {
		message: parsed.message,
		status: r.status,
		code: parsed.code,
		docRef: parsed.docRef
	};
}

async function readErrorBody(r: Response): Promise<{
	message: string;
	code?: string;
	docRef?: string;
}> {
	const ct = r.headers.get('content-type') || '';
	try {
		if (ct.includes('application/json')) {
			const j = (await r.json()) as { error?: string; code?: string; docRef?: string };
			return {
				message: j.error ?? r.statusText,
				code: j.code,
				docRef: j.docRef
			};
		}
		const t = await r.text();
		return { message: t || r.statusText };
	} catch {
		return { message: r.statusText };
	}
}

export type ApiJsonResult<T> =
	| { ok: true; data: T }
	| { ok: false; status: number; error: string; code?: string; docRef?: string };

/**
 * Einheitliche Client-JSON-API: `authHeaders`, optional `jsonBody` (POST/PUT/PATCH),
 * Fehler aus `{ error }` oder Rohtext.
 */
export async function apiJson<T = unknown>(
	url: string,
	init: RequestInit & { jsonBody?: unknown } = {}
): Promise<ApiJsonResult<T>> {
	const { jsonBody, headers: initHeaders, ...rest } = init;
	const useJsonBody = jsonBody !== undefined;
	const headers = new Headers(initHeaders);
	for (const [k, v] of Object.entries(authHeaders(useJsonBody))) {
		if (!headers.has(k)) headers.set(k, v);
	}
	const body = useJsonBody ? JSON.stringify(jsonBody) : rest.body;

	const r = await fetch(url, {
		...rest,
		credentials: 'same-origin',
		headers,
		body
	});

	if (!r.ok) {
		const parsed = await parseFailedResponse(r);
		return {
			ok: false,
			status: parsed.status ?? r.status,
			error: parsed.message,
			code: parsed.code,
			docRef: parsed.docRef
		};
	}

	const ct = r.headers.get('content-type') || '';
	if (ct.includes('application/json')) {
		const data = (await r.json()) as T;
		return { ok: true, data };
	}
	const text = await r.text();
	return { ok: true, data: text as unknown as T };
}
