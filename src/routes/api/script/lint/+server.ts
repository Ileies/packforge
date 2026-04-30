import z from 'zod';

import { MAX_AI_SCRIPT_CHARS, rejectIfTooLong } from '$lib/server/ai/input-limits';
import { forbiddenWithoutPermission, requireSessionApi } from '$lib/server/auth/api-route-guards';
import { badRequest } from '$lib/server/http/errors';
import { json } from '$lib/server/http/json';
import { parseRequestJson } from '$lib/server/http/parse-request-json';
import { analyzePowerShellSnippet } from '$lib/server/powershell/psscript-analyzer';
import { lintPowerShellScript, type PowerShellLintFinding } from '$lib/server/powershell-lint';
import { getPowerShellLintProfile } from '$lib/server/powershell-lint-profile';

import type { RequestHandler } from './$types';

const postBodySchema = z
	.object({
		script: z.string().optional()
	})
	.passthrough();

function pssaSeverityToLint(sev: string): PowerShellLintFinding['severity'] {
	const x = sev.toLowerCase();
	if (x === 'warning') return 'warning';
	if (x === 'information' || x === 'info') return 'info';
	return 'error';
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await requireSessionApi(request, locals);
	if (!session.ok) return session.response;
	const { user } = session;
	const denied = forbiddenWithoutPermission(
		user,
		'VIEW_SCRIPT_EDITOR',
		'Keine Berechtigung für den Script-Editor.',
		'PF_SCRIPT_LINT_FORBIDDEN'
	);
	if (denied) return denied;
	const parsed = await parseRequestJson(request, postBodySchema);
	if (!parsed.ok) return parsed.response;
	const script = parsed.data.script ?? '';
	const limitErr = rejectIfTooLong('Skript', script, MAX_AI_SCRIPT_CHARS);
	if (limitErr) return badRequest(limitErr, 'PF_SCRIPT_LINT_TOO_LONG');

	const profile = getPowerShellLintProfile();
	const heuristic = lintPowerShellScript(script, profile);
	const pssa = await analyzePowerShellSnippet(script, { profile });
	const fromPssa: PowerShellLintFinding[] = [];
	if (pssa.status === 'ran') {
		for (const f of pssa.findings) {
			const sev = pssaSeverityToLint(f.severity);
			if (profile === 'relaxed' && sev !== 'error') continue;
			fromPssa.push({
				ruleId: `PSSA:${f.ruleName}`,
				severity: sev,
				line: f.line,
				message: f.message
			});
		}
	}
	const findings = [...heuristic, ...fromPssa].sort(
		(a, b) => a.line - b.line || a.message.localeCompare(b.message)
	);
	return json({
		profile,
		findings,
		pssa: { status: pssa.status, ...(pssa.status !== 'ran' ? { reason: pssa.reason } : {}) }
	});
};
