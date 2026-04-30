import { assertAiDailyBudgetAllows } from '$lib/server/ai/daily-budget';
import { openaiTestConnection } from '$lib/server/ai/openai-client';
import { forbiddenWithoutPermission, requireSessionApi } from '$lib/server/auth/api-route-guards';
import { tooMany } from '$lib/server/http/errors';
import { json } from '$lib/server/http/json';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await requireSessionApi(request, locals);
	if (!session.ok) return session.response;
	const denied = forbiddenWithoutPermission(
		session.user,
		'MANAGE_AI_KEYS',
		'Keine Berechtigung für den Test der KI-Anbindung.',
		'PF_MANAGE_AI_KEYS_FORBIDDEN'
	);
	if (denied) return denied;

	const budget = assertAiDailyBudgetAllows();
	if (!budget.ok) return tooMany(budget.message, 'PF_AI_DAILY_BUDGET');
	const r = await openaiTestConnection();
	/** Verbindungstest zählt nicht gegen `AI_DAILY_MAX_REQUESTS` (nur echte KI-Läufe). */
	return json(r);
};
