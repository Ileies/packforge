import type { SoftwareSummary } from './script-editor-types';

/** Legacy-kompatibler localStorage-Key für freie KI-HTML-Ansicht */
export const AI_HTML_STORAGE_PREFIX = 'packforge_ai_response_';

export function storageKeyForAiHtml(softwareId: string): string {
	return `${AI_HTML_STORAGE_PREFIX}${softwareId}`;
}

export function cmpSemVerLike(a: string | null, b: string | null): number {
	return String(a ?? '').localeCompare(String(b ?? ''), undefined, {
		numeric: true,
		sensitivity: 'base'
	});
}

/** Gruppiert Software nach Name, sortiert Versionen und Gruppennamen. */
export function groupSoftwareSummaries(software: SoftwareSummary[]): [string, SoftwareSummary[]][] {
	const buckets: Record<string, SoftwareSummary[]> = {};
	for (const s of software) {
		(buckets[s.name] ??= []).push(s);
	}
	for (const list of Object.values(buckets)) {
		list.sort((x, y) => cmpSemVerLike(x.version, y.version));
	}
	return Object.entries(buckets).sort((a, b) => a[0].localeCompare(b[0]));
}

export function readAiHtmlFromStorage(softwareId: string): string {
	if (typeof window === 'undefined') return '';
	try {
		return localStorage.getItem(storageKeyForAiHtml(softwareId)) ?? '';
	} catch {
		return '';
	}
}

export function writeAiHtmlToStorage(
	softwareId: string,
	html: string
): { ok: true } | { ok: false; error: string } {
	try {
		localStorage.setItem(storageKeyForAiHtml(softwareId), html);
		return { ok: true };
	} catch {
		return { ok: false, error: 'Speichern in localStorage fehlgeschlagen.' };
	}
}

/** Formatiert `form_data` aus der API-Zeile für die JSON-Textarea. */
export function formDataRawFromRow(form_data: unknown): string {
	try {
		return JSON.stringify(form_data != null ? JSON.parse(String(form_data)) : {}, null, 2);
	} catch {
		return '{}';
	}
}
