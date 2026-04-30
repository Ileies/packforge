import { forbiddenWithoutPermission, requireSessionApi } from '$lib/server/auth/api-route-guards';
import { resolveDetailView } from '$lib/server/http/detail-view';
import { notFound } from '$lib/server/http/errors';
import { json } from '$lib/server/http/json';
import * as repo from '$lib/server/repo/templates.repo';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url, request, locals }) => {
	const session = await requireSessionApi(request, locals);
	if (!session.ok) return session.response;
	const denied = forbiddenWithoutPermission(
		session.user,
		'VIEW_TEMPLATE_EDITOR',
		'Keine Berechtigung für den Vorlagen-Editor.',
		'PF_TEMPLATE_EDITOR_FORBIDDEN'
	);
	if (denied) return denied;

	const parsedView = resolveDetailView(url);
	if (!parsedView.ok) return parsedView.response;
	const id = Number(params.id);
	const row = parsedView.view === 'summary' ? repo.getTemplateSummaryById(id) : repo.getTemplateById(id);
	if (!row) return notFound('Vorlage nicht gefunden.', 'PF_TEMPLATE_NOT_FOUND');
	return json(row);
};
