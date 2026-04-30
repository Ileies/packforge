import type { z } from 'zod';

import { badRequest } from './errors';
import { readJsonBodyLimited } from './read-json-body-limited';

export type ParseJsonFail = { ok: false; response: Response };

/**
 * Liest den JSON-Body mit Größenlimit, validiert mit Zod und liefert bei Fehler eine einheitliche 400-Antwort
 * (erste Issue-Meldung aus dem Schema, z.B. bei `.refine`).
 */
export async function parseRequestJson<T extends z.ZodType>(
	request: Request,
	schema: T
): Promise<{ ok: true; data: z.infer<T> } | ParseJsonFail> {
	const body = await readJsonBodyLimited(request);
	if (!body.ok) return body;
	const raw = body.raw;
	const parsed = schema.safeParse(raw);
	if (!parsed.success) {
		const msg = parsed.error.issues[0]?.message ?? 'Ungültiger Request-Body';
		return { ok: false, response: badRequest(msg, 'PF_SCHEMA_VALIDATION') };
	}
	return { ok: true, data: parsed.data };
}
