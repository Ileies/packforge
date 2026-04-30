import { forbiddenWithoutPermission, requireSessionApi } from '$lib/server/auth/api-route-guards';
import { badRequest } from '$lib/server/http/errors';
import { json } from '$lib/server/http/json';
import * as cp from '$lib/server/repo/checkpoints.repo';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, request, locals }) => {
	const session = await requireSessionApi(request, locals);
	if (!session.ok) return session.response;
	const denied = forbiddenWithoutPermission(
		session.user,
		'VIEW_SCRIPT_EDITOR',
		'Keine Berechtigung für den Script-Editor.',
		'PF_SCRIPT_EDITOR_FORBIDDEN'
	);
	if (denied) return denied;

	const softwareId = Number(params.id);
	if (!softwareId) return badRequest('Ungültige Software-ID.', 'PF_INVALID_SOFTWARE_ID');
	return json(cp.listCheckpoints(softwareId));
};
