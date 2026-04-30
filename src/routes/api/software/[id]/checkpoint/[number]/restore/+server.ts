import { forbiddenUnlessAnyPermission, requireSessionApi } from '$lib/server/auth/api-route-guards';
import { badRequest, jsonError } from '$lib/server/http/errors';
import { json } from '$lib/server/http/json';
import * as cp from '$lib/server/repo/checkpoints.repo';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const session = await requireSessionApi(request, locals);
	if (!session.ok) return session.response;
	const deniedEdit = forbiddenUnlessAnyPermission(
		session.user,
		['EDIT_ALL_SCRIPTS', 'EDIT_OWN_SCRIPTS'],
		'Keine Berechtigung für die Bearbeitung von Skripten.',
		'PF_SCRIPT_EDIT_FORBIDDEN'
	);
	if (deniedEdit) return deniedEdit;

	const softwareId = Number(params.id);
	const n = Number(params.number);
	if (!softwareId || !n) return badRequest('Ungültige Parameter.', 'PF_INVALID_PARAMETERS');
	try {
		cp.restoreCheckpoint(softwareId, n);
		return json({ success: true });
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Wiederherstellung fehlgeschlagen.';
		return jsonError(msg, 500, 'PF_CHECKPOINT_RESTORE_FAILED');
	}
};
