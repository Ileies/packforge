<script lang="ts">
	import Loader from 'lucide-svelte/icons/loader';

	import type { PendingAi } from '$lib/client/script-editor-types';
	import { Button } from '$lib/components/ui/button/index';
	import { Input } from '$lib/components/ui/input/index';
	import { Textarea } from '$lib/components/ui/textarea/index';

	type Props = {
		busy: boolean;
		genericAiStreaming: boolean;
		pendingAi: PendingAi | null;
		enrichOut: string;
		genericAiStreamOut: string;
		sid: string;
		improveReq?: string;
		fixIssue?: string;
		enrichReq?: string;
		genericAiPrompt?: string;
		aiHtmlPanel?: string;
		onRunImprove: () => void;
		onRunFix: () => void;
		onRunEnrich: () => void;
		onRunStream: () => void;
		onSaveAiHtml: () => void;
		onApplyPending: () => void;
		onDiscardPending: () => void;
		onCancelBusy?: () => void;
		onCancelStream?: () => void;
	};

	let {
		busy,
		genericAiStreaming,
		pendingAi,
		enrichOut,
		genericAiStreamOut,
		sid,
		improveReq = $bindable(''),
		fixIssue = $bindable(''),
		enrichReq = $bindable(''),
		genericAiPrompt = $bindable(''),
		aiHtmlPanel = $bindable(''),
		onRunImprove,
		onRunFix,
		onRunEnrich,
		onRunStream,
		onSaveAiHtml,
		onApplyPending,
		onDiscardPending,
		onCancelBusy,
		onCancelStream
	}: Props = $props();

	let advancedKiOpen = $state(false);

	$effect(() => {
		if (genericAiStreaming) advancedKiOpen = true;
	});
</script>

