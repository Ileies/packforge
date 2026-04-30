<script lang="ts">
	import { onMount } from 'svelte';

	import { beforeNavigate, goto } from '$app/navigation';
	import { APP_PAGE_SHELL_CLASS } from '$lib/app/app-page-shell';
	import { PRODUCT_NAME } from '$lib/app/brand';
	import { type AceUiTheme, subscribeAceUiThemeToHtmlDark } from '$lib/client/ace-theme-from-html-dark';
	import { type ApiErrorSurface, fromJsonErr, msgErr } from '$lib/client/api-error-present';
	import { apiJson } from '$lib/client/api-fetch';
	import { apiRoutes } from '$lib/client/api-routes';
	import {
		confirmDirtyInAppNavigationAsync,
		DIRTY_NAVIGATION_WARNING_DE,
		handleDirtyBeforeUnload
	} from '$lib/client/dirty-navigation-guard';
	import { formatDateTime } from '$lib/client/locale-format';
	import { pushSuccessToast } from '$lib/client/success-toast';
	import ApiErrorCallout from '$lib/components/api-error-callout.svelte';
	import CodeEditor from '$lib/components/code-editor.svelte';
	import ContextBreadcrumb from '$lib/components/context-breadcrumb.svelte';
	import EditorViewportNarrowHint from '$lib/components/editor-viewport-narrow-hint.svelte';
	import EmptyState from '$lib/components/empty-state.svelte';
	import { Button } from '$lib/components/ui/button/index';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index';
	import { Input } from '$lib/components/ui/input/index';
	import { Label } from '$lib/components/ui/label/index';

	type Summary = { id: number; major_version: number; minor_version: number; created_at: string | null };

	let list = $state<Summary[]>([]);
	let listLoading = $state(true);
	let selectedId = $state<number | null>(null);
	let content = $state('');
	let majorVersion = $state(1);
	let aceTheme = $state<AceUiTheme>('github');
	let err = $state<ApiErrorSurface | null>(null);
	let msg = $state<string | null>(null);
	let busy = $state(false);
	let templateBaselineFingerprint = $state(JSON.stringify({ id: null, content: '', majorVersion: 1 }));

	async function loadList() {
		listLoading = true;
		err = null;
		try {
			const r = await apiJson<Summary[]>(apiRoutes.templates.list);
			if (!r.ok) {
				err = fromJsonErr(r);
				return;
			}
			list = r.data;
		} finally {
			listLoading = false;
		}
	}

	async function loadTemplate(id: number) {
		err = null;
		const r = await apiJson<{ content?: unknown; major_version?: unknown }>(apiRoutes.templates.detail(id));
		if (!r.ok) {
			err = fromJsonErr(r);
			return;
		}
		const row = r.data;
		content = String(row.content ?? '');
		majorVersion = Number(row.major_version) || 1;
		selectedId = id;
		templateBaselineFingerprint = templateFingerprintNow();
	}

	async function saveNewVersion() {
		if (!content.trim()) {
			err = msgErr('Inhalt darf nicht leer sein.');
			return;
		}
		busy = true;
		err = null;
		msg = null;
		const maj = Math.max(1, Math.floor(Number(majorVersion)) || 1);
		const r = await apiJson<{ id?: unknown; majorVersion?: unknown; minorVersion?: unknown }>(
			apiRoutes.templates.list,
			{
				method: 'POST',
				jsonBody: { content, majorVersion: maj }
			}
		);
		busy = false;
		if (!r.ok) {
			err = fromJsonErr(r);
			return;
		}
		const d = r.data;
		const savedMsg = `Neue Version angelegt (ID ${d.id}, v${d.majorVersion}.${d.minorVersion}).`;
		msg = savedMsg;
		pushSuccessToast(savedMsg);
		await loadList();
		if (typeof d.id === 'number') await loadTemplate(d.id);
		else templateBaselineFingerprint = templateFingerprintNow();
	}

	onMount(async () => {
		await loadList();
		templateBaselineFingerprint = templateFingerprintNow();
	});

	let skipDirtyNextNav = false;

	$effect(() => subscribeAceUiThemeToHtmlDark((t) => (aceTheme = t)));

	$effect(() => {
		if (typeof window === 'undefined') return;
		const onBeforeUnload = (event: BeforeUnloadEvent) => handleDirtyBeforeUnload(event, templateDirty);
		window.addEventListener('beforeunload', onBeforeUnload);
		return () => window.removeEventListener('beforeunload', onBeforeUnload);
	});

	beforeNavigate((navigation) => {
		if (navigation.willUnload) return;
		if (skipDirtyNextNav) {
			skipDirtyNextNav = false;
			return;
		}
		if (!templateDirty) return;
		const to = navigation.to;
		navigation.cancel();
		void confirmDirtyInAppNavigationAsync(true, DIRTY_NAVIGATION_WARNING_DE).then((leave) => {
			if (leave && to) {
				skipDirtyNextNav = true;
				void goto(to.url);
			}
		});
	});

	const templateBreadcrumbs = $derived.by(() => {
		const crumbs: { label: string }[] = [{ label: 'Template-Editor' }];
		if (selectedId == null) return crumbs;
		const t = list.find((x) => x.id === selectedId);
		const ver = t ? `v${t.major_version}.${t.minor_version}` : `ID ${selectedId}`;
		return [...crumbs, { label: ver }];
	});

	const templateDocTitle = $derived.by(() => {
		if (selectedId == null) return 'Template-Editor';
		const t = list.find((x) => x.id === selectedId);
		const ver = t ? `v${t.major_version}.${t.minor_version}` : String(selectedId);
		return `Vorlage ${ver} — Template-Editor`;
	});

	const templatePersistFingerprint = $derived(templateFingerprintNow());
	const templateDirty = $derived(templatePersistFingerprint !== templateBaselineFingerprint);

	function templateFingerprintNow(): string {
		return JSON.stringify({
			id: selectedId,
			content,
			majorVersion: Math.max(1, Math.floor(Number(majorVersion)) || 1)
		});
	}
