import { getActiveModel } from '$lib/server/ai/model-selector';
import { forbiddenWithoutPermission, requireSessionApi } from '$lib/server/auth/api-route-guards';
import { json } from '$lib/server/http/json';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, locals }) => {
	const session = await requireSessionApi(request, locals);
	if (!session.ok) return session.response;
	const denied = forbiddenWithoutPermission(
		session.user,
		'MANAGE_AI_KEYS',
		'Keine Berechtigung für die KI-Einstellungen.',
		'PF_MANAGE_AI_KEYS_FORBIDDEN'
	);
	if (denied) return denied;

	return json({ activeModel: getActiveModel() });
};
