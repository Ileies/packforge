import { writeAuditLog } from '$lib/server/audit-log';
import { forbiddenWithoutPermission, requireSessionApi } from '$lib/server/auth/api-route-guards';
import { apiJsonError, notFound } from '$lib/server/http/errors';
import { buildPsadtZipResponse } from '$lib/server/psadt-export';
import * as softwareRepo from '$lib/server/repo/software.repo';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals, request }) => {
	const session = await requireSessionApi(request, locals);
	if (!session.ok) return session.response;
	const { user } = session;
	const deniedExport = forbiddenWithoutPermission(
		user,
		'EXPORT_PSADT',
		'Keine Berechtigung für den PSADT-Export.',
		'PF_PSDT_EXPORT_FORBIDDEN'
	);
	if (deniedExport) return deniedExport;

	const id = Number(params.id);
	const row = softwareRepo.getSoftwareByIdForPsadtExport(id);
	if (!row) return notFound('Software nicht gefunden.', 'PF_SOFTWARE_NOT_FOUND');

	writeAuditLog({
		action: 'psadt_export',
		userId: user.id,
		traceId: locals.traceId,
		detail: { softwareId: id }
	});

	try {
		return buildPsadtZipResponse(row);
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Export fehlgeschlagen.';
		return apiJsonError('Export fehlgeschlagen.', 500, 'PF_PSDT_EXPORT_FAILED', {
			extras: { success: false, message: msg }
		});
	}
};
