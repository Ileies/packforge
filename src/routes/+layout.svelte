<script lang="ts">
	import '../app.css';

	import { dev } from '$app/environment';
	import { page } from '$app/state';
	import { PRODUCT_NAME, PRODUCT_PUBLIC_ORIGIN } from '$lib/app/brand';
	import favicon from '$lib/assets/favicon.svg';
	import AppSuccessToaster from '$lib/components/app-success-toaster.svelte';

	let { children } = $props();

	const canonicalBase = $derived(dev ? page.url.origin : PRODUCT_PUBLIC_ORIGIN);
	const canonicalUrl = $derived(`${canonicalBase}${page.url.pathname}`);

	const defaultTitle = `${PRODUCT_NAME} — PSADT-Pakete & Software-Bibliothek`;
	const defaultDescription =
		'Interne Oberfläche zum Erstellen und Verwalten von PSADT-Paketen: Stammdaten, Vorlagen, Skripte und Export aus einer Software-Bibliothek.';

	const jsonLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'WebSite',
			name: PRODUCT_NAME,
			url: canonicalBase,
			description: defaultDescription,
			inLanguage: 'de'
		})
	);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{defaultTitle}</title>
	<meta name="description" content={defaultDescription} />
	<link rel="canonical" href={canonicalUrl} />

	<!-- Open Graph -->
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={PRODUCT_NAME} />
	<meta property="og:title" content={defaultTitle} />
	<meta property="og:description" content={defaultDescription} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:locale" content="de_DE" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={defaultTitle} />
	<meta name="twitter:description" content={defaultDescription} />

	<!-- JSON-LD -->
	{@html `<script type="application/ld+json">${jsonLd}</script>`}
</svelte:head>

{@render children()}
<AppSuccessToaster />
