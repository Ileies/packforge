import z from 'zod';

import { assertAiDailyBudgetAllows, recordAiDailySuccess } from '$lib/server/ai/daily-budget';
import { MAX_AI_SCRIPT_CHARS, MAX_AI_USER_TEXT_CHARS, rejectIfTooLong } from '$lib/server/ai/input-limits';
import { improveScript } from '$lib/server/ai/script-ai';
import { forbiddenWithoutPermission, requireSessionApi } from '$lib/server/auth/api-route-guards';
import { apiJsonError, badRequest, tooMany } from '$lib/server/http/errors';
import { json } from '$lib/server/http/json';
import { parseRequestJson } from '$lib/server/http/parse-request-json';
import { analyzeImproveAiOutputText } from '$lib/server/powershell/psscript-analyzer';
import { getPowerShellLintProfile } from '$lib/server/powershell-lint-profile';

import type { RequestHandler } from './$types';

const postBodySchema = z.object({
	scriptContent: z.string().min(1, 'Skriptinhalt ist erforderlich.'),
	userRequest: z.string().min(1, 'Anfrage ist erforderlich.'),
	promptId: z.string().nullable().optional(),
	promptVersion: z.union([z.string(), z.number()]).nullable().optional()
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
	const { scriptContent, userRequest } = body;
	const limitErr =
		rejectIfTooLong('Skript', scriptContent, MAX_AI_SCRIPT_CHARS) ??
		rejectIfTooLong('Anfrage', userRequest, MAX_AI_USER_TEXT_CHARS);
	if (limitErr) return badRequest(limitErr, 'PF_AI_INPUT_TOO_LONG');
	const budget = assertAiDailyBudgetAllows();
	if (!budget.ok) return tooMany(budget.message, 'PF_AI_DAILY_BUDGET');
	try {
		const result = await improveScript(
			scriptContent,
			userRequest,
			body.promptId ?? null,
			body.promptVersion != null ? String(body.promptVersion) : null
		);
		const scriptAnalyzer = await analyzeImproveAiOutputText(result.text, getPowerShellLintProfile());
		recordAiDailySuccess();
		return json({ success: true, text: result.text, response: result.fullResponse, scriptAnalyzer });
	} catch (e) {
		const err = e as { message?: string; code?: string };
		return apiJsonError(String(err.message ?? 'Fehler beim KI-Anbieter.'), 500, 'PF_AI_PROVIDER_ERROR', {
			extras: { success: false, providerCode: err.code || 'UNKNOWN' }
		});
	}
};
