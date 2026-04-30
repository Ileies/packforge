import { forbiddenWithoutPermission, requireSessionApi } from '$lib/server/auth/api-route-guards';
import { json } from '$lib/server/http/json';
import * as repo from '$lib/server/repo/templates.repo';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, request, locals }) => {
	const session = await requireSessionApi(request, locals);
	if (!session.ok) return session.response;
	const denied = forbiddenWithoutPermission(
		session.user,
		'VIEW_TEMPLATE_EDITOR',
		'Keine Berechtigung für den Vorlagen-Editor.',
		'PF_TEMPLATE_EDITOR_FORBIDDEN'
	);
	if (denied) return denied;

	const major = Number(params.majorVersion);
	return json({ nextMinorVersion: repo.getNextMinorVersion(major) });
};
