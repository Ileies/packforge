<script lang="ts">
	import { Package } from '@lucide/svelte';
	import { onMount } from 'svelte';

	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { PRODUCT_NAME, THEME_STORAGE_KEY } from '$lib/app/brand';
	import { apiRoutes } from '$lib/client/api-routes';
	import { userMayAccessPathnameWithPerms } from '$lib/client/section-access';
	import { clearSessionUser, type SessionUser, sessionUser, setSessionUser } from '$lib/client/session-user';
	import AppShell from '$lib/components/app-shell.svelte';

	let { data, children } = $props();

	/** Bis Session (`apiRoutes.auth.me`) geklärt ist: keine leere Shell ohne Nav-Kontext. */
	let sessionGate = $state<'loading' | 'ready'>('loading');

	const routeAllowed = $derived(userMayAccessPathnameWithPerms(page.url.pathname, $sessionUser?.permissions));

	$effect(() => {
		if (!browser || sessionGate !== 'ready' || routeAllowed) return;
		void goto('/welcome', { replaceState: true });
	});

	onMount(async () => {
		if (browser) {
			document.documentElement.classList.toggle('dark', localStorage.getItem(THEME_STORAGE_KEY) === 'dark');
		}
		let r: Response;
		if (data.openPortfolioDemo) {
			// Reihenfolge: zuerst CSRF, dann `auth/me` (stellt ggf. Gast-Session-Cookie aus — kein paralleles Überschreiben des CSRF-Cookies).
			await fetch(apiRoutes.csrfToken, { credentials: 'same-origin' });
			r = await fetch(apiRoutes.auth.me, { credentials: 'same-origin' });
		} else {
			const [, meRes] = await Promise.all([
				fetch(apiRoutes.csrfToken, { credentials: 'same-origin' }),
				fetch(apiRoutes.auth.me, { credentials: 'same-origin' })
			]);
			r = meRes;
		}
		if (r.ok) {
			const d = (await r.json()) as { user?: unknown };
			if (d.user) {
				setSessionUser(d.user as SessionUser);
				sessionGate = 'ready';
				return;
			}
		}
		clearSessionUser();
		await goto('/login');
	});
</script>

<svelte:head>
	<meta name="robots" content="noindex, nofollow" />
	{#if sessionGate === 'loading'}
		<title>Laden — {PRODUCT_NAME}</title>
	{/if}
</svelte:head>

{#if sessionGate === 'loading'}
	<div
		class="app-main-surface text-foreground flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-4"
		aria-busy="true"
		aria-live="polite"
		aria-label="Sitzung wird geladen"
	>
		<div
			class="bg-primary/15 text-primary inline-flex size-14 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.08]"
		>
			<Package class="size-8 shrink-0 animate-pulse" aria-hidden="true" />
		</div>
		<div class="max-w-sm space-y-2 text-center">
			<p class="text-muted-foreground text-sm">Sitzung wird geprüft …</p>
			<div class="bg-muted mx-auto h-2 w-48 overflow-hidden rounded-full">
				<div class="bg-primary/70 h-full w-1/3 animate-pulse rounded-full"></div>
			</div>
		</div>
	</div>
{:else}
	<AppShell helpLinks={data.helpLinks} openPortfolioDemo={data.openPortfolioDemo}>
		{#if routeAllowed}
			{@render children()}
		{:else}
			<div
				class="app-main-surface text-muted-foreground flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-4 py-16 text-center text-sm"
				aria-busy="true"
				aria-live="polite"
			>
				<p>Kein Zugriff auf diesen Bereich.</p>
				<p class="text-muted-foreground/80 text-xs">Weiterleitung zum Start …</p>
			</div>
		{/if}
	</AppShell>
{/if}
