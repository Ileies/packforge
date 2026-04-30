import z from 'zod';

import {
	forbiddenUnlessAnyPermission,
	forbiddenWithoutPermission,
	requireSessionApi
} from '$lib/server/auth/api-route-guards';
import { json } from '$lib/server/http/json';
import { parseRequestJson } from '$lib/server/http/parse-request-json';
import {
	getPowerShellLintProfile,
	parsePowerShellLintProfile,
	setPowerShellLintProfile
} from '$lib/server/powershell-lint-profile';

import type { RequestHandler } from './$types';

const postBodySchema = z.object({
	profile: z.enum(['strict', 'relaxed'])
});

export const GET: RequestHandler = async ({ request, locals }) => {
	const session = await requireSessionApi(request, locals);
	if (!session.ok) return session.response;
	const { user } = session;
	const denied = forbiddenUnlessAnyPermission(
		user,
		['VIEW_SCRIPT_EDITOR', 'VIEW_SETTINGS'],
		'Keine Berechtigung für das Lint-Profil und für Einstellungen.',
		'PF_POWERSHELL_LINT_PROFILE_FORBIDDEN'
	);
	if (denied) return denied;
	return json({ profile: getPowerShellLintProfile() });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await requireSessionApi(request, locals);
	if (!session.ok) return session.response;
	const { user } = session;
	const denied = forbiddenWithoutPermission(
		user,
		'MANAGE_AI_KEYS',
		'Keine Berechtigung für die Änderung des Lint-Profils.',
		'PF_POWERSHELL_LINT_PROFILE_ADMIN'
	);
	if (denied) return denied;
	const parsed = await parseRequestJson(request, postBodySchema);
	if (!parsed.ok) return parsed.response;
	const raw = parsed.data.profile;
	const profile = parsePowerShellLintProfile(raw);
	setPowerShellLintProfile(profile);
	return json({ success: true, profile });
};
