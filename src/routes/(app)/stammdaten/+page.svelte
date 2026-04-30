<script lang="ts">
	import ArrowDown from 'lucide-svelte/icons/arrow-down';
	import ArrowUp from 'lucide-svelte/icons/arrow-up';
	import { onMount, untrack } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	import { APP_PAGE_SHELL_CLASS } from '$lib/app/app-page-shell';
	import { PRODUCT_NAME } from '$lib/app/brand';
	import { type ApiErrorSurface, fromJsonErr } from '$lib/client/api-error-present';
	import { apiJson } from '$lib/client/api-fetch';
	import { apiRoutes } from '$lib/client/api-routes';
	import {
		EMPTY_STATE_NO_CREATE_SCRIPTS_DE,
		EMPTY_STATE_SEARCH_ADJUST_DE
	} from '$lib/client/empty-state-copy';
	import { listPageDisplayedBounds, listTotalPages } from '$lib/client/list-pagination';
	import { formatDateTime, formatListRelativeHint } from '$lib/client/locale-format';
	import { hasPermission } from '$lib/client/session-user';
	import { pushSuccessToast } from '$lib/client/success-toast';
	import ApiErrorCallout from '$lib/components/api-error-callout.svelte';
	import EmptyState from '$lib/components/empty-state.svelte';
	import { Button } from '$lib/components/ui/button/index';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index';
	import { Input } from '$lib/components/ui/input/index';
	import { Label } from '$lib/components/ui/label/index';

	const PAGE_SIZE = 50;

	type SortCol = 'app_vendor' | 'app_name' | 'app_version';

	let total = $state(0);
	let packages = $state<Record<string, unknown>[]>([]);
	let pageIndex = $state(0);
	let searchQuery = $state('');
	let loading = $state(false);

	let selId = $state<number | null>(null);
	let vendor = $state('');
	let appName = $state('');
	let appVersion = $state('');
	let err = $state<ApiErrorSurface | null>(null);
	let msg = $state<string | null>(null);
	let saving = $state(false);
	let sortColumn = $state<SortCol>('app_name');
	let sortDirection = $state<'asc' | 'desc'>('asc');
	let listContainer = $state<HTMLDivElement | null>(null);

	/** Nach initialem Load: Sucheingabe debouncen (kein Request pro Tastendruck). */
	let searchDebounceReady = $state(false);
	let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

	const totalPages = $derived(listTotalPages(total, PAGE_SIZE));
	const canCreateScripts = $derived(hasPermission('CREATE_SCRIPTS'));

	function clearSearchDebounce() {
		if (searchDebounceTimer) {
			clearTimeout(searchDebounceTimer);
			searchDebounceTimer = null;
		}
	}

	$effect(() => {
		void searchQuery;
		if (!untrack(() => searchDebounceReady)) return;
		clearSearchDebounce();
		searchDebounceTimer = setTimeout(() => {
			searchDebounceTimer = null;
			pageIndex = 0;
			selId = null;
			vendor = '';
			appName = '';
			appVersion = '';
			msg = null;
			void load();
		}, 400);
		return () => clearSearchDebounce();
	});
	const rowGridClass =
		'grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.65fr)_minmax(0,5.75rem)] items-center gap-2 text-left';
	const listBounds = $derived(listPageDisplayedBounds(total, pageIndex, PAGE_SIZE, packages.length));
	const rangeStart = $derived(listBounds.start);
	const rangeEnd = $derived(listBounds.end);

	async function load(depth = 0): Promise<void> {
		if (depth > 5) return;
		loading = true;
		err = null;
		try {
			const params = new SvelteURLSearchParams();
			params.set('limit', String(PAGE_SIZE));
			params.set('offset', String(pageIndex * PAGE_SIZE));
			const q = searchQuery.trim();
			if (q) params.set('search1', q);
			params.set('sortColumn', sortColumn);
			params.set('sortDirection', sortDirection);

			const r = await apiJson<{ total?: number; packages?: Record<string, unknown>[] }>(
				`${apiRoutes.packages.list}?${params}`
			);
			if (!r.ok) {
				err = fromJsonErr(r);
				return;
			}
			const d = r.data;
			total = d.total ?? 0;
			packages = d.packages ?? [];

			const tp = listTotalPages(total, PAGE_SIZE);
			if (total > 0 && pageIndex >= tp) {
				pageIndex = tp - 1;
				await load(depth + 1);
				return;
			}

			if (selId != null && !packages.some((p) => Number(p.id) === selId)) {
				selId = null;
				vendor = '';
				appName = '';
				appVersion = '';
			}
		} finally {
			loading = false;
		}
	}

	function submitSearch(e: Event) {
		e.preventDefault();
		clearSearchDebounce();
		pageIndex = 0;
		selId = null;
		vendor = '';
		appName = '';
		appVersion = '';
		msg = null;
		void load();
	}

	function clearSearch() {
		clearSearchDebounce();
		searchQuery = '';
		pageIndex = 0;
		selId = null;
		vendor = '';
		appName = '';
		appVersion = '';
		msg = null;
		void load();
	}

	function goPrev() {
		if (pageIndex <= 0) return;
		pageIndex -= 1;
		selId = null;
		vendor = '';
		appName = '';
		appVersion = '';
		msg = null;
		void load();
	}

	function goNext() {
		if (pageIndex >= totalPages - 1) return;
		pageIndex += 1;
		selId = null;
		vendor = '';
		appName = '';
		appVersion = '';
		msg = null;
		void load();
	}

	function pick(p: Record<string, unknown>) {
		selId = Number(p.id);
		vendor = String(p.app_vendor ?? '');
		appName = String(p.app_name ?? '');
		appVersion = String(p.app_version ?? '');
		msg = null;
		err = null;
	}

	function clearPackSelection() {
		if (selId == null) return;
		const snap = {
			selId,
			vendor,
			appName,
			appVersion
		};
		selId = null;
		vendor = '';
		appName = '';
		appVersion = '';
		msg = null;
		pushSuccessToast('Paket abgewählt.', {
			onUndo: () => {
				selId = snap.selId;
				vendor = snap.vendor;
				appName = snap.appName;
				appVersion = snap.appVersion;
			}
		});
	}

	function packageRowAriaLabel(p: Record<string, unknown>): string {
		const bits = [String(p.app_vendor ?? ''), String(p.app_name ?? ''), String(p.app_version ?? '')].filter(
			Boolean
		);
		const base = bits.length ? bits.join(', ') : 'Paket';
		const raw = String(p.updated_at ?? p.created_at ?? '').trim();
		if (!raw) return base;
		return `${base}, Stand ${formatDateTime(raw)}`;
	}

	async function save() {
		if (selId == null) return;
		const id = selId;
		const pkgIdx = packages.findIndex((p) => Number(p.id) === id);
		const packagesBackup = packages.map((p) => ({ ...p }));
		const vendorBackup = vendor;
		const appNameBackup = appName;
		const appVersionBackup = appVersion;

		if (pkgIdx >= 0) {
			const p = { ...packages[pkgIdx], app_vendor: vendor, app_name: appName, app_version: appVersion };
			packages = packages.map((x, i) => (i === pkgIdx ? p : x));
		}

		saving = true;
		err = null;
		msg = null;
		const r = await apiJson(apiRoutes.packages.detail(id), {
			method: 'PUT',
			jsonBody: { app_vendor: vendor, app_name: appName, app_version: appVersion }
		});
		saving = false;
		if (!r.ok) {
			packages = packagesBackup;
			vendor = vendorBackup;
			appName = appNameBackup;
			appVersion = appVersionBackup;
			err = fromJsonErr(r);
			return;
		}
		msg = 'Gespeichert.';
		pushSuccessToast('Gespeichert.');
	}

	function setSort(col: SortCol) {
		if (sortColumn === col) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = col;
			sortDirection = 'asc';
		}
		pageIndex = 0;
		selId = null;
		vendor = '';
		appName = '';
		appVersion = '';
		msg = null;
		void load();
	}

	function focusPkgRow(index: number) {
		const root = listContainer;
		if (!root) return;
		const el = root.querySelector<HTMLElement>(`[data-pkg-row="${index}"]`);
		el?.focus();
	}

	function onPkgRowKeydown(e: KeyboardEvent, index: number) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (index < packages.length - 1) focusPkgRow(index + 1);
			return;
		}
		if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (index > 0) focusPkgRow(index - 1);
			return;
		}
		if (e.key === 'Home') {
			e.preventDefault();
			focusPkgRow(0);
			return;
		}
		if (e.key === 'End') {
			e.preventDefault();
			focusPkgRow(packages.length - 1);
		}
	}

	function sortHeaderAria(col: SortCol, label: string): string {
		const active = sortColumn === col;
		const dir = sortDirection === 'asc' ? 'aufsteigend' : 'absteigend';
		if (active) return `${label}: sortiert ${dir}. Erneut klicken, um die Richtung zu wechseln.`;
		return `${label}: klicken, nach dieser Spalte zu sortieren.`;
	}

	onMount(async () => {
		await load();
		searchDebounceReady = true;
	});
