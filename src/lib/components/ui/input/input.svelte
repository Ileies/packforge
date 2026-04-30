<script lang="ts">
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils';

	type InputType = Exclude<HTMLInputTypeAttribute, 'file'>;

	type Props = WithElementRef<
		Omit<HTMLInputAttributes, 'type'> &
			({ type: 'file'; files?: FileList } | { type?: InputType; files?: undefined })
	>;

	let {
		ref = $bindable(null),
		value = $bindable(),
		type,
		files = $bindable(),
		id,
		disabled,
		multiple,
		webkitdirectory,
		class: className,
		'data-slot': dataSlot = 'input',
		...restProps
	}: Props = $props();

	const isDirPicker = $derived(Boolean(webkitdirectory));
	const isMultiPicker = $derived(Boolean(multiple) || isDirPicker);
	const fileTriggerLabel = $derived(
		isDirPicker ? 'Ordner wählen…' : isMultiPicker ? 'Dateien wählen…' : 'Datei wählen…'
	);

	function fileSelectionSummary(list: FileList | undefined): string {
		if (!list?.length) return '';
		if (list.length === 1) return list[0].name;
		return `${list.length} Dateien`;
	}

	function fileSelectionTitle(list: FileList | undefined): string | undefined {
		if (!list?.length) return undefined;
		return Array.from(list, (f) => f.name).join(', ');
	}
</script>

{#if type === 'file' && id}
	<!-- Ein umschließendes label: gesamte Zeile klickbar (nicht nur der Trigger-Text). -->
	<label
		class={cn(
			'border-input bg-background focus-within:border-ring focus-within:ring-ring/50 dark:focus-within:ring-ring/40 hover:bg-muted/25 has-[input:disabled]:hover:bg-background flex h-8 min-w-0 cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1 transition-colors focus-within:ring-[3px] has-[input:disabled]:pointer-events-none has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50',
			className
		)}
		data-slot={dataSlot}
	>
		<input
			bind:this={ref}
			class="sr-only"
			type="file"
			{id}
			bind:files
			bind:value
			{disabled}
			{multiple}
			{webkitdirectory}
			{...restProps}
		/>
		<span class="text-foreground shrink-0 text-xs leading-none font-medium select-none">
			{fileTriggerLabel}
		</span>
		{#if files && files.length > 0}
			<span
				class="text-muted-foreground min-w-0 flex-1 truncate text-xs"
				title={fileSelectionTitle(files)}
				aria-live="polite"
			>
				{fileSelectionSummary(files)}
			</span>
		{:else}
			<span class="min-w-0 flex-1" aria-hidden="true"></span>
		{/if}
	</label>
{:else if type === 'file'}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(
			'border-input bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 disabled:bg-muted/60 dark:disabled:bg-muted/40 h-8 rounded-lg border px-2.5 py-1 text-base transition-colors file:h-6 file:text-sm file:font-medium focus-visible:ring-3 aria-invalid:ring-3 md:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
			className
		)}
		type="file"
		bind:files
		bind:value
		{id}
		{disabled}
		{multiple}
		{webkitdirectory}
		{...restProps}
	/>
{:else}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(
			'border-input bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 disabled:bg-muted/60 dark:disabled:bg-muted/40 h-8 rounded-lg border px-2.5 py-1 text-base transition-colors file:h-6 file:text-sm file:font-medium focus-visible:ring-3 aria-invalid:ring-3 md:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
			className
		)}
		{type}
		bind:value
		{id}
		{disabled}
		{...restProps}
	/>
{/if}
