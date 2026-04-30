<script lang="ts">
	import '../app.css';

	import { dev } from '$app/environment';
	import { page } from '$app/state';
	import { PRODUCT_NAME, PRODUCT_PUBLIC_ORIGIN } from '$lib/app/brand';
	import favicon from '$lib/assets/favicon.svg';
	import AppSuccessToaster from '$lib/components/app-success-toaster.svelte';

	let { children } = $props();

	const canonicalBase = $derived(dev ? page.url.origin : PRODUCT_PUBLIC_ORIGIN);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{PRODUCT_NAME} — PSADT-Pakete &amp; Software-Bibliothek</title>
	<meta
		name="description"
		content="Interne Oberfläche zum Erstellen und Verwalten von PSADT-Paketen: Stammdaten, Vorlagen, Skripte und Export aus einer Software-Bibliothek."
	/>
	<link rel="canonical" href={`${canonicalBase}${page.url.pathname}`} />
	<meta property="og:url" content={`${canonicalBase}${page.url.pathname}`} />
</svelte:head>

{@render children()}
<AppSuccessToaster />
