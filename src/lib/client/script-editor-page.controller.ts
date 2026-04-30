import { type ApiErrorSurface, fromJsonErr, msgErr } from '$lib/client/api-error-present';
import { downloadPsadtExport } from '$lib/client/psadt-export';
import {
	deleteSoftware,
	fetchCheckpoints,
	fetchCheckpointScript,
	fetchSoftwareDetail,
	fetchSoftwareSummaries,
	parseEnrichResponse,
	parseFixResponse,
	parseImproveResponse,
	postEnrichment,
	postNewCheckpoint,
	postRestoreCheckpoint,
	postScriptFix,
	postScriptImprove,
	postScriptLint,
	putSoftware
} from '$lib/client/script-editor-api';
import { formDataRawFromRow } from '$lib/client/script-editor-logic';
import type { CheckpointRow, LintFinding, PendingAi, SoftwareSummary } from '$lib/client/script-editor-types';

export type PersistStatusMode = 'hidden' | 'loading' | 'saving' | 'error' | 'dirty' | 'synced';

export type PersistStatusPresentation = {
	text: string;
	className: string;
	mode: PersistStatusMode;
};

export function buildEditorPersistFingerprint(
	sid: string,
	name: string,
	version: string,
	script: string,
	formDataRaw: string
): string {
	return sid ? JSON.stringify({ n: name, v: version, s: script, f: formDataRaw }) : '';
}

export function computeEditorDirty(
	sid: string,
	editorPersistFingerprint: string,
	serverSyncFingerprint: string
): boolean {
	return !!sid && editorPersistFingerprint !== serverSyncFingerprint;
}

export function computePersistSaveErrorDisplayed(
	persistSaveError: string | null,
	persistSaveErrorAtFingerprint: string | null,
	editorPersistFingerprint: string
): string | null {
	if (
		persistSaveError &&
		persistSaveErrorAtFingerprint != null &&
		editorPersistFingerprint === persistSaveErrorAtFingerprint
	) {
		return persistSaveError;
	}
	return null;
}

export function computePersistStatusPresentation(args: {
	sid: string;
	detailLoading: boolean;
	scriptSaveInProgress: boolean;
	persistSaveErrorDisplayed: string | null;
	editorDirty: boolean;
	persistSavedAt: Date | null;
}): PersistStatusPresentation {
	const { sid, detailLoading, scriptSaveInProgress, persistSaveErrorDisplayed, editorDirty, persistSavedAt } =
		args;
	if (!sid) {
		return { text: '', className: '', mode: 'hidden' };
	}
	if (detailLoading) {
		return { text: 'Lade Eintrag…', className: 'text-muted-foreground', mode: 'loading' };
	}
	if (scriptSaveInProgress) {
		return { text: 'Speichert…', className: 'text-muted-foreground', mode: 'saving' };
	}
	if (persistSaveErrorDisplayed) {
		return {
			text: `Fehler: ${persistSaveErrorDisplayed}`,
			className: 'text-destructive font-medium',
			mode: 'error'
		};
	}
	if (editorDirty) {
		return {
			text: 'Ungespeicherte Änderungen',
			className: 'text-amber-600 dark:text-amber-500',
			mode: 'dirty'
		};
	}
	const t =
		persistSavedAt != null
			? persistSavedAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
			: '—';
	return {
		text: `Gespeichert · ${t}`,
		className: 'text-muted-foreground',
		mode: 'synced'
	};
}

export function isFormDataJsonValid(formDataRaw: string): boolean {
	try {
		JSON.parse(formDataRaw || '{}');
		return true;
	} catch {
		return false;
	}
}

export function isPersistFormValid(name: string, script: string, formDataRaw: string): boolean {
	return !!name.trim() && !!script.trim() && isFormDataJsonValid(formDataRaw);
}

export function patchSoftwareSummaryAfterSave(
	software: SoftwareSummary[],
	id: number,
	nextName: string,
	nextVersion: string
): SoftwareSummary[] {
	return software.map((entry) =>
		entry.id === id
			? {
					...entry,
					name: nextName,
					version: nextVersion.trim() ? nextVersion : null
				}
			: entry
	);
}

export type LoadListResult = { ok: true; software: SoftwareSummary[] } | { ok: false; err: ApiErrorSurface };

export async function loadSoftwareSummariesForEditor(): Promise<LoadListResult> {
	const r = await fetchSoftwareSummaries();
	if (!r.ok) return { ok: false, err: fromJsonErr(r) };
	return { ok: true, software: r.data };
}

