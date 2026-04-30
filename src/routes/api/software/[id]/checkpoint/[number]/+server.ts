import { forbiddenWithoutPermission, requireSessionApi } from '$lib/server/auth/api-route-guards';
import { badRequest, notFound } from '$lib/server/http/errors';
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
	const n = Number(params.number);
	if (!softwareId || !n) return badRequest('Ungültige Parameter.', 'PF_INVALID_PARAMETERS');
	const row = cp.getCheckpointByNumber(softwareId, n);
	if (!row) return notFound('Checkpoint nicht gefunden.', 'PF_CHECKPOINT_NOT_FOUND');
	return json(row);
};
