import { env } from '$env/dynamic/private';

const DEFAULT_MAX_BYTES = 524_288_000; // 500 MiB

export class UploadTooLargeError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'UploadTooLargeError';
	}
}

function parseMaxBytes(): number {
	const raw = env.MAX_UPLOAD_BYTES;
	if (raw === undefined || raw === '') return DEFAULT_MAX_BYTES;
	const n = Number.parseInt(String(raw), 10);
	return Number.isFinite(n) && n > 0 ? n : DEFAULT_MAX_BYTES;
}

let cached: number | undefined;

/** Globales Limit pro Upload-Datei (Script Maker / multipart). Env: `MAX_UPLOAD_BYTES`. */
export function maxUploadBytesPerFile(): number {
	if (cached === undefined) cached = parseMaxBytes();
	return cached;
}

export function assertFileSizeWithinLimit(name: string, size: number, maxBytes: number): void {
	if (size > maxBytes) {
		throw new UploadTooLargeError(
			`Datei „${name}“ überschreitet das Limit von ${maxBytes} Bytes (MAX_UPLOAD_BYTES).`
		);
	}
}

/**
 * Obergrenze für die gesamte Multipart-Anfrage (Script-Maker), falls `Content-Length` gesetzt ist.
 * Richtet sich am Einzeldatei-Limit aus, mit Deckel 2 GiB.
 */
export function maxMultipartRequestBytes(): number {
	const per = maxUploadBytesPerFile();
	return Math.min(2 * 1024 * 1024 * 1024, per * 24);
}
