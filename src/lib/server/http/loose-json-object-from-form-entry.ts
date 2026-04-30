import z from 'zod';

const flatObjectSchema = z.record(z.string(), z.unknown());

/**
 * Liest das Multipart-Feld `formData` (JSON-Text) und liefert ein flaches Objekt.
 * Ungültiges JSON, Arrays, Nicht-Objekte → `{}` (wie bisher im Software-Upload).
 */
export function looseJsonObjectFromFormEntry(value: FormDataEntryValue | null): Record<string, unknown> {
	const raw = value == null ? '{}' : typeof value === 'string' ? value : String(value);
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw || '{}');
	} catch {
		return {};
	}
	if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
	const r = flatObjectSchema.safeParse(parsed);
	return r.success ? r.data : {};
}
