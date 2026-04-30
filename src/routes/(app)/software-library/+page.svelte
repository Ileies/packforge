<script lang="ts">
	import { Loader } from '@lucide/svelte';
	import { onMount, untrack } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	import { APP_PAGE_SHELL_LOOSE_BOTTOM_CLASS } from '$lib/app/app-page-shell';
	import { PRODUCT_NAME } from '$lib/app/brand';
	import { type ApiErrorSurface, fromJsonErr, msgErr } from '$lib/client/api-error-present';
	import { apiJson } from '$lib/client/api-fetch';
	import { apiRoutes } from '$lib/client/api-routes';
	import {
		EMPTY_STATE_NO_CREATE_SCRIPTS_DE,
		EMPTY_STATE_SEARCH_ADJUST_DE
	} from '$lib/client/empty-state-copy';
	import { listPageDisplayedBounds, listTotalPages } from '$lib/client/list-pagination';
	import { formatDateTime, formatListRelativeHint } from '$lib/client/locale-format';
	import { downloadPsadtExport } from '$lib/client/psadt-export';
	import { hasPermission } from '$lib/client/session-user';
	import ApiErrorCallout from '$lib/components/api-error-callout.svelte';
	import ConfirmAlertDialog from '$lib/components/confirm-alert-dialog.svelte';
	import EmptyState from '$lib/components/empty-state.svelte';
	import { Button } from '$lib/components/ui/button/index';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card/index';
	import { Input } from '$lib/components/ui/input/index';
	import { Label } from '$lib/components/ui/label/index';

	type Row = { id: number; name: string; version: string | null; file_name: string; created_at?: string };

	type LibrarySort =
		| 'name_asc'
		| 'name_desc'
		| 'created_desc'
		| 'created_asc'
		| 'version_desc'
		| 'version_asc';

	const PAGE_SIZE = 24;

	let rows = $state<Row[]>([]);
	let total = $state(0);
	let pageIndex = $state(0);
	let libraryQuery = $state('');
	let librarySort = $state<LibrarySort>('name_asc');
	let err = $state<ApiErrorSurface | null>(null);
	let busy = $state(false);
	let loading = $state(true);
	let deleteOpen = $state(false);
	let deleteTarget = $state<Row | null>(null);
	let exportZipBusy = $state(false);
	let exportZipTargetId = $state<number | null>(null);
	let exportZipAbort: AbortController | null = null;
	/** Nach initialem `load()` in `onMount`: Sucheingabe debouncen (ohne zweiten Lauf beim Flag-Flip). */
	let searchDebounceReady = $state(false);

	/** Nur solange der Lösch-Dialog offen ist — kein $effect zum Zurücksetzen von `deleteTarget`. */
	const deleteDialogRow = $derived(deleteOpen ? deleteTarget : null);

	$effect(() => {
		void libraryQuery;
		if (!untrack(() => searchDebounceReady)) return;
		const h = setTimeout(() => {
			pageIndex = 0;
			void load();
		}, 350);
		return () => clearTimeout(h);
	});

	const canExport = $derived(hasPermission('EXPORT_PSADT'));
	const canEdit = $derived(hasPermission('EDIT_ALL_SCRIPTS'));
	const canCreateScripts = $derived(hasPermission('CREATE_SCRIPTS'));

	const pageBusy = $derived(busy || exportZipBusy);

	const totalPages = $derived(listTotalPages(total, PAGE_SIZE));
	const listBounds = $derived(listPageDisplayedBounds(total, pageIndex, PAGE_SIZE, rows.length));
	const rangeStart = $derived(listBounds.start);
	const rangeEnd = $derived(listBounds.end);

	function clearLibraryFilters() {
		libraryQuery = '';
		librarySort = 'name_asc';
		pageIndex = 0;
		void load();
	}

	async function load(depth = 0): Promise<void> {
		if (depth > 8) return;
		loading = true;
		err = null;
		try {
			const params = new SvelteURLSearchParams();
			params.set('limit', String(PAGE_SIZE));
			params.set('offset', String(pageIndex * PAGE_SIZE));
			params.set('search', libraryQuery.trim());
			params.set('sort', librarySort);
			const r = await apiJson<{ total?: number; items?: Row[] }>(`${apiRoutes.software.list}?${params}`);
			if (!r.ok) {
				err = fromJsonErr(r);
				return;
			}
			total = r.data.total ?? 0;
			rows = r.data.items ?? [];
			const tp = listTotalPages(total, PAGE_SIZE);
			if (total > 0 && pageIndex >= tp) {
				pageIndex = tp - 1;
				await load(depth + 1);
				return;
			}
		} finally {
			loading = false;
		}
	}

	function goPrev() {
		if (pageIndex <= 0) return;
		pageIndex -= 1;
		void load();
	}

	function goNext() {
		if (pageIndex >= totalPages - 1) return;
		pageIndex += 1;
		void load();
	}

	function onSortChange() {
		pageIndex = 0;
		void load();
	}

	onMount(async () => {
		await load();
		searchDebounceReady = true;
	});

	function cancelExportZip() {
		exportZipAbort?.abort();
	}

	async function exportZip(id: number, name: string) {
		if (exportZipBusy) return;
		exportZipAbort?.abort();
		exportZipAbort = new AbortController();
		const ac = exportZipAbort;
		exportZipBusy = true;
		exportZipTargetId = id;
		err = null;
		try {
			const r = await downloadPsadtExport(id, name, { signal: ac.signal });
			if (!r.ok) err = msgErr(r.error);
		} catch (e) {
			if (ac.signal.aborted) err = msgErr('Export abgebrochen.');
			else err = msgErr(e instanceof Error ? e.message : String(e));
		} finally {
			exportZipBusy = false;
			exportZipTargetId = null;
			if (exportZipAbort === ac) exportZipAbort = null;
		}
	}

	function openDeleteDialog(s: Row) {
		deleteTarget = s;
		deleteOpen = true;
	}

	async function confirmDelete(): Promise<boolean> {
		const t = deleteTarget;
		if (!t) return true;
		busy = true;
		err = null;
		const r = await apiJson(apiRoutes.software.detail(t.id), { method: 'DELETE' });
		busy = false;
		if (!r.ok) {
			err = fromJsonErr(r);
			return false;
		}
		await load();
		return true;
	}
