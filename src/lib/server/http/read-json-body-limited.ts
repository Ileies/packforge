import { MAX_REQUEST_JSON_BYTES, parseContentLengthHeader } from '$lib/shared/json-limit';

import { badRequest } from './errors';

export type ReadJsonFail = { ok: false; response: Response };

/**
 * Liest den Body als JSON mit Byte-Obergrenze: `Content-Length`-Vorabprüfung,
 * sonst begrenztes Stream-Lesen (falls kein `Content-Length` gesendet wurde).
 */
export async function readJsonBodyLimited(
	request: Request,
	maxBytes: number = MAX_REQUEST_JSON_BYTES
): Promise<{ ok: true; raw: unknown } | ReadJsonFail> {
	const cl = parseContentLengthHeader(request.headers.get('content-length'));
	if (cl !== null && cl > maxBytes) {
		return {
			ok: false,
			response: badRequest(
				`Der Request-Body ist zu groß (höchstens ${Math.round(maxBytes / (1024 * 1024))} MiB).`,
				'PF_REQUEST_BODY_TOO_LARGE'
			)
		};
	}

	if (cl !== null || request.body === null) {
		try {
			return { ok: true, raw: await request.json() };
		} catch {
			return {
				ok: false,
				response: badRequest('Der Request-Body ist kein gültiges JSON.', 'PF_JSON_INVALID')
			};
		}
	}

	const reader = request.body.getReader();
	const chunks: Uint8Array[] = [];
	let total = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			if (!value?.length) continue;
			if (total + value.length > maxBytes) {
				await reader.cancel().catch(() => {});
				return {
					ok: false,
					response: badRequest(
						`Der Request-Body ist zu groß (höchstens ${Math.round(maxBytes / (1024 * 1024))} MiB).`,
						'PF_REQUEST_BODY_TOO_LARGE'
					)
				};
			}
			total += value.length;
			chunks.push(value);
		}
	} catch {
		return {
			ok: false,
			response: badRequest('Der Request-Body ist kein gültiges JSON.', 'PF_JSON_INVALID')
		};
	}

	let text: string;
	if (total === 0) {
		text = '';
	} else if (chunks.length === 1) {
		text = new TextDecoder().decode(chunks[0] as Uint8Array);
	} else {
		const merged = new Uint8Array(total);
		let off = 0;
		for (const c of chunks) {
			merged.set(c, off);
			off += c.length;
		}
		text = new TextDecoder().decode(merged);
	}

	try {
		const raw = text.trim() === '' ? undefined : JSON.parse(text);
		return { ok: true, raw };
	} catch {
		return {
			ok: false,
			response: badRequest('Der Request-Body ist kein gültiges JSON.', 'PF_JSON_INVALID')
		};
	}
}
