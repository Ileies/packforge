<script lang="ts">
	import type { Snippet } from 'svelte';

	import { PRODUCT_NAME } from '$lib/app/brand';

	let {
		title,
		appVersion,
		children
	}: {
		title: string;
		appVersion?: string;
		children: Snippet;
	} = $props();
</script>

<svelte:head>
	<title>{title} — {PRODUCT_NAME}</title>
</svelte:head>

<div class="app-main-surface flex min-h-screen flex-col">
	<a
		href="#legal-main"
		class="focus:bg-background focus:text-foreground sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:m-3 focus:rounded-md focus:border focus:px-4 focus:py-2"
		>Zum Inhalt springen</a
	>
	<div class="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
		<main id="legal-main" tabindex="-1" class="outline-none">
			<h1 class="text-foreground text-2xl font-semibold tracking-tight">{title}</h1>
			<div class="mt-4 space-y-4 text-sm leading-relaxed">
				{@render children()}
			</div>
			{#if appVersion}
				<p class="text-muted-foreground mt-10 border-t border-border pt-4 text-xs">
					App-Version (Build): <span class="font-mono">{appVersion}</span>
				</p>
			{/if}
		</main>
	</div>
</div>
