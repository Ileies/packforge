import z from 'zod';

import { forbiddenWithoutPermission, requireSessionApi } from '$lib/server/auth/api-route-guards';
import { json } from '$lib/server/http/json';
import { parseRequestJson } from '$lib/server/http/parse-request-json';
import * as repo from '$lib/server/repo/formfields.repo';

import type { RequestHandler } from './$types';

const postBodySchema = z.object({
	orderedIds: z.array(z.coerce.number())
});

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await requireSessionApi(request, locals);
	if (!session.ok) return session.response;
	const denied = forbiddenWithoutPermission(
		session.user,
		'MANAGE_FORMFIELDS',
		'Keine Berechtigung für die Verwaltung von Formularfeldern.',
		'PF_FORMFIELDS_FORBIDDEN'
	);
	if (denied) return denied;

	const parsed = await parseRequestJson(request, postBodySchema);
	if (!parsed.ok) return parsed.response;
	const { orderedIds } = parsed.data;
	orderedIds.forEach((id: number, index: number) => {
		repo.setSortOrder(Number(id), index);
	});
	return json({ success: true });
};
