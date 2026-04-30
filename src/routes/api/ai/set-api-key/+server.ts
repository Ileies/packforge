import z from 'zod';

import { isAiProvider } from '$lib/app/ai-providers';
import { setApiKeyForActiveProvider, setApiKeyForProvider } from '$lib/server/ai/model-selector';
import { forbiddenWithoutPermission, requireSessionApi } from '$lib/server/auth/api-route-guards';
import { json } from '$lib/server/http/json';
import { parseRequestJson } from '$lib/server/http/parse-request-json';

import type { RequestHandler } from './$types';

const postBodySchema = z.object({
	apiKey: z.string().min(1, 'API-Schlüssel ist erforderlich.'),
	provider: z.string().optional()
});

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await requireSessionApi(request, locals);
	if (!session.ok) return session.response;
	const denied = forbiddenWithoutPermission(
		session.user,
		'MANAGE_AI_KEYS',
		'Keine Berechtigung für die Verwaltung von API-Schlüsseln.',
		'PF_MANAGE_AI_KEYS_FORBIDDEN'
	);
	if (denied) return denied;

	const parsed = await parseRequestJson(request, postBodySchema);
	if (!parsed.ok) return parsed.response;
	const { apiKey, provider: p } = parsed.data;
	if (p && isAiProvider(p)) setApiKeyForProvider(p, apiKey);
	else setApiKeyForActiveProvider(apiKey);
	return json({ success: true, message: 'API-Schlüssel gespeichert.' });
};