</script>

<svelte:head>
	<title>Software-Bibliothek — {PRODUCT_NAME}</title>
</svelte:head>

<div class={APP_PAGE_SHELL_LOOSE_BOTTOM_CLASS}>
	{#if deleteDialogRow}
		<ConfirmAlertDialog
			bind:open={deleteOpen}
			title="Software-Eintrag löschen?"
			description="Sie löschen dauerhaft „{deleteDialogRow.name}“ ({deleteDialogRow.version
				? `Version ${deleteDialogRow.version}, `
				: ''}{deleteDialogRow.file_name}). Das lässt sich hier nicht wiederherstellen."
			confirmLabel="Endgültig löschen"
			cancelLabel="Abbrechen"
			confirmDisabled={pageBusy}
			onconfirm={confirmDelete}
		/>
	{/if}
	<Card>
		<CardHeader class="space-y-4">
			<div>
				<CardTitle tag="h1">Software-Bibliothek</CardTitle>
				<CardDescription>
					Pakete suchen, sortieren und seitenweise anzeigen. PSADT-ZIP-Export, Öffnen im Script-Editor und
					Löschen stehen je nach Rolle zur Verfügung.
				</CardDescription>
			</div>
			{#if !loading && !err && (total > 0 || libraryQuery.trim() || librarySort !== 'name_asc')}
				<div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
					<div class="min-w-0 flex-1 space-y-1.5">
						<Label for="lib-q">Suche</Label>
						<Input
							id="lib-q"
							type="search"
							autocomplete="off"
							placeholder="Name, Version, Dateiname …"
							bind:value={libraryQuery}
						/>
					</div>
					<div class="w-full min-w-[12rem] space-y-1.5 sm:w-auto">
						<Label for="lib-sort">Sortierung</Label>
						<select
							id="lib-sort"
							class="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:min-w-[14rem]"
							bind:value={librarySort}
							onchange={onSortChange}
						>
							<option value="name_asc">Name (A-Z)</option>
							<option value="name_desc">Name (Z-A)</option>
							<option value="created_desc">Angelegt (neueste zuerst)</option>
							<option value="created_asc">Angelegt (älteste zuerst)</option>
							<option value="version_desc">Version (hoch zuerst)</option>
							<option value="version_asc">Version (niedrig zuerst)</option>
						</select>
					</div>
					{#if libraryQuery.trim() || librarySort !== 'name_asc'}
						<Button type="button" variant="outline" class="w-full sm:w-auto" onclick={clearLibraryFilters}>
							Filter zurücksetzen
						</Button>
					{/if}
				</div>
			{/if}
		</CardHeader>
		<CardContent class="pb-8">
			{#if loading}
				<div
					class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
					aria-busy="true"
					aria-label="Lade Software-Einträge"
				>
					{#each [1, 2, 3, 4, 5, 6] as _, i (i)}
						<div
							class="border-border/80 flex h-36 flex-col gap-2 rounded-lg border bg-muted/50 p-4 shadow-sm"
						>
							<div class="bg-muted h-4 w-3/5 max-w-[200px] animate-pulse rounded"></div>
							<div class="bg-muted h-3 w-4/5 animate-pulse rounded"></div>
							<div class="bg-muted mt-auto h-8 w-24 animate-pulse rounded-md"></div>
						</div>
					{/each}
				</div>
			{:else if err}
				<div class="mb-3">
					<ApiErrorCallout {...err} />
				</div>
			{:else}
				{#if total > 0}
					<p class="text-muted-foreground mb-3 text-xs">
						Einträge {rangeStart}–{rangeEnd} von {total.toLocaleString('de-DE')} · Seite {pageIndex + 1} von {totalPages}
					</p>
				{/if}
				<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{#each rows as s (s.id)}
						<Card class="border-border/80 shadow-sm">
							<CardHeader class="pb-2">
								<CardTitle class="text-base leading-tight">{s.name}</CardTitle>
								<CardDescription class="text-xs">
									{s.version ? `v${s.version} · ` : ''}{s.file_name}
									{#if s.created_at}
										{@const rel = formatListRelativeHint(s.created_at)}
										<span
											class="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] leading-snug"
											title={rel?.absoluteTitle ?? formatDateTime(s.created_at)}
										>
											{#if rel?.badge}
												<span
													class="border-border bg-muted/80 text-foreground rounded border px-1 py-px text-[10px] font-medium tracking-wide uppercase"
													>{rel.badge}</span
												>
											{/if}
											<span>
												Angelegt {formatDateTime(s.created_at)}{#if rel?.suffix}<span class="opacity-90">
														· {rel.suffix}</span
													>{/if}
											</span>
										</span>
									{/if}
								</CardDescription>
							</CardHeader>
							<CardFooter class="flex flex-wrap gap-2 border-t pt-3">
								<a
									href="/script-editor?id={s.id}"
									class="text-primary text-xs font-medium hover:underline"
									aria-label={`Software „${s.name}“ im Script-Editor öffnen`}>Im Editor öffnen →</a
								>
								{#if canExport}
									<Button
										size="sm"
										variant="outline"
										disabled={pageBusy}
										title="PSADT-Paket als ZIP herunterladen"
										onclick={() => void exportZip(s.id, s.name)}
									>
										{exportZipBusy && exportZipTargetId === s.id ? 'Export …' : 'ZIP'}
									</Button>
								{/if}
								{#if canEdit}
									<Button
										size="sm"
										variant="destructive"
										disabled={pageBusy}
										onclick={() => openDeleteDialog(s)}>Löschen</Button
									>
								{/if}
							</CardFooter>
							{#if exportZipBusy && exportZipTargetId === s.id}
								<div class="text-muted-foreground flex flex-wrap items-center gap-2 px-6 pb-3 text-xs">
									<Loader class="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
									<span role="status">ZIP wird erstellt …</span>
									<Button type="button" variant="ghost" size="sm" class="h-7 px-2" onclick={cancelExportZip}
										>Abbrechen</Button
									>
								</div>
							{/if}
						</Card>
					{:else}
						{#if total > 0}
							<EmptyState
								class="col-span-full w-full sm:col-span-2 xl:col-span-3"
								ariaLabel="Keine Suchtreffer in der Software-Bibliothek"
								title="Keine Treffer für diese Suche"
								description={EMPTY_STATE_SEARCH_ADJUST_DE}
								visual="search"
							>
								{#snippet actions()}
									<Button type="button" variant="outline" onclick={clearLibraryFilters}>
										Filter zurücksetzen
									</Button>
								{/snippet}
							</EmptyState>
						{:else if canCreateScripts}
							<EmptyState
								class="col-span-full w-full sm:col-span-2 xl:col-span-3"
								ariaLabel="Leere Software-Bibliothek"
								title="Noch keine Software-Einträge"
								description="Legen Sie das erste PSADT-Paket über den Script Maker an — danach erscheint es hier mit Export und Editor-Verknüpfung."
								visual="package"
							>
								{#snippet actions()}
									<Button href="/script-maker">Erstes Paket anlegen</Button>
								{/snippet}
							</EmptyState>
						{:else}
							<EmptyState
								class="col-span-full w-full sm:col-span-2 xl:col-span-3"
								ariaLabel="Leere Software-Bibliothek"
								title="Noch keine Software-Einträge"
								description={EMPTY_STATE_NO_CREATE_SCRIPTS_DE}
								visual="package"
							/>
						{/if}
					{/each}
				</div>
				{#if total > PAGE_SIZE}
					<div
						class="border-border mt-6 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-sm"
						aria-label="Seitenweise Navigation"
					>
						<Button variant="outline" size="sm" disabled={loading || pageIndex <= 0} onclick={goPrev}>
							Zurück
						</Button>
						<span class="text-muted-foreground">
							Seite {pageIndex + 1} / {totalPages}
						</span>
						<Button
							variant="outline"
							size="sm"
							disabled={loading || pageIndex >= totalPages - 1}
							onclick={goNext}
						>
							Weiter
						</Button>
					</div>
				{/if}
			{/if}
		</CardContent>
	</Card>
</div>
