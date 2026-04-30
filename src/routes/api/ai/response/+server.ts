import z from 'zod';

import { assertAiDailyBudgetAllows, recordAiDailySuccess } from '$lib/server/ai/daily-budget';
import {
	MAX_AI_RESPONSE_INSTRUCTIONS_CHARS,
	MAX_AI_RESPONSE_MODEL_OVERRIDE_CHARS,
	MAX_AI_RESPONSE_PROMPT_ID_CHARS,
	MAX_AI_USER_TEXT_CHARS,
	rejectIfTooLong
} from '$lib/server/ai/input-limits';
import { createAiResponse } from '$lib/server/ai/model-selector';
import { forbiddenWithoutPermission, requireSessionApi } from '$lib/server/auth/api-route-guards';
import { apiJsonError, badRequest, tooMany } from '$lib/server/http/errors';
import { json } from '$lib/server/http/json';
import { parseRequestJson } from '$lib/server/http/parse-request-json';

import type { RequestHandler } from './$types';

const bodySchema = z
	.object({
		prompt: z.string().optional(),
		instructions: z.string().nullable().optional(),
		model: z.string().nullable().optional(),
		promptId: z.string().nullable().optional(),
		promptVersion: z.union([z.string(), z.number()]).optional()
	})
	.refine((d) => Boolean(d.promptId) || Boolean(d.prompt), {
		message: '„prompt“ oder „promptId“ ist erforderlich.'
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

	const parsed = await parseRequestJson(request, bodySchema);
	if (!parsed.ok) return parsed.response;

	const { prompt, instructions, model, promptId, promptVersion } = parsed.data;

	const promptStr = String(prompt ?? '');
	const instructionsStr = instructions != null ? String(instructions) : '';
	const promptIdStr = promptId != null ? String(promptId) : '';
	const modelStr = model != null ? String(model) : '';
	const limitErr =
		rejectIfTooLong('Prompt', promptStr, MAX_AI_USER_TEXT_CHARS) ??
		(instructionsStr !== ''
			? rejectIfTooLong('instructions', instructionsStr, MAX_AI_RESPONSE_INSTRUCTIONS_CHARS)
			: null) ??
		(promptIdStr !== '' ? rejectIfTooLong('promptId', promptIdStr, MAX_AI_RESPONSE_PROMPT_ID_CHARS) : null) ??
		(modelStr !== '' ? rejectIfTooLong('model', modelStr, MAX_AI_RESPONSE_MODEL_OVERRIDE_CHARS) : null);
	if (limitErr) return badRequest(limitErr, 'PF_AI_INPUT_TOO_LONG');

	const budget = assertAiDailyBudgetAllows();
	if (!budget.ok) return tooMany(budget.message, 'PF_AI_DAILY_BUDGET');

	try {
		const response = await createAiResponse(
			promptStr,
			instructions != null ? instructions : null,
			model != null ? model : null,
			promptId != null ? promptId : null,
			String(promptVersion ?? '3'),
			null
		);
		recordAiDailySuccess();
		return json({ success: true, response });
	} catch (e) {
		const err = e as { message?: string; code?: string };
		return apiJsonError(String(err.message ?? 'Fehler beim KI-Anbieter.'), 500, 'PF_AI_PROVIDER_ERROR', {
			extras: { success: false, providerCode: err.code || 'UNKNOWN' }
		});
	}
};
