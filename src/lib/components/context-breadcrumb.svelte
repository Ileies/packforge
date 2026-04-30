<script lang="ts">
	import { cn } from '$lib/utils';

	export type ContextCrumb = { href?: string; label: string };

	let {
		items,
		class: className = ''
	}: {
		items: ContextCrumb[];
		class?: string;
	} = $props();
</script>

<nav class={cn('text-muted-foreground text-xs leading-snug', className)} aria-label="Seitenpfad">
	<ol class="flex flex-wrap items-center gap-x-0.5 gap-y-0.5">
		{#each items as c, i (i)}
			{@const last = i === items.length - 1}
			<li class="flex min-w-0 max-w-full items-center gap-x-0.5">
				{#if i > 0}
					<span class="text-muted-foreground/70 shrink-0 px-0.5" aria-hidden="true">›</span>
				{/if}
				{#if c.href && !last}
					<a
						href={c.href}
						class="text-muted-foreground hover:text-foreground max-w-[min(100%,18rem)] truncate underline-offset-2 hover:underline"
						>{c.label}</a
					>
				{:else}
					<span
						class={cn('max-w-[min(100%,20rem)] truncate', last && 'text-foreground font-medium text-[13px]')}
						>{c.label}</span
					>
				{/if}
			</li>
		{/each}
	</ol>
</nav>
