import z from 'zod';

import { assertAiDailyBudgetAllows, recordAiDailySuccess } from '$lib/server/ai/daily-budget';
import { enrichUserRequest } from '$lib/server/ai/enrichment';
import {
	MAX_AI_FORM_DATA_JSON_CHARS,
	MAX_AI_LABEL_CHARS,
	MAX_AI_USER_TEXT_CHARS,
	rejectIfTooLong
} from '$lib/server/ai/input-limits';
import { forbiddenWithoutPermission, requireSessionApi } from '$lib/server/auth/api-route-guards';
import { apiJsonError, badRequest, tooMany } from '$lib/server/http/errors';
import { json } from '$lib/server/http/json';
import { parseRequestJson } from '$lib/server/http/parse-request-json';

import type { RequestHandler } from './$types';

const postBodySchema = z.object({
	userRequest: z.string().min(1, 'Nutzeranfrage ist erforderlich.'),
	softwareName: z.string().optional(),
	softwareVersion: z.string().optional(),
	formData: z.unknown().optional()
});

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await requireSessionApi(request, locals);
	if (!session.ok) return session.response;
	const deniedAi = forbiddenWithoutPermission(
		session.user,
		'USE_AI_FEATURES',
		'Keine Berechtigung für die KI-Funktionen.',
		'PF_AI_FEATURES_FORBIDDEN'
	);
	if (deniedAi) return deniedAi;

	const parsed = await parseRequestJson(request, postBodySchema);
	if (!parsed.ok) return parsed.response;
	const body = parsed.data;
	const { userRequest } = body;
	let formJson = '';
	try {
		formJson = body.formData !== undefined && body.formData !== null ? JSON.stringify(body.formData) : '';
	} catch {
		formJson = '';
	}
	const softwareName = String(body.softwareName ?? '');
	const softwareVersion = String(body.softwareVersion ?? '');
	const limitErr =
		rejectIfTooLong('Anfrage', userRequest, MAX_AI_USER_TEXT_CHARS) ??
		(softwareName ? rejectIfTooLong('Softwarename', softwareName, MAX_AI_LABEL_CHARS) : null) ??
		(softwareVersion ? rejectIfTooLong('Version', softwareVersion, MAX_AI_LABEL_CHARS) : null) ??
		rejectIfTooLong('Formular-Daten', formJson, MAX_AI_FORM_DATA_JSON_CHARS);
	if (limitErr) return badRequest(limitErr, 'PF_AI_INPUT_TOO_LONG');
	const budget = assertAiDailyBudgetAllows();
	if (!budget.ok) return tooMany(budget.message, 'PF_AI_DAILY_BUDGET');
	const enrichment = await enrichUserRequest(userRequest, {
		softwareName: body.softwareName,
		softwareVersion: body.softwareVersion,
		formData: body.formData
	});
	if (!enrichment.success) {
		return apiJsonError(String(enrichment.error), 500, 'PF_AI_ENRICHMENT_FAILED', {
			extras: { success: false }
		});
	}
	recordAiDailySuccess();
	return json({
		success: true,
		enrichmentData: enrichment.enrichmentData,
		model: enrichment.model
	});
};
