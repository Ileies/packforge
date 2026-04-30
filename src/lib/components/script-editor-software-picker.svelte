<script lang="ts">
	import { EMPTY_STATE_NO_CREATE_SCRIPTS_DE } from '$lib/client/empty-state-copy';
	import type { SoftwareSummary } from '$lib/client/script-editor-types';
	import EmptyState from '$lib/components/empty-state.svelte';
	import { Button } from '$lib/components/ui/button/index';
	import { Label } from '$lib/components/ui/label/index';

	type Props = {
		softwareGrouped: [string, SoftwareSummary[]][];
		softwareListReady: boolean;
		softwareLength: number;
		canCreateScripts: boolean;
		sid?: string;
		onSoftwareChange: () => void | Promise<void>;
	};

	let {
		softwareGrouped,
		softwareListReady,
		softwareLength,
		canCreateScripts,
		sid = $bindable(''),
		onSoftwareChange
	}: Props = $props();
</script>

<div class="space-y-2">
	<Label for="sw">Software</Label>
	<select
		id="sw"
		class="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 max-w-xl rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
		bind:value={sid}
		onchange={() => void onSoftwareChange()}
	>
		<option value="">Software auswählen …</option>
		{#each softwareGrouped as [groupName, items] (groupName)}
			<optgroup label={groupName}>
				{#each items as s (s.id)}
					<option value={String(s.id)}>
						{s.version ? `v${s.version}` : '—'} · {s.file_name}
					</option>
				{/each}
			</optgroup>
		{/each}
	</select>
	{#if softwareListReady && softwareLength === 0}
		{#if canCreateScripts}
			<EmptyState
				class="max-w-xl"
				ariaLabel="Keine Software-Einträge"
				title="Noch keine Software"
				description="Lege zuerst im Script Maker ein Paket an, wähle es hier aus und bearbeite Skript sowie Metadaten."
				visual="package"
				compact
			>
				{#snippet actions()}
					<Button class="w-fit" href="/script-maker">Zum Script Maker</Button>
				{/snippet}
			</EmptyState>
		{:else}
			<EmptyState
				class="max-w-xl"
				ariaLabel="Keine Software-Einträge"
				title="Noch keine Software"
				description={EMPTY_STATE_NO_CREATE_SCRIPTS_DE}
				visual="package"
				compact
			/>
		{/if}
	{/if}
</div>
