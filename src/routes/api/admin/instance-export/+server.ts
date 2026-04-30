import { Readable } from 'node:stream';

import { writeAuditLog } from '$lib/server/audit-log';
import { forbiddenWithoutPermission, requireSessionApi } from '$lib/server/auth/api-route-guards';
import { createInstanceExportStream } from '$lib/server/instance-archive';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await requireSessionApi(request, locals);
	if (!session.ok) return session.response;
	const { user } = session;
	const denied = forbiddenWithoutPermission(
		user,
		'ADMIN_INSTANCE_EXPORT',
		'Keine Berechtigung für den Instanz-Export.',
		'PF_ADMIN_INSTANCE_EXPORT_FORBIDDEN'
	);
	if (denied) return denied;

	writeAuditLog({
		action: 'instance_export',
		userId: user.id,
		traceId: locals.traceId,
		detail: {}
	});

	const stream = createInstanceExportStream();
	const web = Readable.toWeb(stream);
	const safeDay = new Date().toISOString().slice(0, 10);
	return new Response(web as unknown as BodyInit, {
		headers: {
			'Content-Type': 'application/zip',
			'Content-Disposition': `attachment; filename="packforge-instance-export-${safeDay}.zip"`
		}
	});
};
