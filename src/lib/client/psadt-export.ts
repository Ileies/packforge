import { authHeaders, parseFailedResponse } from '$lib/client/api-fetch';
import { apiRoutes } from '$lib/client/api-routes';

export type PsadtExportResult = { ok: true } | { ok: false; error: string };

/**
 * PSADT-ZIP herunterladen (POST `/api/software/[id]/export`).
 */
export async function downloadPsadtExport(
	softwareId: number,
	downloadBasename: string,
	options?: { signal?: AbortSignal }
): Promise<PsadtExportResult> {
	const signal = options?.signal;
	try {
		const r = await fetch(apiRoutes.software.exportZip(softwareId), {
			method: 'POST',
			headers: authHeaders(),
			credentials: 'same-origin',
			signal
		});

		if (!r.ok) {
			const p = await parseFailedResponse(r);
			return { ok: false, error: p.message };
		}

		const blob = await r.blob();
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${downloadBasename.replace(/\s+/g, '_')}_PSADT.zip`;
		a.click();
		URL.revokeObjectURL(url);
		return { ok: true };
	} catch (e) {
		if (signal?.aborted || (e instanceof DOMException && e.name === 'AbortError')) {
			return { ok: false, error: 'Abgebrochen.' };
		}
		return { ok: false, error: e instanceof Error ? e.message : String(e) };
	}
}
