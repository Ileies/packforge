<script lang="ts">
	import { formatDateTime } from '$lib/client/locale-format';
	import type { CheckpointRow } from '$lib/client/script-editor-types';
	import EmptyState from '$lib/components/empty-state.svelte';
	import { Button } from '$lib/components/ui/button/index';

	type Props = {
		checkpoints: CheckpointRow[];
		onLoadCp: (n: number) => void;
		onRestoreCp: (n: number) => void;
	};

	let { checkpoints, onLoadCp, onRestoreCp }: Props = $props();
</script>

<div class="rounded-md border p-3">
	<h3 class="mb-2 text-sm font-medium">Checkpoints</h3>
	<p class="text-muted-foreground mb-2 text-[11px] leading-snug">
		<strong class="text-foreground">Laden:</strong> Skript des Checkpoints in den Editor übernehmen (nicht
		automatisch speichern).
		<strong class="text-foreground">Wiederherstellen:</strong> Das in der Datenbank gespeicherte Skript durch diesen
		Checkpoint ersetzen.
	</p>
	{#if checkpoints.length === 0}
		<EmptyState
			class="border-0 bg-transparent px-3 py-5 shadow-none"
			ariaLabel="Keine Checkpoints"
			title="Noch keine Checkpoints"
			description="Nach „Speichern“ oder gezielt über „Checkpoint anlegen“ entstehen hier Versionen zum Laden oder Wiederherstellen."
			visual="history"
			compact
		/>
	{:else}
		<ul class="max-h-48 space-y-1 overflow-auto text-xs">
			{#each checkpoints as c}
				<li class="flex flex-wrap items-center gap-1 border-b border-border/60 py-1">
					<span class="font-mono">#{c.checkpoint_number}</span>
					<span class="text-muted-foreground shrink-0 text-[10px]" title={c.created_at ?? ''}
						>{formatDateTime(c.created_at)}</span
					>
					<span class="text-muted-foreground">{c.name ?? ''}</span>
					<Button
						variant="ghost"
						size="xs"
						class="h-6 px-1"
						title="Checkpoint-Skript in den Editor laden (Speichern auslösen, um es festzuhalten)"
						onclick={() => onLoadCp(c.checkpoint_number)}>Laden</Button
					>
					<Button
						variant="ghost"
						size="xs"
						class="h-6 px-1"
						title="Gespeichertes Skript in der Datenbank durch diesen Checkpoint ersetzen"
						onclick={() => onRestoreCp(c.checkpoint_number)}>Wiederherstellen</Button
					>
				</li>
			{/each}
		</ul>
	{/if}
</div>
