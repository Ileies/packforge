<script lang="ts">
	import { Loader } from '@lucide/svelte';

	import type { LintFinding } from '$lib/client/script-editor-types';
	import { Button } from '$lib/components/ui/button/index';

	type Props = {
		busy: boolean;
		lintBusy: boolean;
		lintFindings: LintFinding[];
		lintProfile: string | null;
		lintPssaStatus: string | null;
		onLint: () => void;
		onAbortLint?: () => void;
	};

	let { busy, lintBusy, lintFindings, lintProfile, lintPssaStatus, onLint, onAbortLint }: Props = $props();
</script>

<div
	class="space-y-2 rounded-md border border-border/80 bg-muted/10 p-3"
	aria-busy={lintBusy}
	aria-live="polite"
>
	<div class="flex flex-wrap items-center gap-2">
		<span
			class="text-sm font-medium"
			title="Regelbasierte Prüfung auf dem Server; optional PowerShell Script Analyzer (PSSA)."
			>Skript prüfen</span
		>
		<Button type="button" variant="secondary" size="sm" disabled={busy || lintBusy} onclick={onLint}>
			{lintBusy ? 'Prüft …' : 'Jetzt prüfen'}
		</Button>
		{#if lintProfile}
			<span class="text-muted-foreground text-xs">Profil: {lintProfile}</span>
		{/if}
		{#if lintPssaStatus}
			<span class="text-muted-foreground text-xs" title="PowerShell Script Analyzer"
				>PSSA: {lintPssaStatus}</span
			>
		{/if}
	</div>
	{#if lintBusy}
		<div class="text-muted-foreground flex flex-wrap items-center gap-2 text-xs" role="status">
			<Loader class="text-muted-foreground size-3.5 shrink-0 animate-spin" aria-hidden="true" />
			<span>Lint läuft auf dem Server …</span>
			{#if onAbortLint}
				<Button type="button" variant="ghost" size="sm" class="h-7 px-2 text-xs" onclick={onAbortLint}
					>Abbrechen</Button
				>
			{/if}
		</div>
	{/if}
	{#if lintFindings.length > 0}
		<ul class="max-h-40 space-y-1.5 overflow-auto text-xs" role="list">
			{#each lintFindings as f, i (f.ruleId + ':' + f.line + ':' + i)}
				<li class="border-border/60 border-b pb-1.5 last:border-0">
					<span class="text-muted-foreground font-mono">Z. {f.line}</span>
					<span class="text-muted-foreground"> · {f.severity}</span>
					<span class="text-foreground block pt-0.5 leading-snug">{f.message}</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>