export type LoadDetailResult =
	| {
			ok: true;
			name: string;
			version: string;
			script: string;
			formDataRaw: string;
			checkpoints: CheckpointRow[];
	  }
	| { ok: false; err: ApiErrorSurface };

export async function fetchCheckpointsForEditor(softwareId: number): Promise<CheckpointRow[]> {
	const r = await fetchCheckpoints(softwareId);
	return r.ok ? r.data : [];
}

export async function loadScriptEditorDetail(id: number): Promise<LoadDetailResult> {
	const r = await fetchSoftwareDetail(id);
	if (!r.ok) return { ok: false, err: fromJsonErr(r) };
	const row = r.data;
	const checkpoints = await fetchCheckpointsForEditor(id);
	return {
		ok: true,
		name: String(row.name ?? ''),
		version: String(row.version ?? ''),
		script: String(row.generated_script ?? ''),
		formDataRaw: formDataRawFromRow(row.form_data),
		checkpoints
	};
}

export type PersistSoftwareResult =
	| { kind: 'success' }
	| { kind: 'validation'; message: string }
	| { kind: 'api'; err: ApiErrorSurface; saveErrorMessage: string };

export function parsePersistFormDataRaw(
	formDataRaw: string
): { ok: true; formData: unknown } | { ok: false; message: string } {
	try {
		return { ok: true, formData: JSON.parse(formDataRaw || '{}') };
	} catch {
		return { ok: false, message: 'Formular-Daten: ungültiges JSON.' };
	}
}

export async function persistScriptEditorSoftware(args: {
	id: number;
	name: string;
	version: string;
	script: string;
	formDataRaw: string;
}): Promise<PersistSoftwareResult> {
	const parsed = parsePersistFormDataRaw(args.formDataRaw);
	if (!parsed.ok) {
		return { kind: 'validation', message: parsed.message };
	}
	if (!args.name.trim() || !args.script.trim()) {
		return { kind: 'validation', message: 'Name und Skript sind Pflicht.' };
	}
	const r = await putSoftware(args.id, {
		name: args.name,
		version: args.version,
		generatedScript: args.script,
		formData: parsed.formData
	});
	if (!r.ok) {
		return { kind: 'api', err: fromJsonErr(r), saveErrorMessage: r.error };
	}
	return { kind: 'success' };
}

export type LintRunResult =
	| {
			kind: 'ok';
			findings: LintFinding[];
			profile: string | null;
			pssaStatus: string | null;
			message: string;
	  }
	| { kind: 'err'; err: ApiErrorSurface; clearLint: boolean }
	| { kind: 'aborted' };

export async function runScriptEditorLintFlow(script: string, signal: AbortSignal): Promise<LintRunResult> {
	try {
		const r = await postScriptLint(script, { signal });
		if (!r.ok) {
			return { kind: 'err', err: fromJsonErr(r), clearLint: true };
		}
		const profile = typeof r.data.profile === 'string' ? r.data.profile : null;
		const pssaStatus = typeof r.data.pssa?.status === 'string' ? r.data.pssa.status : null;
		const findings = Array.isArray(r.data.findings) ? r.data.findings : [];
		const message =
			findings.length === 0
				? 'Lint: keine Treffer für das aktuelle Profil.'
				: `Lint: ${findings.length} Hinweis${findings.length === 1 ? '' : 'e'} (Profil ${profile ?? '—'}).`;
		return { kind: 'ok', findings, profile, pssaStatus, message };
	} catch (e) {
		if (signal.aborted) return { kind: 'aborted' };
		return {
			kind: 'err',
			err: msgErr(e instanceof Error ? e.message : String(e)),
			clearLint: true
		};
	}
}

export async function loadCheckpointScriptIntoEditor(
	softwareId: number,
	checkpointNumber: number
): Promise<{ ok: true; script: string; message: string } | { ok: false }> {
	const r = await fetchCheckpointScript(softwareId, checkpointNumber);
	if (!r.ok) return { ok: false };
	const row = r.data;
	return {
		ok: true,
		script: String(row.generated_script ?? ''),
		message: `Checkpoint #${checkpointNumber} in den Editor geladen — der Stand ist erst nach „Speichern“ in der Datenbank festgeschrieben.`
	};
}

export async function restoreCheckpointOnServer(
	softwareId: number,
	checkpointNumber: number
): Promise<{ ok: true } | { ok: false; err: ApiErrorSurface }> {
	const r = await postRestoreCheckpoint(softwareId, checkpointNumber);
	if (!r.ok) return { ok: false, err: fromJsonErr(r) };
	return { ok: true };
}

