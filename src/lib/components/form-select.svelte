<script lang="ts">
	import { cn } from '$lib/utils';

	export type FormSelectOption = { value: string; label: string };

	let {
		id,
		label,
		value = $bindable(''),
		options,
		disabled = false,
		class: className = ''
	}: {
		id: string;
		label?: string;
		value: string;
		options: readonly FormSelectOption[];
		disabled?: boolean;
		class?: string;
	} = $props();

	const selectClass = $derived(
		cn(
			'border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
			className
		)
	);
</script>

<div class="min-w-0 flex-1 space-y-1.5">
	{#if label}
		<label for={id} class="text-xs">{label}</label>
	{/if}
	<select {id} bind:value {disabled} class={selectClass}>
		{#each options as o (o.value)}
			<option value={o.value}>{o.label}</option>
		{/each}
	</select>
</div>