</script>

<svelte:head>
	<title>Stammdaten — {PRODUCT_NAME}</title>
</svelte:head>

<div class={APP_PAGE_SHELL_CLASS}>
	<div class="grid gap-6 lg:grid-cols-2">
		<Card>
			<CardHeader class="space-y-4">
				<div>
					<CardTitle tag="h1">Stammdaten</CardTitle>
					<CardDescription>
						{#if total === 0}
							Keine Einträge (oder leeres Suchergebnis).
						{:else}
							Einträge {rangeStart}–{rangeEnd} von {total.toLocaleString('de-DE')} · Seite {pageIndex + 1} von {totalPages}.
						{/if}
						Sortierbare <strong class="text-foreground font-medium">Paket-Stammdaten</strong> (Hersteller,
						Name, Version u. a.). Beim Tippen wird nach kurzer Pause automatisch gefiltert;
						<kbd class="bg-muted rounded border px-1 py-px font-mono text-[11px]">Enter</kbd> startet die Suche
						sofort.
					</CardDescription>
				</div>
				<form class="flex flex-col gap-3" onsubmit={submitSearch}>
					<div class="flex flex-col gap-3 sm:flex-row sm:items-end">
						<div class="min-w-0 flex-1 space-y-1.5">
							<Label for="pkg-q">Suche</Label>
							<Input
								id="pkg-q"
								type="search"
								autocomplete="off"
								placeholder="z.B. Vendor, App-Name, Version …"
								bind:value={searchQuery}
								aria-busy={loading}
							/>
						</div>
						<div class="flex flex-wrap gap-2">
							{#if searchQuery.trim()}
								<Button type="button" variant="outline" disabled={loading} onclick={clearSearch}>
									Filter zurücksetzen
								</Button>
							{/if}
						</div>
					</div>
				</form>
			</CardHeader>
			<CardContent class="flex max-h-[min(70vh,560px)] flex-col gap-3">
				{#if loading}
					<div class="space-y-2" aria-busy="true" aria-label="Lade Pakete …">
						{#each [1, 2, 3, 4, 5, 6] as _, i (i)}
							<div
								class="border-border/80 flex flex-col gap-1 rounded-md border bg-muted/40 px-2 py-2 shadow-sm"
							>
								<div class="bg-muted h-4 w-2/3 max-w-[220px] animate-pulse rounded"></div>
								<div class="bg-muted h-3 w-4/5 animate-pulse rounded"></div>
							</div>
						{/each}
					</div>
				{:else if packages.length === 0}
					{#if searchQuery.trim()}
						<EmptyState
							class="w-full"
							ariaLabel="Keine Pakete für diese Suche"
							title="Keine Treffer für diese Suche"
							description={EMPTY_STATE_SEARCH_ADJUST_DE}
							visual="search"
						>
							{#snippet actions()}
								<Button type="button" variant="outline" disabled={loading} onclick={clearSearch}>
									Filter zurücksetzen
								</Button>
							{/snippet}
						</EmptyState>
					{:else if canCreateScripts}
						<EmptyState
							class="w-full"
							ariaLabel="Keine Paket-Einträge"
							title="Noch keine Paket-Stammdaten"
							description="Angelegte PSADT-Einträge und Metadaten verwalten Sie über die Software-Bibliothek und den Script-Editor."
							visual="database"
						>
							{#snippet actions()}
								<Button href="/script-maker">Zum Script Maker</Button>
								<Button variant="outline" href="/software-library">Zur Software-Bibliothek</Button>
							{/snippet}
						</EmptyState>
					{:else}
						<EmptyState
							class="w-full"
							ariaLabel="Keine Paket-Einträge"
							title="Noch keine Paket-Stammdaten"
							description={EMPTY_STATE_NO_CREATE_SCRIPTS_DE}
							visual="database"
						/>
					{/if}
				{:else}
					<div
						bind:this={listContainer}
						class="min-h-0 flex-1 overflow-auto rounded-md border border-border/80 text-sm"
						role="region"
						aria-label="Paketliste mit sortierbaren Spalten"
					>
						<div
							class="bg-muted/50 text-muted-foreground sticky top-0 z-10 border-b border-border/80 px-2 py-1.5 text-xs font-medium uppercase tracking-wide"
						>
							<div class={rowGridClass}>
								<button
									type="button"
									class="hover:text-foreground inline-flex items-center gap-1 rounded px-1 py-0.5 text-left"
									aria-label={sortHeaderAria('app_vendor', 'Hersteller')}
									onclick={() => setSort('app_vendor')}
								>
									Hersteller
									{#if sortColumn === 'app_vendor'}
										{#if sortDirection === 'asc'}
											<ArrowUp class="size-3.5 shrink-0" aria-hidden="true" />
										{:else}
											<ArrowDown class="size-3.5 shrink-0" aria-hidden="true" />
										{/if}
									{/if}
								</button>
								<button
									type="button"
									class="hover:text-foreground inline-flex items-center gap-1 rounded px-1 py-0.5 text-left"
									aria-label={sortHeaderAria('app_name', 'App-Name')}
									onclick={() => setSort('app_name')}
								>
									App-Name
									{#if sortColumn === 'app_name'}
										{#if sortDirection === 'asc'}
											<ArrowUp class="size-3.5 shrink-0" aria-hidden="true" />
										{:else}
											<ArrowDown class="size-3.5 shrink-0" aria-hidden="true" />
										{/if}
									{/if}
								</button>
								<button
									type="button"
									class="hover:text-foreground inline-flex items-center gap-1 rounded px-1 py-0.5 text-left"
									aria-label={sortHeaderAria('app_version', 'Version')}
									onclick={() => setSort('app_version')}
								>
									Version
									{#if sortColumn === 'app_version'}
										{#if sortDirection === 'asc'}
											<ArrowUp class="size-3.5 shrink-0" aria-hidden="true" />
										{:else}
											<ArrowDown class="size-3.5 shrink-0" aria-hidden="true" />
										{/if}
									{/if}
								</button>
								<span class="text-left normal-case" aria-hidden="true">Stand</span>
							</div>
						</div>
						<div class="divide-y divide-border/60">
							{#each packages as p, i (p.id)}
								<button
									type="button"
									data-pkg-row={i}
									class="hover:bg-muted/80 {rowGridClass} border-transparent px-2 py-2 {selId === Number(p.id)
										? 'bg-muted ring-1 ring-inset ring-border'
										: ''}"
									aria-current={selId === Number(p.id) ? 'true' : undefined}
									aria-label={packageRowAriaLabel(p)}
									onclick={() => pick(p)}
									onkeydown={(e) => onPkgRowKeydown(e, i)}
								>
									<span class="truncate">{String(p.app_vendor ?? '')}</span>
									<span class="truncate font-medium">{String(p.app_name ?? '')}</span>
									<span class="text-muted-foreground truncate text-xs">{String(p.app_version ?? '')}</span>
									<span
										class="text-muted-foreground flex min-w-0 flex-col items-start gap-0.5 truncate text-left text-[10px] leading-tight"
									>
										{#if String(p.updated_at ?? p.created_at ?? '').trim()}
											{@const raw = String(p.updated_at ?? p.created_at)}
											{@const rel = formatListRelativeHint(raw)}
											<span class="w-full truncate" title={rel?.absoluteTitle ?? formatDateTime(raw)}
												>{formatDateTime(raw)}</span
											>
											{#if rel?.badge || rel?.suffix}
												<span class="flex w-full min-w-0 flex-wrap items-center gap-1">
													{#if rel.badge}
														<span
															class="border-border bg-background text-foreground shrink-0 rounded border px-0.5 py-px text-[9px] font-medium tracking-wide uppercase"
															>{rel.badge}</span
														>
													{/if}
													{#if rel.suffix}
														<span class="text-muted-foreground truncate">{rel.suffix}</span>
													{/if}
												</span>
											{/if}
										{:else}
											<span>—</span>
										{/if}
									</span>
								</button>
							{/each}
						</div>
					</div>
				{/if}
				<div
					class="border-border flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm"
					aria-label="Seitenweise Navigation"
				>
					<Button variant="outline" size="sm" disabled={loading || pageIndex <= 0} onclick={goPrev}>
						Zurück
					</Button>
					<span class="text-muted-foreground">
						{#if total > 0}
							Seite {pageIndex + 1} / {totalPages}
						{:else}
							—
						{/if}
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
			</CardContent>
		</Card>
		<Card>
			<CardHeader>
				<CardTitle tag="h2">Bearbeiten</CardTitle>
			</CardHeader>
			<CardContent class="space-y-3">
				{#if err}
					<ApiErrorCallout {...err} />
				{/if}
				{#if msg}
					<p class="text-muted-foreground text-sm" role="status" aria-live="polite">{msg}</p>
				{/if}
				{#if selId != null}
					<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
						<span class="text-muted-foreground text-xs">Paket-ID {selId}</span>
						<Button type="button" variant="outline" size="sm" onclick={clearPackSelection}>
							Auswahl aufheben
						</Button>
					</div>
					<div class="space-y-2">
						<Label>Hersteller</Label>
						<Input bind:value={vendor} disabled={saving} />
					</div>
					<div class="space-y-2">
						<Label>App-Name</Label>
						<Input bind:value={appName} disabled={saving} />
					</div>
					<div class="space-y-2">
						<Label>Version</Label>
						<Input bind:value={appVersion} disabled={saving} />
					</div>
					<Button disabled={saving} onclick={save}>Speichern</Button>
				{:else}
					<p class="text-muted-foreground text-sm">Wählen Sie links ein Paket aus.</p>
				{/if}
			</CardContent>
		</Card>
	</div>
</div>
