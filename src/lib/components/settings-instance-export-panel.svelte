<script lang="ts">
	import { Loader } from '@lucide/svelte';

	import { type ApiErrorSurface, msgErr } from '$lib/client/api-error-present';
	import { authHeaders, parseFailedResponse } from '$lib/client/api-fetch';
	import { apiRoutes } from '$lib/client/api-routes';
	import { hasPermission } from '$lib/client/session-user';
	import ApiErrorCallout from '$lib/components/api-error-callout.svelte';
	import LiveRegionFocus from '$lib/components/live-region-focus.svelte';
	import { Button } from '$lib/components/ui/button/index';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index';

	const canExportInstance = $derived(hasPermission('ADMIN_INSTANCE_EXPORT'));

	let busy = $state(false);
	let message = $state<string | null>(null);
	let error = $state<ApiErrorSurface | null>(null);
	let exportAbort: AbortController | null = null;
	function cancelExport() {
		exportAbort?.abort();
	}

	async function downloadExport() {
		if (!canExportInstance) return;
		exportAbort?.abort();
		exportAbort = new AbortController();
		const ac = exportAbort;
		busy = true;
		error = null;
		message = null;
		try {
			const r = await fetch(apiRoutes.admin.instanceExport, {
				method: 'POST',
				credentials: 'same-origin',
				headers: authHeaders(false),
				signal: ac.signal
			});
			if (!r.ok) {
				error = await parseFailedResponse(r);
				return;
			}
			const blob = await r.blob();
			const cd = r.headers.get('Content-Disposition');
			let filename = 'packforge-instance-export.zip';
			const m = cd?.match(/filename="([^"]+)"/);
			if (m?.[1]) filename = m[1];
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			a.click();
			URL.revokeObjectURL(url);
			message = 'ZIP wurde heruntergeladen.';
		} catch (e) {
			if (ac.signal.aborted) {
				error = msgErr('Export abgebrochen.');
				return;
			}
			error = msgErr(e instanceof Error ? e.message : 'Export fehlgeschlagen.');
		} finally {
			busy = false;
			if (exportAbort === ac) exportAbort = null;
		}
	}
</script>

{#if canExportInstance}
	<Card class="border-border/80 flex flex-col gap-0 overflow-hidden pt-0 shadow-sm">
		<CardHeader class="bg-muted/30 border-border/60 rounded-t-xl border-b px-4 py-3 sm:px-5">
			<CardTitle class="text-base">Instanz-Datenexport</CardTitle>
			<CardDescription class="text-sm">
				Vollständiges ZIP mit Datenbanken, Uploads, Vorlagen und Prompts. Der Vorgang wird im Audit-Log
				festgehalten.
			</CardDescription>
			<p
				class="border-border/60 bg-muted/25 text-muted-foreground mt-2 rounded-md border px-3 py-2 text-xs leading-snug"
				role="note"
			>
				<strong class="text-foreground">Was passiert:</strong> Einmaliger Download einer
				<strong class="text-foreground">ZIP-Datei</strong> mit personenbezogenen und fachlichen Daten dieser
				Instanz. Der Vorgang ist <strong class="text-foreground">nachvollziehbar protokolliert</strong>; ein
				„Rückgängig“ auf dem Server gibt es nicht — ZIP sicher verwahren oder löschen.
			</p>
		</CardHeader>
		<CardContent class="space-y-3 px-4 py-3 sm:px-5 sm:py-4">
			{#if error}
				<ApiErrorCallout {...error} />
			{/if}
			{#if message}
				<LiveRegionFocus when={message} role="status" class="text-muted-foreground text-sm outline-none">
					{message}
				</LiveRegionFocus>
			{/if}
			{#if busy}
				<div
					class="text-muted-foreground flex flex-wrap items-center gap-2 text-xs"
					role="status"
					aria-live="polite"
				>
					<Loader class="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
					<span>Instanz-Export wird vorbereitet …</span>
					<Button type="button" variant="ghost" size="sm" class="h-7 px-2" onclick={cancelExport}
						>Abbrechen</Button
					>
				</div>
			{/if}
			<p class="text-muted-foreground text-xs leading-snug">
				Hinweis: Bei laufendem Betrieb können SQLite-Kopien kurz inkonsistent sein — Export bei geringer Last
				oder nach kurzer Wartung einplanen (siehe <code class="font-mono text-[11px]">docs/compliance.md</code
				>).
			</p>
			<Button type="button" variant="secondary" disabled={busy} onclick={() => void downloadExport()}>
				{busy ? '…' : 'ZIP exportieren'}
			</Button>
		</CardContent>
	</Card>
{/if}
