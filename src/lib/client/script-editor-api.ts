import { apiJson, authHeaders } from './api-fetch';
import { apiRoutes } from './api-routes';
import type {
	CheckpointRow,
	LintFinding,
	PssaPayload,
	SoftwareDetailRow,
	SoftwareSummary
} from './script-editor-types';

export async function fetchSoftwareSummaries() {
	return apiJson<SoftwareSummary[]>(apiRoutes.software.list, { headers: authHeaders() });
}

export async function fetchCheckpoints(softwareId: number) {
	return apiJson<CheckpointRow[]>(apiRoutes.software.checkpoints(softwareId), { headers: authHeaders() });
}

export async function fetchSoftwareDetail(softwareId: number) {
	return apiJson<SoftwareDetailRow>(apiRoutes.software.detail(softwareId), { headers: authHeaders() });
}

export async function putSoftware(
	softwareId: number,
	body: { name: string; version: string; generatedScript: string; formData: unknown }
) {
	return apiJson(apiRoutes.software.detail(softwareId), {
		method: 'PUT',
		jsonBody: {
			name: body.name,
			version: body.version,
			generatedScript: body.generatedScript,
			formData: body.formData
		}
	});
}

export async function fetchCheckpointScript(softwareId: number, checkpointNumber: number) {
	return apiJson<{ generated_script?: unknown }>(
		apiRoutes.software.checkpointNumber(softwareId, checkpointNumber),
		{
			headers: authHeaders()
		}
	);
}

export async function postRestoreCheckpoint(softwareId: number, checkpointNumber: number) {
	return apiJson(apiRoutes.software.checkpointRestore(softwareId, checkpointNumber), {
		method: 'POST',
		headers: authHeaders()
	});
}

export async function postNewCheckpoint(softwareId: number, generatedScript: string) {
	return apiJson(apiRoutes.software.checkpoint(softwareId), {
		method: 'POST',
		jsonBody: { generatedScript }
	});
}

export async function deleteSoftware(softwareId: number) {
	return apiJson(apiRoutes.software.detail(softwareId), { method: 'DELETE', headers: authHeaders() });
}

export async function postScriptLint(script: string, opts?: { signal?: AbortSignal }) {
	return apiJson<{
		profile?: string;
		findings?: LintFinding[];
		pssa?: { status?: string };
	}>(apiRoutes.scriptLint, {
		method: 'POST',
		jsonBody: { script },
		signal: opts?.signal
	});
}

export async function postScriptImprove(
	scriptContent: string,
	userRequest: string,
	opts?: { signal?: AbortSignal }
) {
	return apiJson<{
		success?: boolean;
		error?: string;
		text?: string;
		scriptAnalyzer?: PssaPayload;
	}>(apiRoutes.ai.scriptImprove, {
		method: 'POST',
		jsonBody: { scriptContent, userRequest },
		signal: opts?.signal
	});
}

export async function postScriptFix(
	scriptContent: string,
	issueDescription: string,
	opts?: { signal?: AbortSignal }
) {
	return apiJson<{ success?: boolean; error?: string; text?: string }>(apiRoutes.ai.scriptFix, {
		method: 'POST',
		jsonBody: { scriptContent, issueDescription },
		signal: opts?.signal
	});
}

export async function postEnrichment(
	body: {
		userRequest: string;
		softwareName: string;
		softwareVersion: string;
		formData: unknown;
	},
	opts?: { signal?: AbortSignal }
) {
	return apiJson<{ success?: boolean; error?: string; enrichmentData?: unknown }>(apiRoutes.ai.enrichment, {
		method: 'POST',
		jsonBody: body,
		signal: opts?.signal
	});
}

export type ImproveResult =
	| { ok: true; text: string; scriptAnalyzer?: PssaPayload }
	| { ok: false; error: string };

export function parseImproveResponse(d: {
	success?: boolean;
	error?: string;
	text?: string;
	scriptAnalyzer?: PssaPayload;
}): ImproveResult {
	if (!d.success) return { ok: false, error: d.error ?? 'KI-Fehler' };
	return { ok: true, text: String(d.text ?? ''), scriptAnalyzer: d.scriptAnalyzer };
}

export type FixResult = { ok: true; text: string } | { ok: false; error: string };

export function parseFixResponse(d: { success?: boolean; error?: string; text?: string }): FixResult {
	if (!d.success) return { ok: false, error: d.error ?? 'KI-Fehler' };
	return { ok: true, text: String(d.text ?? '') };
}

export type EnrichResult = { ok: true; enrichmentData: unknown } | { ok: false; error: string };

export function parseEnrichResponse(d: {
	success?: boolean;
	error?: string;
	enrichmentData?: unknown;
}): EnrichResult {
	if (!d.success) return { ok: false, error: d.error ?? 'Enrichment fehlgeschlagen' };
	return { ok: true, enrichmentData: d.enrichmentData ?? d };
}
