import type { Row } from '$lib/client/data-editor-types';

/** Nach Löschen: nächstes wählbares Feld (nicht System), sonst davor. */
export function nextSelectableIdAfterDelete(list: Row[], deletedIndex: number): number | null {
	for (let j = deletedIndex + 1; j < list.length; j++) {
		if (!list[j].is_system_field) return list[j].id;
	}
	for (let j = deletedIndex - 1; j >= 0; j--) {
		if (!list[j].is_system_field) return list[j].id;
	}
	return null;
}

/** Akzeptiert Legacy-Importformat und normalisiert auf den API-Body. */
export function buildImportBody(parsed: unknown): Record<string, unknown> | null {
	if (Array.isArray(parsed)) return { formfields: parsed, mode: 'append' };
	if (
		typeof parsed === 'object' &&
		parsed !== null &&
		Array.isArray((parsed as { formfields?: unknown }).formfields)
	) {
		return parsed as Record<string, unknown>;
	}
	return null;
}
