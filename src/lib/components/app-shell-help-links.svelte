<script lang="ts">
	import { ChevronDown, ExternalLink } from '@lucide/svelte';

	import type { HelpLink } from '$lib/types/help-link';

	let {
		helpLinks,
		linkClass,
		onNavigate
	}: {
		helpLinks: HelpLink[];
		linkClass: string;
		onNavigate?: () => void;
	} = $props();
</script>

{#if helpLinks.length === 1}
	{@const link = helpLinks[0]}
	<div class="border-border shrink-0 border-t px-2 py-2">
		<p class="text-muted-foreground px-3 text-[10px] font-semibold tracking-wider uppercase">Hilfe</p>
		<ul class="mt-1 space-y-0.5">
			<li>
				<a
					href={link.href}
					target="_blank"
					rel="noopener noreferrer"
					class={linkClass}
					onclick={() => onNavigate?.()}
				>
					<ExternalLink class="size-4 shrink-0 opacity-90" aria-hidden="true" />
					<span class="truncate">{link.label}</span>
					<span class="sr-only">(öffnet in neuem Tab)</span>
				</a>
			</li>
		</ul>
	</div>
{:else if helpLinks.length > 1}
	<div class="border-border shrink-0 border-t px-2 py-2">
		<details class="group">
			<summary
				class="text-muted-foreground hover:bg-muted/80 flex cursor-pointer list-none items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden"
			>
				<ChevronDown
					class="text-muted-foreground size-4 shrink-0 opacity-80 transition-transform duration-200 group-open:rotate-180"
					aria-hidden="true"
				/>
				<span class="text-[10px] font-semibold tracking-wider uppercase">Hilfe</span>
				<span class="text-muted-foreground/90 font-normal normal-case tracking-normal"
					>({helpLinks.length} extern)</span
				>
			</summary>
			<ul class="border-border/50 mt-1 ml-1 space-y-0.5 border-l pl-2">
				{#each helpLinks as link (link.href + link.label)}
					<li>
						<a
							href={link.href}
							target="_blank"
							rel="noopener noreferrer"
							class={linkClass}
							onclick={() => onNavigate?.()}
						>
							<ExternalLink class="size-4 shrink-0 opacity-90" aria-hidden="true" />
							<span class="truncate">{link.label}</span>
							<span class="sr-only">(öffnet in neuem Tab)</span>
						</a>
					</li>
				{/each}
			</ul>
		</details>
	</div>
{/if}
