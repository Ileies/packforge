<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils';

	type HeadingTag = 'div' | 'h1' | 'h2' | 'h3';

	let {
		ref = $bindable(null),
		class: className,
		tag = 'div',
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & { tag?: HeadingTag } = $props();

	const titleClass = $derived(
		cn('text-base leading-snug font-medium group-data-[size=sm]/card:text-sm', className)
	);
</script>

{#if tag === 'h1'}
	<h1 bind:this={ref} data-slot="card-title" class={titleClass} {...restProps}>{@render children?.()}</h1>
{:else if tag === 'h2'}
	<h2 bind:this={ref} data-slot="card-title" class={titleClass} {...restProps}>{@render children?.()}</h2>
{:else if tag === 'h3'}
	<h3 bind:this={ref} data-slot="card-title" class={titleClass} {...restProps}>{@render children?.()}</h3>
{:else}
	<div bind:this={ref} data-slot="card-title" class={titleClass} {...restProps}>{@render children?.()}</div>
{/if}
