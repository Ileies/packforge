<script lang="ts">
	import type { NavGroup } from '$lib/components/app-shell-types';

	let {
		navGroups,
		canSee,
		linkActive,
		navLinkClass,
		ariaLabel,
		baseLinkClass,
		onNavigate
	}: {
		navGroups: NavGroup[];
		canSee: (section: string) => boolean;
		linkActive: (href: string) => boolean;
		navLinkClass: (href: string) => string;
		ariaLabel: string;
		baseLinkClass: string;
		onNavigate?: () => void;
	} = $props();
</script>

<nav class="flex flex-1 flex-col gap-3 overflow-auto p-2" aria-label={ariaLabel}>
	{#each navGroups as group (group.label)}
		{@const visible = group.items.filter((item) => canSee(item.section))}
		{#if visible.length}
			<div class="space-y-1">
				<p class="text-muted-foreground px-3 text-[10px] font-semibold tracking-wider uppercase">
					{group.label}
				</p>
				{#each visible as item (item.href)}
					<a
						href={item.href}
						class="{baseLinkClass} {navLinkClass(item.href)}"
						aria-current={linkActive(item.href) ? 'page' : undefined}
						onclick={() => onNavigate?.()}
					>
						<item.Icon class="size-4 shrink-0 opacity-90" aria-hidden="true" />
						<span class="truncate">{item.label}</span>
					</a>
				{/each}
			</div>
		{/if}
	{/each}
</nav>