export async function createCheckpointOnServer(
	softwareId: number,
	script: string
): Promise<{ ok: true } | { ok: false; err: ApiErrorSurface }> {
	const r = await postNewCheckpoint(softwareId, script);
	if (!r.ok) return { ok: false, err: fromJsonErr(r) };
	return { ok: true };
}

export async function deleteSoftwareEntry(
	softwareId: number
): Promise<{ ok: true } | { ok: false; err: ApiErrorSurface }> {
	const r = await deleteSoftware(softwareId);
	if (!r.ok) return { ok: false, err: fromJsonErr(r) };
	return { ok: true };
}

export type AiImproveFlowResult =
	| { kind: 'ok'; pending: PendingAi }
	| { kind: 'err'; err: ApiErrorSurface }
	| { kind: 'aborted' };

export async function runScriptImproveFlow(
	script: string,
	improveReq: string,
	signal: AbortSignal
): Promise<AiImproveFlowResult> {
	try {
		const r = await postScriptImprove(script, improveReq, { signal });
		if (!r.ok) return { kind: 'err', err: fromJsonErr(r) };
		const parsed = parseImproveResponse(r.data);
		if (!parsed.ok) return { kind: 'err', err: msgErr(parsed.error) };
		return {
			kind: 'ok',
			pending: { kind: 'improve', text: parsed.text, scriptAnalyzer: parsed.scriptAnalyzer }
		};
	} catch (e) {
		if (signal.aborted) return { kind: 'aborted' };
		return { kind: 'err', err: msgErr(e instanceof Error ? e.message : String(e)) };
	}
}

export type AiFixFlowResult =
	| { kind: 'ok'; pending: PendingAi }
	| { kind: 'err'; err: ApiErrorSurface }
	| { kind: 'aborted' };

export async function runScriptFixFlow(
	script: string,
	fixIssue: string,
	signal: AbortSignal
): Promise<AiFixFlowResult> {
	try {
		const r = await postScriptFix(script, fixIssue, { signal });
		if (!r.ok) return { kind: 'err', err: fromJsonErr(r) };
		const parsed = parseFixResponse(r.data);
		if (!parsed.ok) return { kind: 'err', err: msgErr(parsed.error) };
		return { kind: 'ok', pending: { kind: 'fix', text: parsed.text } };
	} catch (e) {
		if (signal.aborted) return { kind: 'aborted' };
		return { kind: 'err', err: msgErr(e instanceof Error ? e.message : String(e)) };
	}
}

export type EnrichFlowResult =
	| { kind: 'ok'; enrichOut: string }
	| { kind: 'err'; err: ApiErrorSurface }
	| { kind: 'aborted' };

export async function runEnrichmentFlow(
	args: {
		enrichReq: string;
		softwareName: string;
		softwareVersion: string;
		formDataRaw: string;
	},
	signal: AbortSignal
): Promise<EnrichFlowResult> {
	let fd: unknown = {};
	try {
		fd = JSON.parse(args.formDataRaw || '{}');
	} catch {
		return { kind: 'err', err: msgErr('Formular-JSON ungültig für Enrichment.') };
	}
	try {
		const r = await postEnrichment(
			{
				userRequest: args.enrichReq,
				softwareName: args.softwareName,
				softwareVersion: args.softwareVersion,
				formData: fd
			},
			{ signal }
		);
		if (!r.ok) return { kind: 'err', err: fromJsonErr(r) };
		const parsed = parseEnrichResponse(r.data);
		if (!parsed.ok) return { kind: 'err', err: msgErr(parsed.error) };
		return { kind: 'ok', enrichOut: JSON.stringify(parsed.enrichmentData, null, 2) };
	} catch (e) {
		if (signal.aborted) return { kind: 'aborted' };
		return { kind: 'err', err: msgErr(e instanceof Error ? e.message : String(e)) };
	}
}

export type PsadtExportFlowResult = { kind: 'ok' } | { kind: 'err'; err: ApiErrorSurface };

export async function downloadPsadtExportFlow(
	id: number,
	exportName: string,
	signal: AbortSignal
): Promise<PsadtExportFlowResult> {
	const r = await downloadPsadtExport(id, exportName, { signal });
	if (!r.ok) return { kind: 'err', err: msgErr(r.error) };
	return { kind: 'ok' };
}
