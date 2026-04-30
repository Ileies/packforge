import { badRequest } from './errors';

export type DetailView = 'full' | 'summary';

export type ResolveDetailViewResult = { ok: true; view: DetailView } | { ok: false; response: Response };

/**
 * Liest `?view=` für Detail-Ressourcen.
 * - Default / leer / `full` / `detail` → `full`
 * - `summary` / `minimal` → `summary` (ohne große Text-/JSON-Felder, s. jeweilige Route)
 * - sonst → 400 `PF_INVALID_VIEW`
 */
export function resolveDetailView(url: URL): ResolveDetailViewResult {
	const raw = url.searchParams.get('view');
	if (raw === null || raw.trim() === '') return { ok: true, view: 'full' };
	const v = raw.trim().toLowerCase();
	if (v === 'full' || v === 'detail') return { ok: true, view: 'full' };
	if (v === 'summary' || v === 'minimal') return { ok: true, view: 'summary' };
	return {
		ok: false,
		response: badRequest(
			'Ungültiger Query-Parameter view (erlaubt: full, detail, summary, minimal).',
			'PF_INVALID_VIEW'
		)
	};
}
