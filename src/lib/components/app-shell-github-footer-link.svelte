<script lang="ts">
	import ExternalLink from 'lucide-svelte/icons/external-link';

	import { PRODUCT_GITHUB_REPO_URL } from '$lib/app/brand';
	import { cn } from '$lib/utils';

	let { class: className = '' }: { class?: string } = $props();
</script>

<a
	href={PRODUCT_GITHUB_REPO_URL}
	target="_blank"
	rel="noopener noreferrer"
	class={cn(
		'text-muted-foreground hover:text-foreground hover:bg-muted/60 flex min-h-9 w-full min-w-0 items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium transition-colors',
		className
	)}
	title="PackForge auf GitHub"
>
	<svg
		class="text-foreground/75 size-4 shrink-0"
		viewBox="0 0 24 24"
		fill="currentColor"
		aria-hidden="true"
	>
		<path
			fill-rule="evenodd"
			clip-rule="evenodd"
			d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z"
		/>
	</svg>
	<span class="min-w-0 flex-1 truncate text-left">Quellcode</span>
	<ExternalLink class="text-foreground/50 size-3.5 shrink-0" aria-hidden="true" />
	<span class="sr-only">öffnet in neuem Tab</span>
</a>
