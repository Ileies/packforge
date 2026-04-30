import { forbiddenWithoutPermission, requireSessionApi } from '$lib/server/auth/api-route-guards';
import { jsonWithConditionalGet, weakEtagFromParts } from '$lib/server/http/conditional-get';
import * as pkg from '$lib/server/repo/packages.repo';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, request, locals }) => {
	const session = await requireSessionApi(request, locals);
	if (!session.ok) return session.response;
	const denied = forbiddenWithoutPermission(
		session.user,
		'VIEW_STAMMDATEN',
		'Keine Berechtigung für die Stammdaten.',
		'PF_DATA_BASE_FORBIDDEN'
	);
	if (denied) return denied;

	const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200);
	const offset = Number(url.searchParams.get('offset')) || 0;
	const search1 = url.searchParams.get('search1') || '';
	const search2 = url.searchParams.get('search2') || '';
	const sortColumn = url.searchParams.get('sortColumn') || '';
	const sortDirection = url.searchParams.get('sortDirection') || 'asc';
	const tableRev = pkg.getPackagesTableRevision();
	const total = pkg.countPackages(search1, search2);
	const packages = pkg.listPackages(limit, offset, search1, search2, sortColumn, sortDirection);
	const etag = weakEtagFromParts('packages', [
		tableRev.count,
		tableRev.maxId,
		tableRev.maxUpdated,
		limit,
		offset,
		search1,
		search2,
		sortColumn,
		sortDirection,
		total
	]);
	return jsonWithConditionalGet(
		request,
		{ packages, total },
		{
			etag,
			cacheControl: 'private, max-age=0, must-revalidate',
			varyCookie: true
		}
	);
};
