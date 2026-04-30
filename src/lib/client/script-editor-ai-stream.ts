import type { ApiErrorSurface } from './api-error-present';
import { msgErr } from './api-error-present';
import { authHeaders, parseFailedResponse } from './api-fetch';
import { apiRoutes } from './api-routes';

export type AiResponseStreamResult = { ok: true; text: string } | { ok: false; err: ApiErrorSurface };

function displayTextFromAiResponse(response: unknown): string {
	if (response == null) return '';
	if (typeof response === 'string') return response;
	const o = response as { output?: Array<{ type?: string; content?: Array<{ text?: string }> }> };
	const msg = o.output?.find((i) => i.type === 'message');
	const t = msg?.content?.[0]?.text;
	if (typeof t === 'string') return t;
	return JSON.stringify(response, null, 2);
}

/**
 * POST `apiRoutes.ai/response` — eine JSON-Antwort (`{ success, response }`), kein SSE.
 */
export async function runAiResponseStream(
	prompt: string,
	onDelta: (chunk: string) => void,
	options?: { signal?: AbortSignal }
): Promise<AiResponseStreamResult> {
	const signal = options?.signal;
	try {
		const res = await fetch(apiRoutes.ai.response, {
			method: 'POST',
			credentials: 'same-origin',
			headers: authHeaders(true),
			body: JSON.stringify({ prompt: prompt.trim() }),
			signal
		});
		if (!res.ok) {
			return { ok: false, err: await parseFailedResponse(res) };
		}
		const data = (await res.json()) as { success?: boolean; response?: unknown; error?: string };
		if (data.error) {
			return { ok: false, err: msgErr(data.error) };
		}
		const text = displayTextFromAiResponse(data.response);
		onDelta(text);
		return { ok: true, text };
	} catch (e) {
		if (signal?.aborted || (e instanceof DOMException && e.name === 'AbortError')) {
			return { ok: false, err: msgErr('Abgebrochen.') };
		}
		return { ok: false, err: msgErr(e instanceof Error ? e.message : String(e)) };
	}
}
