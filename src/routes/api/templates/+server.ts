import z from 'zod';

import { forbiddenWithoutPermission, requireSessionApi } from '$lib/server/auth/api-route-guards';
import {
	jsonWithConditionalGet,
	utcDateFromSqliteLocalDatetime,
	weakEtagFromParts
} from '$lib/server/http/conditional-get';
import { json } from '$lib/server/http/json';
import { parseRequestJson } from '$lib/server/http/parse-request-json';
import * as repo from '$lib/server/repo/templates.repo';

import type { RequestHandler } from './$types';

const postBodySchema = z.object({
	content: z.string().min(1, 'Inhalt ist erforderlich.'),
	majorVersion: z.union([z.number(), z.string()]).optional()
});

export const GET: RequestHandler = async ({ request, locals }) => {
	const session = await requireSessionApi(request, locals);
	if (!session.ok) return session.response;
	const denied = forbiddenWithoutPermission(
		session.user,
		'VIEW_TEMPLATE_EDITOR',
		'Keine Berechtigung für den Vorlagen-Editor.',
		'PF_TEMPLATE_EDITOR_FORBIDDEN'
	);
	if (denied) return denied;

	const rev = repo.getTemplateListRevision();
	const data = repo.listTemplateSummaries();
	const etag = weakEtagFromParts('templates', [rev.count, rev.maxId, rev.maxCreated]);
	return jsonWithConditionalGet(request, data, {
		etag,
		lastModified: utcDateFromSqliteLocalDatetime(rev.maxCreated),
		cacheControl: 'private, max-age=0, must-revalidate',
		varyCookie: true
	});
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await requireSessionApi(request, locals);
	if (!session.ok) return session.response;
	const denied = forbiddenWithoutPermission(
		session.user,
		'EDIT_TEMPLATES',
		'Keine Berechtigung für das Anlegen oder Bearbeiten von Vorlagen.',
		'PF_TEMPLATES_EDIT_FORBIDDEN'
	);
	if (denied) return denied;

	const parsed = await parseRequestJson(request, postBodySchema);
	if (!parsed.ok) return parsed.response;
	const { content, majorVersion } = parsed.data;
	const major = Math.max(1, Math.floor(Number(majorVersion)) || 1);
	const minor = repo.getNextMinorVersion(major);
	const id = repo.insertTemplate(content, major, minor);
	return json({ success: true, id, majorVersion: major, minorVersion: minor });
};
