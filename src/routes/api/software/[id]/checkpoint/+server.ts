import z from 'zod';

import { forbiddenUnlessAnyPermission, requireSessionApi } from '$lib/server/auth/api-route-guards';
import { badRequest } from '$lib/server/http/errors';
import { json } from '$lib/server/http/json';
import { parseRequestJson } from '$lib/server/http/parse-request-json';
import * as cp from '$lib/server/repo/checkpoints.repo';

import type { RequestHandler } from './$types';

const postBodySchema = z.object({
	generatedScript: z.string().min(1, 'Skriptinhalt ist erforderlich.'),
	name: z.string().nullable().optional(),
	comment: z.string().nullable().optional(),
	author: z.string().nullable().optional()
});

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
	const parsed = await parseRequestJson(request, postBodySchema);
	if (!parsed.ok) return parsed.response;
	const body = parsed.data;
	const generatedScript = body.generatedScript;
	if (!softwareId) return badRequest('Ungültige Software-ID.', 'PF_INVALID_SOFTWARE_ID');
	const r = cp.saveCheckpoint(
		softwareId,
		generatedScript,
		body.name ?? null,
		body.comment ?? null,
		body.author ?? null
	);
	return json({ success: true, checkpointId: r.checkpointId, checkpointNumber: r.checkpointNumber });
};
