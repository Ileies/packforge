import { createHash } from 'node:crypto';

import { json } from './json';

/** SQLite `datetime('now', 'localtime')`-Strings grob als HTTP-Datum verwendbar machen. */
export function utcDateFromSqliteLocalDatetime(s: string): Date | undefined {
	if (!s) return undefined;
	const iso = /^\d{4}-\d{2}-\d{2} /.test(s) ? s.replace(' ', 'T') : s;
	const d = new Date(iso);
	return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Schwacher ETag aus Namespace + serialisierten Revisionsteilen (kurz, URL-sicher). */
export function weakEtagFromParts(namespace: string, parts: unknown[]): string {
	const h = createHash('sha256')
		.update(namespace)
		.update('\0')
		.update(JSON.stringify(parts))
		.digest('base64url');
	return `W/"${h}"`;
}

function splitIfNoneMatch(header: string): string[] {
	return header
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
}

/** True, wenn der Client mit If-None-Match einen Treffer auf unseren ETag meldet. */
export function ifNoneMatchHits(ifNoneMatch: string | null, etag: string): boolean {
	if (!ifNoneMatch) return false;
	const v = ifNoneMatch.trim();
	if (v === '*') return true;
	return splitIfNoneMatch(ifNoneMatch).some((c) => c === etag);
}

function appendCacheHeaders(h: Headers, cacheControl: string, lastModified?: Date, varyCookie?: boolean) {
	h.set('cache-control', cacheControl);
	if (lastModified && !Number.isNaN(lastModified.getTime())) {
		h.set('last-modified', lastModified.toUTCString());
	}
	if (varyCookie) h.set('vary', 'Cookie');
}

/**
 * JSON-Response mit ETag; bei passendem If-None-Match: 304 ohne Body.
 * `varyCookie` setzt `Vary: Cookie`, damit geteilte Caches nicht Nutzer vermischen.
 */
export function jsonWithConditionalGet(
	request: Request,
	data: unknown,
	options: {
		etag: string;
		lastModified?: Date;
		cacheControl: string;
		varyCookie?: boolean;
	}
): Response {
	const { etag, lastModified, cacheControl, varyCookie } = options;
	if (ifNoneMatchHits(request.headers.get('if-none-match'), etag)) {
		const headers = new Headers();
		headers.set('etag', etag);
		appendCacheHeaders(headers, cacheControl, lastModified, varyCookie);
		return new Response(null, { status: 304, headers });
	}
	const headers = new Headers();
	headers.set('etag', etag);
	appendCacheHeaders(headers, cacheControl, lastModified, varyCookie);
	return json(data, { headers });
}

/** Statische JSON-Payload: ETag = Hash des serialisierten Bodys. */
export function jsonWithWeakBodyEtag(
	request: Request,
	data: unknown,
	cacheControl: string,
	options?: { varyCookie?: boolean }
): Response {
	const body = JSON.stringify(data);
	const h = createHash('sha256').update(body).digest('base64url');
	const etag = `W/"${h}"`;
	if (ifNoneMatchHits(request.headers.get('if-none-match'), etag)) {
		const headers = new Headers();
		headers.set('etag', etag);
		appendCacheHeaders(headers, cacheControl, undefined, options?.varyCookie);
		return new Response(null, { status: 304, headers });
	}
	const headers = new Headers();
	headers.set('etag', etag);
	appendCacheHeaders(headers, cacheControl, undefined, options?.varyCookie);
	headers.set('content-type', 'application/json');
	return new Response(body, { headers });
}
