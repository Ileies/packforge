<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { APP_PAGE_SHELL_CLASS } from '$lib/app/app-page-shell';
	import { PRODUCT_NAME } from '$lib/app/brand.js';
	import { type ApiErrorSurface, msgErr } from '$lib/client/api-error-present.js';
	import { authHeaders } from '$lib/client/api-fetch.js';
	import { apiRoutes } from '$lib/client/api-routes.js';
	import { duplicateUploadBasenames } from '$lib/client/duplicate-upload-basenames.js';
	import { postFormDataWithProgress } from '$lib/client/postFormDataWithProgress.js';
	import { pushSuccessToast } from '$lib/client/success-toast';
	import ApiErrorCallout from '$lib/components/api-error-callout.svelte';
	import LiveRegionFocus from '$lib/components/live-region-focus.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let formDataRaw = $state('');
	let lastSyncedFormDataInitial = $state<string | null>(null);

	$effect.pre(() => {
		const init = data.initialFormDataJson;
		if (lastSyncedFormDataInitial == null || init !== lastSyncedFormDataInitial) {
			lastSyncedFormDataInitial = init;
			formDataRaw = init;
		}
	});

	type FieldErrors = {
		name?: string;
		script?: string;
		main?: string;
		template?: string;
		files?: string;
		formData?: string;
	};

	let name = $state('');
	let version = $state('');
	let templateId = $state('');
	let generatedScript = $state('');
	let mainFiles = $state<FileList | undefined>(undefined);
	let additionalFiles = $state<FileList | undefined>(undefined);
	let supportFiles = $state<FileList | undefined>(undefined);
	let additionalFolderFiles = $state<FileList | undefined>(undefined);
	let supportFolderFiles = $state<FileList | undefined>(undefined);
	const templates = $derived(data.templateSummaries);
	let err = $state<ApiErrorSurface | null>(null);
	let msg = $state<string | null>(null);
	let busy = $state(false);
	let uploadProgress = $state(0);
	let fieldErrors = $state<FieldErrors>({});

	const maxBytes = $derived(data.maxUploadBytesPerFile);

	function filesArray(fl: FileList | undefined): File[] {
		if (!fl?.length) return [];
		return [...fl];
	}

	function formatBytes(n: number): string {
		if (!Number.isFinite(n) || n < 0) return '—';
		if (n < 1024) return `${Math.round(n)} Byte`;
		if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KiB`;
		if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MiB`;
		return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GiB`;
	}

	function installerExtOk(fileName: string): boolean {
		const n = fileName.toLowerCase();
		return n.endsWith('.exe') || n.endsWith('.msi');
	}

	function totalBytes(files: File[]): number {
		let t = 0;
		for (const f of files) t += f.size;
		return t;
	}

	function validateBeforeSubmit(): boolean {
		fieldErrors = {};
		const next: FieldErrors = {};

		if (!name.trim()) {
			next.name = 'Anzeigename ist Pflicht.';
		}
		if (!generatedScript.trim()) {
			next.script = 'Generiertes Skript ist Pflicht.';
		}

		const main = mainFiles?.[0];
		if (!main) {
			next.main = 'Bitte eine Setup-Datei (.exe / .msi) wählen.';
		} else {
			if (!installerExtOk(main.name)) {
				next.main = 'Setup-Datei muss .exe oder .msi sein.';
			}
			if (main.size <= 0) {
				next.main = 'Die Setup-Datei ist leer (0 Byte).';
			} else if (main.size > maxBytes) {
				next.main = `Setup-Datei zu groß (max. ${formatBytes(maxBytes)} pro Datei).`;
			}
		}

		const tid = templateId.trim();
		if (tid && !templates.some((x) => String(x.id) === tid)) {
			next.template = 'Ungültige Template-Auswahl.';
		}

		const addAll = [...filesArray(additionalFiles), ...filesArray(additionalFolderFiles)];
		const supAll = [...filesArray(supportFiles), ...filesArray(supportFolderFiles)];
		const allForDup = main ? [main, ...addAll, ...supAll] : [...addAll, ...supAll];
		const dup = duplicateUploadBasenames(allForDup);
		if (dup.length) {
			next.files = `Doppelte Dateinamen: ${dup.join(', ')}`;
		}

		const tooLarge: string[] = [];
		for (const f of addAll) {
			if (f.size > maxBytes) tooLarge.push(f.name);
		}
		for (const f of supAll) {
			if (f.size > maxBytes) tooLarge.push(f.name);
		}
		if (tooLarge.length) {
			next.files =
				(next.files ? `${next.files} ` : '') +
				`Zu groß (max. ${formatBytes(maxBytes)} pro Datei): ${tooLarge.join(', ')}`;
		}

		const zero = [...addAll, ...supAll].filter((f) => f.size === 0).map((f) => f.name);
		if (zero.length) {
			next.files =
				(next.files ? `${next.files} ` : '') + `Leere Dateien entfernen (0 Byte): ${zero.join(', ')}`;
		}

		try {
			const parsed = JSON.parse(formDataRaw.trim() || '{}');
			if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
				next.formData = 'Stammdaten (JSON): Es muss ein Objekt sein (kein Array, kein Primitiv).';
			}
		} catch {
			next.formData = 'Stammdaten (JSON): Syntax ungültig.';
		}

		fieldErrors = next;
		return Object.keys(next).length === 0;
	}

	/** Serialisiertes `form_data` inkl. Übernahme von Anzeigename/Version in AppName/AppVersion, wenn leer. */
	function buildFormDataJsonForUpload(): { ok: true; json: string } | { ok: false; message: string } {
		let parsed: unknown;
		try {
			parsed = JSON.parse(formDataRaw.trim() || '{}');
		} catch {
			return { ok: false, message: 'Stammdaten (JSON): Syntax ungültig.' };
		}
		if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
			return { ok: false, message: 'Stammdaten (JSON): Es muss ein Objekt sein.' };
		}
		const obj = { ...(parsed as Record<string, unknown>) };
		const nt = name.trim();
		const vt = version.trim();
		if ('AppName' in obj) {
			const cur = obj.AppName;
			const empty = cur === '' || cur == null || (typeof cur === 'string' && cur.trim() === '');
			if (empty && nt) obj.AppName = nt;
		}
		if ('AppVersion' in obj) {
			const cur = obj.AppVersion;
			const empty = cur === '' || cur == null || (typeof cur === 'string' && cur.trim() === '');
			if (empty && vt) obj.AppVersion = vt;
		}
		return { ok: true, json: JSON.stringify(obj) };
	}

	const mainFile = $derived(mainFiles?.[0]);
	const additionalAll = $derived([...filesArray(additionalFiles), ...filesArray(additionalFolderFiles)]);
	const supportAll = $derived([...filesArray(supportFiles), ...filesArray(supportFolderFiles)]);

	const templateLabel = $derived.by(() => {
		const id = templateId.trim();
		if (!id) return '— keins —';
		const t = templates.find((x) => String(x.id) === id);
		if (!t) return `ID ${id}`;
		return `v${t.major_version}.${t.minor_version} (ID ${t.id})`;
	});

	const uploadSummaryTotal = $derived(
		(mainFile?.size ?? 0) + totalBytes(additionalAll) + totalBytes(supportAll)
	);

	async function submit() {
		err = null;
		msg = null;
		if (!validateBeforeSubmit()) {
			return;
		}

		const formPayload = buildFormDataJsonForUpload();
		if (!formPayload.ok) {
			fieldErrors = { ...fieldErrors, formData: formPayload.message };
			return;
		}

		const main = mainFiles![0];
		const addAll = [...filesArray(additionalFiles), ...filesArray(additionalFolderFiles)];
		const supAll = [...filesArray(supportFiles), ...filesArray(supportFolderFiles)];

		const fd = new FormData();
		fd.set('file', main);
		fd.set('name', name.trim());
		fd.set('generatedScript', generatedScript);
		fd.set('version', version.trim());
		fd.set('formData', formPayload.json);
		const tid = templateId.trim();
		if (tid) fd.set('templateId', tid);
		for (const f of addAll) fd.append('additional', f);
		for (const f of supAll) fd.append('support', f);
		busy = true;
		uploadProgress = 0;
		try {
			const r = await postFormDataWithProgress(apiRoutes.software.list, fd, {
				headers: authHeaders(),
				onUploadProgress: (p) => {
					uploadProgress = p;
				}
			});
			busy = false;
			uploadProgress = r.ok ? 1 : 0;
			if (!r.ok) {
				const b = r.body as { error?: string; conflictSoftwareId?: number } | string;
				if (typeof b === 'object' && b && typeof b.error === 'string') {
					const text =
						r.status === 409 && typeof b.conflictSoftwareId === 'number'
							? `${b.error} (Software-ID ${b.conflictSoftwareId})`
							: b.error;
					err = { message: text, status: r.status };
				} else err = { message: String(b), status: r.status };
				return;
			}
			const d = r.body as { id?: number };
			fieldErrors = {};
			await invalidateAll();
			formDataRaw = data.initialFormDataJson;
			lastSyncedFormDataInitial = data.initialFormDataJson;
			const doneMsg = `Eintrag angelegt (Software-ID ${d.id ?? '—'}).`;
			msg = doneMsg;
			pushSuccessToast('Upload abgeschlossen.');
		} catch (e) {
			busy = false;
			uploadProgress = 0;
			err = msgErr(e instanceof Error ? e.message : String(e));
		}
	}
</script>

<svelte:head>
	<title>Script Maker — {PRODUCT_NAME}</title>
</svelte:head>

<div class={APP_PAGE_SHELL_CLASS}>
	<Card>
		<CardHeader>
			<CardTitle tag="h1">Script Maker</CardTitle>
			<CardDescription>
				Hauptinstaller (.exe/.msi), optionale Dateien und eine Vorlage wählen — daraus entsteht das
				PSADT-Grundgerüst.
			</CardDescription>
			<details class="text-muted-foreground max-w-3xl pt-2 text-sm leading-relaxed">
				<summary
					class="text-foreground cursor-pointer text-sm font-medium underline-offset-4 hover:underline"
				>
					Technische Details zu Stammdaten (JSON)
				</summary>
				<p class="mt-2">
					Beim <strong class="text-foreground">Öffnen dieser Seite</strong> füllt der Server das Feld
					<strong class="text-foreground">Stammdaten (JSON)</strong> aus den Formularfeldern im Daten-Editor
					(Feldnamen aus den Labels, Standardwerte oder leer) — wie im Script-Editor unter
					<code class="font-mono text-xs">form_data</code>.
				</p>
			</details>
			<p class="text-muted-foreground md:hidden pt-1 text-xs">
				Für Upload und Bearbeitung wird ein größerer Bildschirm empfohlen.
			</p>
		</CardHeader>
		<CardContent class="space-y-6">
			{#if err}
				{@const apiErr = err}
				<LiveRegionFocus when={apiErr} class="outline-none">
					<ApiErrorCallout {...apiErr} />
				</LiveRegionFocus>
			{/if}
			{#if msg}
				<LiveRegionFocus
					when={!err && msg ? msg : null}
					role="status"
					ariaLive="polite"
					class="text-muted-foreground text-sm outline-none"
				>
					{msg}
				</LiveRegionFocus>
			{/if}
			{#if Object.keys(fieldErrors).length > 0}
				<LiveRegionFocus
					when={fieldErrors}
					elementId="validation-summary"
					role="alert"
					ariaLive="assertive"
					class="border-destructive/30 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-sm outline-none"
				>
					Bitte die markierten Felder prüfen.
				</LiveRegionFocus>
			{/if}

			<div class="grid gap-6 md:grid-cols-3">
				<div class="space-y-2">
					<Label for="f">Setup (.exe / .msi)</Label>
					<Input id="f" type="file" accept=".exe,.msi" bind:files={mainFiles} disabled={busy} />
					{#if fieldErrors.main}
						<p id="err-main" class="text-destructive text-xs">{fieldErrors.main}</p>
					{/if}
				</div>
				<div class="space-y-2">
					<Label for="add">Zusätzliche Dateien</Label>
					<Input id="add" type="file" multiple bind:files={additionalFiles} disabled={busy} />
				</div>
				<div class="space-y-2">
					<Label for="sup">Support-Dateien</Label>
					<Input id="sup" type="file" multiple bind:files={supportFiles} disabled={busy} />
				</div>
			</div>
			<div class="grid gap-6 md:grid-cols-2">
				<div class="space-y-2">
					<Label for="addDir">Zusatzdateien aus Ordner</Label>
					<Input
						id="addDir"
						type="file"
						multiple
						webkitdirectory
						bind:files={additionalFolderFiles}
						disabled={busy}
					/>
					<p class="text-muted-foreground text-xs">Ordner auswählen — rekursiv wie mehrere Einzeldateien.</p>
				</div>
				<div class="space-y-2">
					<Label for="supDir">Support-Dateien aus Ordner</Label>
					<Input
						id="supDir"
						type="file"
						multiple
						webkitdirectory
						bind:files={supportFolderFiles}
						disabled={busy}
					/>
				</div>
			</div>
			{#if fieldErrors.files}
				<p id="err-files" class="text-destructive text-sm" role="alert">{fieldErrors.files}</p>
			{/if}
			{#if busy && uploadProgress > 0 && uploadProgress < 1}
				<div class="space-y-1">
					<progress class="h-2 w-full max-w-xl" max={1} value={uploadProgress}></progress>
					<p class="text-muted-foreground text-xs">{Math.round(uploadProgress * 100)} % Upload...</p>
				</div>
			{/if}

			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-2">
					<Label for="n">Anzeigename</Label>
					<Input
						id="n"
						bind:value={name}
						disabled={busy}
						class={fieldErrors.name ? 'border-destructive' : ''}
						aria-invalid={fieldErrors.name ? true : undefined}
						aria-describedby={fieldErrors.name ? 'err-name' : undefined}
					/>
					{#if fieldErrors.name}
						<p id="err-name" class="text-destructive text-xs">{fieldErrors.name}</p>
					{/if}
				</div>
				<div class="space-y-2">
					<Label for="v">Version</Label>
					<Input id="v" bind:value={version} disabled={busy} placeholder="optional" />
				</div>
			</div>
			<div class="space-y-2">
				<Label for="tpl">Template</Label>
				<select
					id="tpl"
					class="border-input bg-background h-9 max-w-md rounded-md border px-3 text-sm {fieldErrors.template
						? 'border-destructive'
						: ''}"
					bind:value={templateId}
					disabled={busy}
					aria-invalid={fieldErrors.template ? true : undefined}
					aria-describedby={fieldErrors.template ? 'err-template' : undefined}
				>
					<option value="">— keins —</option>
					{#each templates as t}
						<option value={String(t.id)}>v{t.major_version}.{t.minor_version} (ID {t.id})</option>
					{/each}
				</select>
				{#if fieldErrors.template}
					<p id="err-template" class="text-destructive text-xs">{fieldErrors.template}</p>
				{/if}
			</div>
			<div class="space-y-2">
				<Label for="fdjson">Stammdaten (JSON)</Label>
				<div
					class="border-border/60 bg-muted/25 text-muted-foreground space-y-2 rounded-md border px-3 py-2 text-xs leading-snug"
					role="note"
					aria-label="Herkunft der Stammdaten"
				>
					<p>
						<strong class="text-foreground">Datenpfad:</strong> Beim Öffnen lädt der Server alle
						Formularfelder (ohne Abstandhalter), erzeugt daraus ein Objekt und zeigt es hier als JSON. Aktuell
						<strong class="text-foreground">{data.stammdatenKeyCount}</strong>
						{data.stammdatenKeyCount === 1 ? 'Eigenschaft' : 'Eigenschaften'} — bei
						<code class="bg-muted rounded px-1 py-0.5 font-mono text-[11px]">0</code> gibt es keine Felder
						(oder die Datenbank ist leer); Stammdaten sind dann
						<code class="bg-muted rounded px-1 py-0.5 font-mono text-[11px]">{'{}'}</code>.
					</p>
					<p class="flex flex-wrap items-center gap-2">
						<Button variant="outline" size="sm" href="/data-editor">Zum Daten-Editor</Button>
						<span class="text-muted-foreground">Felder und Defaults pflegen.</span>
					</p>
				</div>
				<p class="text-muted-foreground text-xs">
					Optional anpassen — ungültiges JSON blockiert den Upload. Sind
					<span class="font-mono">AppName</span> / <span class="font-mono">AppVersion</span> im JSON als Felder
					vorhanden und leer, werden Anzeigename und Version von oben übernommen.
				</p>
				<Textarea
					id="fdjson"
					bind:value={formDataRaw}
					rows={8}
					class="font-mono text-sm {fieldErrors.formData ? 'border-destructive' : ''}"
					disabled={busy}
					spellcheck={false}
					aria-invalid={fieldErrors.formData ? true : undefined}
					aria-describedby={fieldErrors.formData ? 'err-formdata' : undefined}
				/>
				{#if fieldErrors.formData}
					<p id="err-formdata" class="text-destructive text-xs" role="alert">{fieldErrors.formData}</p>
				{/if}
			</div>
			<div class="space-y-2">
				<Label for="g">Generiertes Skript</Label>
				<Textarea
					id="g"
					bind:value={generatedScript}
					rows={14}
					class="font-mono text-sm {fieldErrors.script ? 'border-destructive' : ''}"
					disabled={busy}
					placeholder="Kein Beispielskript — eigenes PowerShell einfügen (Pflicht beim Anlegen)."
					aria-invalid={fieldErrors.script ? true : undefined}
					aria-describedby={fieldErrors.script ? 'err-script' : undefined}
				/>
				{#if fieldErrors.script}
					<p id="err-script" class="text-destructive text-xs">{fieldErrors.script}</p>
				{/if}
			</div>
			<div
				class="bg-muted/30 space-y-2 rounded-lg border px-4 py-3 text-sm"
				aria-labelledby="upload-summary-heading"
			>
				<h3 id="upload-summary-heading" class="text-foreground font-medium">Übersicht vor dem Upload</h3>
				<dl class="text-muted-foreground grid gap-x-6 gap-y-2 sm:grid-cols-2">
					<div class="min-w-0 sm:col-span-2">
						<dt class="text-foreground font-medium">Anzeigename</dt>
						<dd class="truncate">{name.trim() || '—'}</dd>
					</div>
					<div>
						<dt class="text-foreground font-medium">Version</dt>
						<dd>{version.trim() || '—'}</dd>
					</div>
					<div>
						<dt class="text-foreground font-medium">Template</dt>
						<dd>{templateLabel}</dd>
					</div>
					<div class="sm:col-span-2">
						<dt class="text-foreground font-medium">Stammdaten (Vorlage)</dt>
						<dd>
							{data.stammdatenKeyCount}
							{data.stammdatenKeyCount === 1 ? 'Eigenschaft' : 'Eigenschaften'} aus Formularfeldern (beim Laden
							der Seite)
						</dd>
					</div>
					<div class="min-w-0 sm:col-span-2">
						<dt class="text-foreground font-medium">Setup-Datei</dt>
						<dd class="break-words">
							{#if mainFile}
								{mainFile.name} · {formatBytes(mainFile.size)}
							{:else}
								—
							{/if}
						</dd>
					</div>
					<div>
						<dt class="text-foreground font-medium">Zusatzdateien</dt>
						<dd>{additionalAll.length} · {formatBytes(totalBytes(additionalAll))}</dd>
					</div>
					<div>
						<dt class="text-foreground font-medium">Support-Dateien</dt>
						<dd>{supportAll.length} · {formatBytes(totalBytes(supportAll))}</dd>
					</div>
					<div class="sm:col-span-2">
						<dt class="text-foreground font-medium">Gesamt (ungefähr)</dt>
						<dd>{formatBytes(uploadSummaryTotal)}</dd>
					</div>
				</dl>
				<p class="text-muted-foreground text-xs">
					Serverlimit: max. {formatBytes(maxBytes)} pro Datei (Umgebung:
					<code class="bg-muted rounded px-1 py-0.5 font-mono text-[10px]">MAX_UPLOAD_BYTES</code>).
				</p>
			</div>
			<Button disabled={busy} onclick={submit}>Hochladen &amp; anlegen</Button>
		</CardContent>
	</Card>
</div>
