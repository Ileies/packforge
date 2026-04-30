<script lang="ts">
	import { onMount } from 'svelte';

	import { afterNavigate, beforeNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { APP_PAGE_SHELL_CLASS } from '$lib/app/app-page-shell';
	import { PRODUCT_NAME } from '$lib/app/brand';
	import { type AceUiTheme, subscribeAceUiThemeToHtmlDark } from '$lib/client/ace-theme-from-html-dark';
	import { type ApiErrorSurface, msgErr } from '$lib/client/api-error-present';
	import {
		confirmDirtyInAppNavigationAsync,
		DIRTY_NAVIGATION_WARNING_DE,
		handleDirtyBeforeUnload
	} from '$lib/client/dirty-navigation-guard';
	import { runAiResponseStream } from '$lib/client/script-editor-ai-stream';
	import {
		groupSoftwareSummaries,
		readAiHtmlFromStorage,
		writeAiHtmlToStorage
	} from '$lib/client/script-editor-logic';
	import {
		buildEditorPersistFingerprint,
		computeEditorDirty,
		computePersistSaveErrorDisplayed,
		computePersistStatusPresentation,
		createCheckpointOnServer,
		deleteSoftwareEntry,
		downloadPsadtExportFlow,
		fetchCheckpointsForEditor,
		isPersistFormValid,
		loadCheckpointScriptIntoEditor,
		loadScriptEditorDetail,
		loadSoftwareSummariesForEditor,
		patchSoftwareSummaryAfterSave,
		persistScriptEditorSoftware,
		restoreCheckpointOnServer,
		runEnrichmentFlow,
		runScriptEditorLintFlow,
		runScriptFixFlow,
		runScriptImproveFlow
	} from '$lib/client/script-editor-page.controller';
	import type {
		CheckpointRow,
		LintFinding,
		PendingAi,
		SoftwareSummary
	} from '$lib/client/script-editor-types';
	import { hasPermission } from '$lib/client/session-user';
	import { pushSuccessToast } from '$lib/client/success-toast';
	import ApiErrorCallout from '$lib/components/api-error-callout.svelte';
	import CodeEditor from '$lib/components/code-editor.svelte';
	import ConfirmAlertDialog from '$lib/components/confirm-alert-dialog.svelte';
	import EditorViewportNarrowHint from '$lib/components/editor-viewport-narrow-hint.svelte';
	import LiveRegionFocus from '$lib/components/live-region-focus.svelte';
	import ScriptEditorAiSidebar from '$lib/components/script-editor-ai-sidebar.svelte';
	import ScriptEditorCheckpointsPanel from '$lib/components/script-editor-checkpoints-panel.svelte';
	import ScriptEditorLintBlock from '$lib/components/script-editor-lint-block.svelte';
	import ScriptEditorMetadataForm from '$lib/components/script-editor-metadata-form.svelte';
	import ScriptEditorPersistToolbar from '$lib/components/script-editor-persist-toolbar.svelte';
	import ScriptEditorSoftwarePicker from '$lib/components/script-editor-software-picker.svelte';
	import { Button } from '$lib/components/ui/button/index';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index';
	import { Label } from '$lib/components/ui/label/index';

	let software = $state<SoftwareSummary[]>([]);
	let softwareListReady = $state(false);
	let sid = $state('');
	let name = $state('');
	let version = $state('');
	let script = $state('');
	let formDataRaw = $state('{}');
	let checkpoints = $state<CheckpointRow[]>([]);
	/** Gemeinsam gesetzte Oberfläche: Fehler, Statusmeldung, globale Sperre (Speichern / KI / Dialoge). */
	let surface = $state<{ err: ApiErrorSurface | null; msg: string | null; busy: boolean }>({
		err: null,
		msg: null,
		busy: false
	});
	let focus = $state(false);
	let editorTheme = $state<AceUiTheme>('github');
	let improveReq = $state('');
	let fixIssue = $state('');
	let pendingAi = $state<PendingAi | null>(null);
	let enrichReq = $state('');
	let enrichOut = $state('');
	let aiHtmlPanel = $state('');
	let genericAiPrompt = $state('');
	let genericAiStreamOut = $state('');
	let genericAiStreaming = $state(false);
	let lintFindings = $state<LintFinding[]>([]);
	let lintProfile = $state<string | null>(null);
	let lintPssaStatus = $state<string | null>(null);
	let lintBusy = $state(false);

	/** Abbruch langer Client-Operationen (Lint, KI, Enrichment) — nicht reaktiv. */
	let clientOpAbort: AbortController | null = null;
	let streamAbort: AbortController | null = null;
	let exportZipAbort: AbortController | null = null;
	let exportZipBusy = $state(false);

	/** Letzter mit dem Server abgestimmter Stand (Name, Version, Skript, Formular-JSON). */
	let serverSyncFingerprint = $state('');
	let persistSavedAt = $state<Date | null>(null);
	let scriptSaveInProgress = $state(false);
	let persistSaveError = $state<string | null>(null);
	/** Fingerprint zum Zeitpunkt eines Speicherfehlers — Fehlerzeile blendet aus, sobald der Editor geändert wird. */
	let persistSaveErrorAtFingerprint = $state<string | null>(null);
	let detailLoading = $state(false);

	let restoreCpOpen = $state(false);
	let restoreCpNumber = $state<number | null>(null);
	let deleteSoftwareOpen = $state(false);

	/** Nur solange der Dialog offen ist — kein $effect nötig, Zustand wird nicht mehr synchron geleert. */
	const restoreCpDialogNumber = $derived(restoreCpOpen ? restoreCpNumber : null);

	const canAi = $derived(hasPermission('USE_AI_FEATURES'));
	const canExport = $derived(hasPermission('EXPORT_PSADT'));
	const canDelete = $derived(hasPermission('EDIT_ALL_SCRIPTS'));
	const canCreateScripts = $derived(hasPermission('CREATE_SCRIPTS'));
	const canLint = $derived(hasPermission('VIEW_SCRIPT_EDITOR'));

	const softwareGrouped = $derived.by(() => groupSoftwareSummaries(software));

	const editorPersistFingerprint = $derived(
		buildEditorPersistFingerprint(sid, name, version, script, formDataRaw)
	);
	const editorDirty = $derived(computeEditorDirty(sid, editorPersistFingerprint, serverSyncFingerprint));

	const persistSaveErrorDisplayed = $derived(
		computePersistSaveErrorDisplayed(
			persistSaveError,
			persistSaveErrorAtFingerprint,
			editorPersistFingerprint
		)
	);

	const persistStatusPresentation = $derived.by(() =>
		computePersistStatusPresentation({
			sid,
			detailLoading,
			scriptSaveInProgress,
			persistSaveErrorDisplayed,
			editorDirty,
			persistSavedAt
		})
	);

	const persistFormValid = $derived(isPersistFormValid(name, script, formDataRaw));

	/** Globale UI-Sperre für Eingaben und sekundäre Aktionen (nicht Lint — der nutzt eigenes `lintBusy`). */
	const persistToolbarLocked = $derived(surface.busy || exportZipBusy);

	const persistSaveDisabled = $derived(
		persistToolbarLocked || scriptSaveInProgress || detailLoading || !persistFormValid
	);

	const persistStatusAriaBusy = $derived(
		scriptSaveInProgress || detailLoading || lintBusy || exportZipBusy || genericAiStreaming
	);

	$effect(() => {
		void sid;
		pendingAi = null;
	});

	$effect(() => {
		const id = sid;
		if (!id) {
			aiHtmlPanel = '';
			return;
		}
		aiHtmlPanel = readAiHtmlFromStorage(id);
	});

	function saveAiHtmlPanel() {
		if (!sid) return;
		const r = writeAiHtmlToStorage(sid, aiHtmlPanel);
		if (!r.ok) {
			surface.err = msgErr(r.error);
			return;
		}
		surface.msg = 'KI-Antwort (HTML) lokal gespeichert.';
		surface.err = null;
	}

	function cancelClientOp() {
		clientOpAbort?.abort();
	}

	function cancelGenericAiStream() {
		streamAbort?.abort();
	}

	function cancelExportZip() {
		exportZipAbort?.abort();
	}

	async function runGenericAiStream() {
		if (!genericAiPrompt.trim()) return;
		streamAbort?.abort();
		streamAbort = new AbortController();
		const ac = streamAbort;
		genericAiStreaming = true;
		genericAiStreamOut = '';
		surface.err = null;
		try {
			const r = await runAiResponseStream(
				genericAiPrompt,
				(d) => {
					genericAiStreamOut += d;
				},
				{ signal: ac.signal }
			);
			if (!r.ok) {
				surface.err = r.err;
				return;
			}
			surface.msg = 'KI-Antwort erhalten.';
		} finally {
			genericAiStreaming = false;
			if (streamAbort === ac) streamAbort = null;
		}
	}

	async function loadList() {
		surface.err = null;
		softwareListReady = false;
		try {
			const r = await loadSoftwareSummariesForEditor();
			if (!r.ok) {
				surface.err = r.err;
				return;
			}
			software = r.software;
		} finally {
			softwareListReady = true;
		}
	}

	async function loadDetail() {
		const id = Number(sid);
		if (!sid || Number.isNaN(id)) return;
		clientOpAbort?.abort();
		streamAbort?.abort();
		exportZipAbort?.abort();
		surface.err = null;
		surface.msg = null;
		clearPersistSaveError();
		lintFindings = [];
		lintProfile = null;
		lintPssaStatus = null;
		detailLoading = true;
		try {
			const r = await loadScriptEditorDetail(id);
			if (!r.ok) {
				surface.err = r.err;
				return;
			}
			name = r.name;
			version = r.version;
			script = r.script;
			formDataRaw = r.formDataRaw;
			checkpoints = r.checkpoints;
			serverSyncFingerprint = editorFingerprintNow();
			persistSavedAt = new Date();
			clearPersistSaveError();
		} finally {
			detailLoading = false;
		}
	}

	async function runLint() {
		if (!canLint) return;
		clientOpAbort?.abort();
		clientOpAbort = new AbortController();
		const ac = clientOpAbort;
		lintBusy = true;
		surface.err = null;
		try {
			const result = await runScriptEditorLintFlow(script, ac.signal);
			if (result.kind === 'aborted') {
				surface.err = msgErr('Lint abgebrochen.');
				return;
			}
			if (result.kind === 'err') {
				surface.err = result.err;
				if (result.clearLint) {
					lintFindings = [];
					lintProfile = null;
					lintPssaStatus = null;
				}
				return;
			}
			lintProfile = result.profile;
			lintPssaStatus = result.pssaStatus;
			lintFindings = result.findings;
			surface.msg = result.message;
		} finally {
			lintBusy = false;
			if (clientOpAbort === ac) clientOpAbort = null;
		}
	}

	async function save() {
		const id = Number(sid);
		if (!sid || Number.isNaN(id)) return;
		clientOpAbort?.abort();
		streamAbort?.abort();
		clearPersistSaveError();
		surface.busy = true;
		scriptSaveInProgress = true;
		surface.err = null;
		surface.msg = null;
		try {
			const r = await persistScriptEditorSoftware({
				id,
				name,
				version,
				script,
				formDataRaw
			});
			if (r.kind === 'validation') {
				surface.err = msgErr(r.message);
				setPersistSaveError(r.message);
				return;
			}
			if (r.kind === 'api') {
				surface.err = r.err;
				setPersistSaveError(r.saveErrorMessage);
				return;
			}
			surface.msg = 'Gespeichert.';
			pushSuccessToast('Gespeichert.');
			software = patchSoftwareSummaryAfterSave(software, id, name, version);
			serverSyncFingerprint = editorFingerprintNow();
			persistSavedAt = new Date();
			clearPersistSaveError();
		} finally {
			surface.busy = false;
			scriptSaveInProgress = false;
		}
	}

	async function loadCpScript(n: number) {
		const id = Number(sid);
		const r = await loadCheckpointScriptIntoEditor(id, n);
		if (!r.ok) return;
		script = r.script;
		surface.msg = r.message;
	}

	function openRestoreCpDialog(n: number) {
		restoreCpNumber = n;
		restoreCpOpen = true;
	}

	async function confirmRestoreCp(): Promise<boolean> {
		const n = restoreCpNumber;
		if (n == null) return true;
		const id = Number(sid);
		if (!sid || Number.isNaN(id)) return true;
		surface.busy = true;
		surface.err = null;
		const r = await restoreCheckpointOnServer(id, n);
		surface.busy = false;
		if (!r.ok) {
			surface.err = r.err;
			return false;
		}
		surface.msg = 'Wiederhergestellt.';
		await loadDetail();
		return true;
	}

	async function newCheckpoint() {
		const id = Number(sid);
		surface.busy = true;
		const r = await createCheckpointOnServer(id, script);
		surface.busy = false;
		if (!r.ok) {
			surface.err = r.err;
			return;
		}
		surface.msg = 'Checkpoint angelegt.';
		checkpoints = await fetchCheckpointsForEditor(id);
	}

	async function exportZip() {
		const id = Number(sid);
		if (!sid || Number.isNaN(id)) return;
		if (exportZipBusy) return;
		exportZipAbort?.abort();
		exportZipAbort = new AbortController();
		const ac = exportZipAbort;
		exportZipBusy = true;
		surface.err = null;
		try {
			const r = await downloadPsadtExportFlow(id, name || 'export', ac.signal);
			if (r.kind === 'err') {
				surface.err = r.err;
				return;
			}
			surface.msg = 'Export gestartet.';
		} finally {
			exportZipBusy = false;
			if (exportZipAbort === ac) exportZipAbort = null;
		}
	}

	function openDeleteSoftwareDialog() {
		deleteSoftwareOpen = true;
	}

	async function confirmDeleteSoftware(): Promise<boolean> {
		const id = Number(sid);
		if (!sid || Number.isNaN(id)) return true;
		surface.busy = true;
		surface.err = null;
		const r = await deleteSoftwareEntry(id);
		surface.busy = false;
		if (!r.ok) {
			surface.err = r.err;
			return false;
		}
		sid = '';
		script = '';
		serverSyncFingerprint = '';
		persistSavedAt = null;
		clearPersistSaveError();
		surface.msg = 'Gelöscht.';
		await loadList();
		return true;
	}

	async function runImprove() {
		if (!improveReq.trim()) return;
		clientOpAbort?.abort();
		clientOpAbort = new AbortController();
		const ac = clientOpAbort;
		surface.busy = true;
		surface.err = null;
		try {
			const result = await runScriptImproveFlow(script, improveReq, ac.signal);
			if (result.kind === 'aborted') {
				surface.err = msgErr('KI-Anfrage abgebrochen.');
				return;
			}
			if (result.kind === 'err') {
				surface.err = result.err;
				return;
			}
			pendingAi = result.pending;
			surface.msg = 'KI-Vorschlag bereit — Inhalt prüfen, dann Übernehmen oder Verwerfen.';
		} finally {
			surface.busy = false;
			if (clientOpAbort === ac) clientOpAbort = null;
		}
	}

	async function runFix() {
		if (!fixIssue.trim()) return;
		clientOpAbort?.abort();
		clientOpAbort = new AbortController();
		const ac = clientOpAbort;
		surface.busy = true;
		surface.err = null;
		try {
			const result = await runScriptFixFlow(script, fixIssue, ac.signal);
			if (result.kind === 'aborted') {
				surface.err = msgErr('KI-Anfrage abgebrochen.');
				return;
			}
			if (result.kind === 'err') {
				surface.err = result.err;
				return;
			}
			pendingAi = result.pending;
			surface.msg = 'KI-Korrektur-Vorschlag bereit — Inhalt prüfen, dann Übernehmen oder Verwerfen.';
		} finally {
			surface.busy = false;
			if (clientOpAbort === ac) clientOpAbort = null;
		}
	}

	function applyPendingAi() {
		if (!pendingAi) return;
		script = pendingAi.text;
		const was = pendingAi.kind;
		pendingAi = null;
		surface.msg =
			was === 'improve'
				? 'Skript mit KI-Verbesserung übernommen.'
				: 'Korrektur-Vorschlag ins Skript übernommen.';
		surface.err = null;
	}

	function discardPendingAi() {
		pendingAi = null;
		surface.msg = 'Vorschlag verworfen — Skript unverändert.';
	}

	async function runEnrich() {
		if (!enrichReq.trim()) return;
		clientOpAbort?.abort();
		clientOpAbort = new AbortController();
		const ac = clientOpAbort;
		surface.busy = true;
		surface.err = null;
		try {
			const result = await runEnrichmentFlow(
				{
					enrichReq,
					softwareName: name,
					softwareVersion: version,
					formDataRaw
				},
				ac.signal
			);
			if (result.kind === 'aborted') {
				surface.err = msgErr('Enrichment abgebrochen.');
				return;
			}
			if (result.kind === 'err') {
				surface.err = result.err;
				return;
			}
			enrichOut = result.enrichOut;
			surface.msg = 'Enrichment fertig.';
		} finally {
			surface.busy = false;
			if (clientOpAbort === ac) clientOpAbort = null;
		}
	}

	async function applySoftwareIdFromUrl() {
		const raw = page.url.searchParams.get('id');
		if (!raw) return;
		const id = Number(raw);
		if (Number.isNaN(id) || id <= 0) return;
		sid = String(id);
		await loadDetail();
	}

	let skipDirtyNextNav = false;

	onMount(async () => {
		await loadList();
		await applySoftwareIdFromUrl();
	});

	$effect(() => {
		if (typeof window === 'undefined') return;
		const onBeforeUnload = (event: BeforeUnloadEvent) => handleDirtyBeforeUnload(event, editorDirty);
		window.addEventListener('beforeunload', onBeforeUnload);
		return () => window.removeEventListener('beforeunload', onBeforeUnload);
	});

	beforeNavigate((navigation) => {
		if (navigation.willUnload) return;
		if (skipDirtyNextNav) {
			skipDirtyNextNav = false;
			return;
		}
		if (!editorDirty) return;
		const to = navigation.to;
		navigation.cancel();
		void confirmDirtyInAppNavigationAsync(true, DIRTY_NAVIGATION_WARNING_DE).then((leave) => {
			if (leave && to) {
				skipDirtyNextNav = true;
				void goto(to.url);
			}
		});
	});

	/** Gleiche Route, nur Query geändert (z. B. ?id=): Kein Remount — onMount läuft nicht erneut. */
	afterNavigate(async ({ from, to }) => {
		if (!to?.url.pathname.endsWith('/script-editor')) return;
		const queryOnly =
			from != null && from.url.pathname === to.url.pathname && from.url.search !== to.url.search;
		if (!queryOnly) return;
		await applySoftwareIdFromUrl();
	});

	$effect(() => subscribeAceUiThemeToHtmlDark((t) => (editorTheme = t)));

	function editorFingerprintNow(): string {
		return buildEditorPersistFingerprint(sid, name, version, script, formDataRaw);
	}

	function clearPersistSaveError() {
		persistSaveError = null;
		persistSaveErrorAtFingerprint = null;
	}

	function setPersistSaveError(message: string) {
		persistSaveError = message;
		persistSaveErrorAtFingerprint = editorFingerprintNow();
	}
</script>

<svelte:head>
	<title>{sid && name.trim() ? `${name.trim()} — Script-Editor` : 'Script-Editor'} — {PRODUCT_NAME}</title>
</svelte:head>

<div class={APP_PAGE_SHELL_CLASS}>
	{#if restoreCpDialogNumber != null}
		<ConfirmAlertDialog
			bind:open={restoreCpOpen}
			title="Checkpoint wiederherstellen?"
			description="Checkpoint Nr. {restoreCpDialogNumber} ersetzt das in der Datenbank gespeicherte Skript. Nicht gespeicherte Änderungen im Editor gehen dabei verloren."
			confirmLabel="Wiederherstellen"
			cancelLabel="Abbrechen"
			confirmVariant="default"
			confirmDisabled={persistToolbarLocked}
			onconfirm={confirmRestoreCp}
		/>
	{/if}
	{#if deleteSoftwareOpen}
		<ConfirmAlertDialog
			bind:open={deleteSoftwareOpen}
			title="Software-Eintrag löschen?"
			description="Der Eintrag „{name.trim() ||
				'(ohne Namen)'}“ wird dauerhaft entfernt. Das lässt sich hier nicht wiederherstellen."
			confirmLabel="Endgültig löschen"
			cancelLabel="Abbrechen"
			confirmVariant="destructive"
			confirmDisabled={persistToolbarLocked}
			onconfirm={confirmDeleteSoftware}
		/>
	{/if}
	<EditorViewportNarrowHint featureName="Script-Editor" />
	<Card>
		<CardHeader class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
			<div>
				<CardTitle tag="h1">Script-Editor</CardTitle>
				<CardDescription
					>Deploy-Skript und Stammdaten bearbeiten, speichern, Checkpoints nutzen, PSADT-ZIP exportieren und
					KI-Hilfen einsetzen.</CardDescription
				>
			</div>
			<div class="flex flex-wrap gap-2">
				<Button
					type="button"
					variant={focus ? 'default' : 'outline'}
					size="sm"
					onclick={() => (focus = !focus)}
				>
					{focus ? 'Volle Ansicht' : 'Nur Editor'}
				</Button>
			</div>
		</CardHeader>
		<CardContent class="space-y-4">
			{#if surface.err}
				{@const apiErr = surface.err}
				<LiveRegionFocus when={apiErr} class="outline-none">
					<ApiErrorCallout {...apiErr} />
				</LiveRegionFocus>
			{/if}
			{#if surface.msg}
				<LiveRegionFocus
					when={!surface.err && surface.msg ? surface.msg : null}
					role="status"
					ariaLive="polite"
					class="text-muted-foreground text-sm outline-none"
				>
					{surface.msg}
				</LiveRegionFocus>
			{/if}

			<ScriptEditorSoftwarePicker
				{softwareGrouped}
				{softwareListReady}
				softwareLength={software.length}
				{canCreateScripts}
				bind:sid
				onSoftwareChange={loadDetail}
			/>

			{#if sid}
				<div class="grid gap-4 {!focus ? 'lg:grid-cols-3' : ''}">
					<div class="space-y-4 {!focus ? 'lg:col-span-2' : ''}">
						<ScriptEditorMetadataForm
							showFormJson={!focus}
							disabled={persistToolbarLocked}
							bind:name
							bind:version
							bind:formDataRaw
						/>
						<div class="space-y-2">
							<Label>Generiertes Skript</Label>
							<CodeEditor bind:value={script} theme={editorTheme} minHeight={focus ? '70vh' : '360px'} />
						</div>
						{#if canLint}
							<ScriptEditorLintBlock
								busy={persistToolbarLocked}
								{lintBusy}
								{lintFindings}
								{lintProfile}
								{lintPssaStatus}
								onLint={() => void runLint()}
								onAbortLint={cancelClientOp}
							/>
						{/if}
						<ScriptEditorPersistToolbar
							{persistStatusPresentation}
							{persistStatusAriaBusy}
							{persistSaveDisabled}
							{persistToolbarLocked}
							{canExport}
							{canDelete}
							{exportZipBusy}
							onSave={save}
							onCheckpoint={newCheckpoint}
							onExportZip={() => void exportZip()}
							onDelete={openDeleteSoftwareDialog}
							onCancelExportZip={cancelExportZip}
						/>
					</div>

					{#if !focus}
						<div class="space-y-4">
							<ScriptEditorCheckpointsPanel
								{checkpoints}
								onLoadCp={(n) => void loadCpScript(n)}
								onRestoreCp={openRestoreCpDialog}
							/>

							{#if canAi}
								<ScriptEditorAiSidebar
									busy={persistToolbarLocked}
									{genericAiStreaming}
									{pendingAi}
									{enrichOut}
									{genericAiStreamOut}
									{sid}
									bind:improveReq
									bind:fixIssue
									bind:enrichReq
									bind:genericAiPrompt
									bind:aiHtmlPanel
									onRunImprove={() => void runImprove()}
									onRunFix={() => void runFix()}
									onRunEnrich={() => void runEnrich()}
									onRunStream={() => void runGenericAiStream()}
									onSaveAiHtml={saveAiHtmlPanel}
									onApplyPending={applyPendingAi}
									onDiscardPending={discardPendingAi}
									onCancelBusy={cancelClientOp}
									onCancelStream={cancelGenericAiStream}
								/>
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		</CardContent>
	</Card>
</div>