</script>

<svelte:head>
	<title>{templateDocTitle} — {PRODUCT_NAME}</title>
</svelte:head>

<div class={APP_PAGE_SHELL_CLASS}>
	<EditorViewportNarrowHint featureName="Template-Editor" />
	<Card>
		<CardHeader class="space-y-1.5">
			<ContextBreadcrumb items={templateBreadcrumbs} />
			<CardTitle tag="h1">Template-Editor</CardTitle>
			<CardDescription
				>Installations-Vorlagen in PowerShell bearbeiten, neue Versionen anlegen und mit dem Server speichern.</CardDescription
			>
		</CardHeader>
		<CardContent class="space-y-4">
			{#if err}
				<ApiErrorCallout {...err} />
			{/if}
			{#if msg}
				<p class="text-muted-foreground text-sm" role="status" aria-live="polite">{msg}</p>
			{/if}

			<div class="space-y-2">
				<Label for="tpl">Vorlage auswählen</Label>
				{#if listLoading}
					<div
						class="bg-muted h-9 max-w-md animate-pulse rounded-md"
						aria-busy="true"
						aria-label="Lade Vorlagen"
					></div>
				{:else}
					<select
						id="tpl"
						class="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 max-w-md rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
						value={selectedId ?? ''}
						onchange={(e) => {
							const v = (e.currentTarget as HTMLSelectElement).value;
							if (v) void loadTemplate(Number(v));
						}}
					>
						<option value="">Vorlage auswählen …</option>
						{#each list as t (t.id)}
							<option value={t.id}
								>v{t.major_version}.{t.minor_version} · {formatDateTime(t.created_at)} · ID {t.id}</option
							>
						{/each}
					</select>
					{#if list.length === 0}
						<EmptyState
							class="max-w-xl"
							ariaLabel="Keine gespeicherten Vorlagen"
							title="Noch keine Vorlage gespeichert"
							description="PowerShell-Inhalt unten einfügen und „Als neue Minor-Version speichern“ — dann erscheint die erste Vorlage in der Liste."
							visual="template"
							compact
						>
							{#snippet actions()}
								<Button type="button" variant="secondary" size="sm" href="#body">Zum Editor</Button>
							{/snippet}
						</EmptyState>
					{/if}
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="maj">Major-Version (für neues Speichern)</Label>
				<Input id="maj" type="number" min="1" bind:value={majorVersion} class="max-w-xs" />
			</div>

			<div class="space-y-2">
				<Label for="body">Inhalt</Label>
				<div id="body" class="min-h-0">
					<CodeEditor bind:value={content} mode="powershell" theme={aceTheme} minHeight="min(70vh, 520px)" />
				</div>
			</div>

			<Button disabled={busy || listLoading} onclick={saveNewVersion}>Als neue Minor-Version speichern</Button
			>
		</CardContent>
	</Card>
</div>
