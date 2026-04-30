/** Import/Audit-Grenze für JSON-Text (Roadmap §17 — große Felder). */
export const MAX_JSON_IMPORT_BYTES = 8 * 1024 * 1024;

/** Gleiche Obergrenze für `application/json`-API-Bodies (`parseRequestJson`). */
export const MAX_REQUEST_JSON_BYTES = MAX_JSON_IMPORT_BYTES;

/** `Content-Length` als Zahl oder `null` bei Fehlen/ungültig. */
export function parseContentLengthHeader(value: string | null): number | null {
	if (value == null || value.trim() === '') return null;
	const n = Number.parseInt(value.trim(), 10);
	if (!Number.isFinite(n) || n < 0) return null;
	return n;
}

export function assertJsonFileWithinLimit(sizeBytes: number, maxBytes = MAX_JSON_IMPORT_BYTES): void {
	if (sizeBytes > maxBytes) {
		throw new Error(`Datei zu groß (max. ${Math.round(maxBytes / (1024 * 1024))} MiB).`);
	}
}