<div class="rounded-md border p-3 space-y-2">
	<h3 class="text-sm font-medium">KI</h3>
	{#if busy}
		<div
			class="text-muted-foreground flex flex-wrap items-center gap-2 text-xs"
			role="status"
			aria-live="polite"
		>
			<Loader class="text-muted-foreground size-3.5 shrink-0 animate-spin" aria-hidden="true" />
			<span>Serveranfrage läuft (KI / Enrichment) …</span>
			{#if onCancelBusy}
				<Button type="button" variant="ghost" size="sm" class="h-7 px-2 text-xs" onclick={onCancelBusy}
					>Abbrechen</Button
				>
			{/if}
		</div>
	{/if}
	<Input placeholder="Verbesserungswunsch…" bind:value={improveReq} disabled={busy} />
	<Button size="sm" variant="secondary" disabled={busy} onclick={onRunImprove}>Verbessern</Button>
	<Input placeholder="Problem / Fehlerbeschreibung…" bind:value={fixIssue} disabled={busy} />
	<Button size="sm" variant="secondary" disabled={busy} onclick={onRunFix}>Fehler beheben</Button>
	{#if pendingAi}
		<div
			class="border-border bg-muted/30 space-y-2 rounded-md border p-2"
			role="region"
			aria-label="KI-Vorschlag"
		>
			<p class="text-muted-foreground text-[11px] font-medium uppercase">
				{pendingAi.kind === 'improve' ? 'Verbesserung' : 'Korrektur'} — Vorschau (nicht gespeichert)
			</p>
			<pre
				class="bg-muted max-h-48 overflow-auto rounded p-2 text-[11px] whitespace-pre-wrap">{pendingAi.text}</pre>
			{#if pendingAi.kind === 'improve' && pendingAi.scriptAnalyzer}
				<div
					class="border-border/80 bg-background/80 space-y-1 rounded border px-2 py-2 text-[11px]"
					role="region"
					aria-label="PSScriptAnalyzer"
				>
					<p class="text-muted-foreground font-medium uppercase tracking-wide">
						PSScriptAnalyzer (KI-Snippet <code class="text-[10px]">code</code>)
					</p>
					{#if pendingAi.scriptAnalyzer.status === 'ran'}
						{#if pendingAi.scriptAnalyzer.findings.length === 0}
							<p class="text-muted-foreground">Keine Warnungen oder Fehler.</p>
						{:else}
							<ul class="max-h-36 space-y-1 overflow-auto">
								{#each pendingAi.scriptAnalyzer.findings as f, i (f.ruleName + ':' + f.line + ':' + f.column + ':' + i)}
									<li class="border-border/60 border-b pb-1 last:border-0">
										<span class="font-mono text-[10px]">{f.severity}</span>
										<span class="text-muted-foreground font-mono text-[10px]">L{f.line}:C{f.column}</span>
										<span class="font-medium">{f.ruleName}</span>
										— {f.message}
									</li>
								{/each}
							</ul>
						{/if}
					{:else if pendingAi.scriptAnalyzer.status === 'skipped'}
						<p class="text-muted-foreground">Übersprungen: {pendingAi.scriptAnalyzer.reason}</p>
					{:else}
						<p class="text-muted-foreground">Nicht verfügbar: {pendingAi.scriptAnalyzer.reason}</p>
					{/if}
				</div>
			{/if}
			<div class="flex flex-wrap gap-2">
				<Button size="sm" disabled={busy} onclick={onApplyPending}>Übernehmen</Button>
				<Button size="sm" variant="outline" disabled={busy} onclick={onDiscardPending}>Verwerfen</Button>
			</div>
		</div>
	{/if}
</div>
<div class="rounded-md border p-3 space-y-2">
	<h3 class="text-sm font-medium">Enrichment</h3>
	<p
		class="text-muted-foreground border-border/60 bg-muted/25 rounded-md border px-3 py-2 text-xs leading-snug"
		role="note"
	>
		Was an den KI-Anbieter geht und was nicht — inkl. Enrichment und Formular-Daten:
		<a class="text-foreground font-medium underline underline-offset-2" href="/settings">Einstellungen → KI</a
		>. Bitte keine unnötigen personenbezogenen Daten;
		<a class="text-foreground font-medium underline underline-offset-2" href="/datenschutz">Datenschutz</a>.
	</p>
	<Textarea rows={3} bind:value={enrichReq} placeholder="Kontext-Anreicherung…" disabled={busy} />
	<Button size="sm" variant="outline" disabled={busy} onclick={onRunEnrich}>Anreichern</Button>
	{#if enrichOut}
		<pre class="bg-muted max-h-40 overflow-auto rounded p-2 text-xs">{enrichOut}</pre>
	{/if}
</div>
<details class="rounded-md border" bind:open={advancedKiOpen}>
	<summary
		class="text-foreground hover:bg-muted/40 cursor-pointer list-none px-3 py-2 text-sm font-medium [&::-webkit-details-marker]:hidden"
	>
		Erweitert: Streaming &amp; lokales HTML
	</summary>
	<div class="border-border/60 space-y-4 border-t p-3 pt-3">
		<div class="space-y-2">
			<h3 class="text-sm font-medium">Freitext an die KI (Streaming)</h3>
			{#if genericAiStreaming}
				<div
					class="text-muted-foreground flex flex-wrap items-center gap-2 text-xs"
					role="status"
					aria-live="polite"
				>
					<Loader class="text-muted-foreground size-3.5 shrink-0 animate-spin" aria-hidden="true" />
					<span>Stream läuft …</span>
					{#if onCancelStream}
						<Button type="button" variant="ghost" size="sm" class="h-7 px-2 text-xs" onclick={onCancelStream}
							>Abbrechen</Button
						>
					{/if}
				</div>
			{/if}
			<Textarea
				rows={3}
				bind:value={genericAiPrompt}
				placeholder="Beliebige Frage oder Anweisung an die KI (Antwort erscheint unten im Stream) …"
				disabled={busy || genericAiStreaming}
			/>
			<Button size="sm" variant="secondary" disabled={busy || genericAiStreaming} onclick={onRunStream}
				>Stream starten</Button
			>
			{#if genericAiStreamOut}
				<pre
					class="bg-muted max-h-48 overflow-auto rounded p-2 text-xs whitespace-pre-wrap">{genericAiStreamOut}</pre>
			{/if}
		</div>
		<div class="space-y-2">
			<h3 class="text-sm font-medium">KI-Antwort (HTML, lokal)</h3>
			<p class="text-muted-foreground text-xs">
				Nur in diesem Browser gespeichert (<code class="text-[11px]">localStorage</code>) — nicht Teil des
				Server-Speicherns.
			</p>
			<Textarea
				rows={5}
				bind:value={aiHtmlPanel}
				class="font-mono text-xs"
				placeholder="Optional HTML aus der KI einfügen…"
				disabled={busy}
			/>
			<Button size="sm" variant="outline" disabled={busy || !sid} onclick={onSaveAiHtml}
				>In diesem Browser speichern</Button
			>
			{#if aiHtmlPanel.trim()}
				<iframe
					title="KI-HTML-Vorschau"
					class="bg-muted max-h-56 min-h-[140px] w-full rounded border text-xs"
					sandbox=""
					srcdoc={aiHtmlPanel}
				></iframe>
			{/if}
		</div>
	</div>
</details>
