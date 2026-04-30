import z from 'zod';

import { getActiveModel, setActiveModel } from '$lib/server/ai/model-selector';
import { forbiddenWithoutPermission, requireSessionApi } from '$lib/server/auth/api-route-guards';
import { badRequest } from '$lib/server/http/errors';
import { json } from '$lib/server/http/json';
import { parseRequestJson } from '$lib/server/http/parse-request-json';

import type { RequestHandler } from './$types';

const postBodySchema = z.object({
	model: z.string().min(1, 'Modell ist erforderlich.')
});

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await requireSessionApi(request, locals);
	if (!session.ok) return session.response;
	const denied = forbiddenWithoutPermission(
		session.user,
		'MANAGE_AI_KEYS',
		'Keine Berechtigung für die Verwaltung von KI-Modellen.',
		'PF_MANAGE_AI_KEYS_FORBIDDEN'
	);
	if (denied) return denied;

	const parsed = await parseRequestJson(request, postBodySchema);
	if (!parsed.ok) return parsed.response;
	const { model } = parsed.data;
	try {
		setActiveModel(model);
		return json({ success: true, activeModel: getActiveModel() });
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Ungültige Eingabe.';
		return badRequest(msg, 'PF_AI_MODEL_INVALID');
	}
};
