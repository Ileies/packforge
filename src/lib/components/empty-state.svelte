<script lang="ts">
	import { Database, FileCode, History, Package, Search } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	import { cn } from '$lib/utils';

	type Visual = 'package' | 'search' | 'template' | 'database' | 'history';

	let {
		ariaLabel,
		title,
		description,
		visual = 'package',
		actions,
		class: className = '',
		compact = false
	}: {
		ariaLabel: string;
		title?: string;
		description: string;
		visual?: Visual;
		actions?: Snippet;
		class?: string;
		compact?: boolean;
	} = $props();

	const iconWrap = $derived(
		compact
			? 'flex size-14 shrink-0 items-center justify-center rounded-xl bg-muted/70 ring-1 ring-border/70'
			: 'flex size-[5.5rem] shrink-0 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-border/60 shadow-sm'
	);
	const iconClass = $derived(compact ? 'size-7 text-primary/80' : 'size-10 text-primary/75');
</script>

<div
	role="region"
	aria-label={ariaLabel}
	class={cn(
		'flex flex-col items-center justify-center gap-4 text-center',
		compact
			? 'rounded-lg border border-dashed border-border/80 bg-muted/15 px-4 py-6'
			: 'rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-12',
		className
	)}
>
	<div class="flex flex-col items-center gap-4 sm:flex-row sm:text-left">
		<div class={iconWrap} aria-hidden="true">
			{#if visual === 'search'}
				<Search class={iconClass} strokeWidth={1.75} />
			{:else if visual === 'template'}
				<FileCode class={iconClass} strokeWidth={1.75} />
			{:else if visual === 'database'}
				<Database class={iconClass} strokeWidth={1.75} />
			{:else if visual === 'history'}
				<History class={iconClass} strokeWidth={1.75} />
			{:else if compact}
				<Package class={iconClass} strokeWidth={1.75} />
			{:else}
				<!-- Leichte Paket-Illustration (isometrisch), passend zu PSADT/Packaging -->
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 88 76"
					class="h-[2.75rem] w-auto text-primary/80"
					fill="none"
				>
					<path
						d="M44 6 78 24v28L44 70 10 52V24L44 6Z"
						fill="currentColor"
						fill-opacity="0.1"
						stroke="currentColor"
						stroke-width="1.4"
						stroke-linejoin="round"
					/>
					<path d="M10 24 44 42l34-18" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
					<path d="M44 42v28" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
					<path
						d="M32 30h24v6H32z"
						fill="currentColor"
						fill-opacity="0.22"
						stroke="currentColor"
						stroke-width="1"
					/>
				</svg>
			{/if}
		</div>
		<div class="max-w-md space-y-2">
			{#if title}
				<h2 class="text-foreground text-base font-semibold tracking-tight">{title}</h2>
			{/if}
			<p class="text-muted-foreground text-sm leading-relaxed">{description}</p>
		</div>
	</div>
	{#if actions}
		<div
			class="flex w-full max-w-md flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center"
		>
			{@render actions()}
		</div>
	{/if}
</div>
