import { forbiddenWithoutPermission, requireSessionApi } from '$lib/server/auth/api-route-guards';
import { jsonWithWeakBodyEtag } from '$lib/server/http/conditional-get';
import { getSystemFields } from '$lib/server/system-fields';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, locals }) => {
	const session = await requireSessionApi(request, locals);
	if (!session.ok) return session.response;
	const denied = forbiddenWithoutPermission(
		session.user,
		'VIEW_DATA_EDITOR',
		'Keine Berechtigung für den Daten-Editor.',
		'PF_DATA_EDITOR_FORBIDDEN'
	);
	if (denied) return denied;

	return jsonWithWeakBodyEtag(request, getSystemFields(), 'private, max-age=0, must-revalidate', {
		varyCookie: true
	});
};
