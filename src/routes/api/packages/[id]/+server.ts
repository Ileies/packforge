import z from 'zod';

import { forbiddenWithoutPermission, requireSessionApi } from '$lib/server/auth/api-route-guards';
import { resolveDetailView } from '$lib/server/http/detail-view';
import { badRequest, notFound } from '$lib/server/http/errors';
import { json } from '$lib/server/http/json';
import { parseRequestJson } from '$lib/server/http/parse-request-json';
import * as pkg from '$lib/server/repo/packages.repo';

import type { RequestHandler } from './$types';

const putBodySchema = z.record(z.string(), z.unknown());

export const GET: RequestHandler = async ({ params, url, request, locals }) => {
	const session = await requireSessionApi(request, locals);
	if (!session.ok) return session.response;
	const denied = forbiddenWithoutPermission(
		session.user,
		'VIEW_STAMMDATEN',
		'Keine Berechtigung für die Stammdaten.',
		'PF_DATA_BASE_FORBIDDEN'
	);
	if (denied) return denied;

	const parsedView = resolveDetailView(url);
	if (!parsedView.ok) return parsedView.response;
	const id = parseInt(String(params.id), 10);
	if (Number.isNaN(id)) return badRequest('Ungültige Paket-ID', 'PF_INVALID_PACKAGE_ID');
	const row = parsedView.view === 'summary' ? pkg.getPackageByIdSummary(id) : pkg.getPackageById(id);
	if (!row) return notFound('Paket nicht gefunden', 'PF_PACKAGE_NOT_FOUND');
	return json(row);
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const session = await requireSessionApi(request, locals);
	if (!session.ok) return session.response;
	const denied = forbiddenWithoutPermission(
		session.user,
		'VIEW_STAMMDATEN',
		'Keine Berechtigung für die Stammdaten.',
		'PF_DATA_BASE_FORBIDDEN'
	);
	if (denied) return denied;

	const id = parseInt(String(params.id), 10);
	if (Number.isNaN(id)) return badRequest('Ungültige Paket-ID', 'PF_INVALID_PACKAGE_ID');
	const parsed = await parseRequestJson(request, putBodySchema);
	if (!parsed.ok) return parsed.response;
	pkg.updatePackageRow(id, parsed.data);
	return json({ success: true });
};
