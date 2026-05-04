<script lang="ts">
	import { Package } from '@lucide/svelte';
	import { onMount } from 'svelte';

	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { env } from '$env/dynamic/public';
	import { PRODUCT_NAME } from '$lib/app/brand';
	import { apiRoutes } from '$lib/client/api-routes';
	import { type DevLoginRole, loginWithDevCredentials } from '$lib/client/login-dev';
	import { acquireMicrosoftIdToken, type AzureAuthPublicConfig } from '$lib/client/login-msal';
	import { type SessionUser, setSessionUser } from '$lib/client/session-user';
	import AppGithubRepoLink from '$lib/components/app-github-repo-link.svelte';
	import FormSelect from '$lib/components/form-select.svelte';
	import LiveRegionFocus from '$lib/components/live-region-focus.svelte';
	import { Button } from '$lib/components/ui/button/index';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index';
	import { Input } from '$lib/components/ui/input/index';
	import { Label } from '$lib/components/ui/label/index';

	let cfg = $state<
		(AzureAuthPublicConfig & { devLogin?: { enabled: boolean; passwordRequired?: boolean } }) | null
	>(null);
	let status = $state('');
	let busy = $state(false);
	let devRole = $state<DevLoginRole>('Admin');
	let devPassword = $state('');

	const roleOptions = [
		{ value: 'Admin', label: 'Admin' },
		{ value: 'Mitarbeiter', label: 'Mitarbeiter' },
		{ value: 'Besucher', label: 'Besucher' }
	] as const;

	const openPortfolioDemo = $derived(env.PUBLIC_OPEN_PORTFOLIO_MODE === 'true');

	onMount(async () => {
		try {
			const r = await fetch(apiRoutes.auth.config);
			cfg = await r.json();
		} catch {
			status = 'Konfiguration konnte nicht geladen werden.';
		}
	});

	async function loginMicrosoft() {
		if (!cfg) return;
		busy = true;
		status = '';
		const tok = await acquireMicrosoftIdToken(cfg);
		if ('error' in tok) {
			status = tok.error;
			busy = false;
			return;
		}
		try {
			const lr = await fetch(apiRoutes.auth.login, {
				method: 'POST',
				credentials: 'same-origin',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ accessToken: tok.token })
			});
			const data = await lr.json();
			if (!lr.ok) {
				status = (data as { error?: string }).error || 'Login fehlgeschlagen';
				return;
			}
			setSessionUser((data as { user: unknown }).user as SessionUser);
			await goto('/welcome');
		} catch (e) {
			status = e instanceof Error ? e.message : 'Fehler';
		} finally {
			busy = false;
		}
	}

	async function loginDev() {
		busy = true;
		status = '';
		try {
			const res = await loginWithDevCredentials(devRole, devPassword || undefined);
			if ('error' in res) {
				status = res.error;
				return;
			}
			setSessionUser(res.user as SessionUser);
			await goto('/welcome');
		} catch (e) {
			status = e instanceof Error ? e.message : 'Fehler';
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>Anmelden — {PRODUCT_NAME}</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="app-main-surface relative flex min-h-screen flex-col">
	<div class="pointer-events-none fixed top-3 right-3 z-[60] sm:top-4 sm:right-4">
		<div class="pointer-events-auto">
			<AppGithubRepoLink />
		</div>
	</div>
	<a
		href="#login-main"
		class="focus:bg-background focus:text-foreground sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:m-3 focus:rounded-md focus:border focus:px-4 focus:py-2"
		>Zum Hauptinhalt springen</a
	>
	<main
		id="login-main"
		tabindex="-1"
		class="outline-none mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-7 px-4 py-10 sm:px-6"
	>
		<header class="space-y-2 text-center">
			<div class="flex justify-center">
				<span
					class="bg-primary/15 text-primary inline-flex size-14 items-center justify-center rounded-xl shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.08]"
				>
					<Package class="size-8" aria-hidden="true" />
				</span>
			</div>
			<div class="space-y-1.5">
				<h1 class="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">{PRODUCT_NAME}</h1>
				<p class="text-muted-foreground mx-auto max-w-md text-sm leading-relaxed">
					{#if openPortfolioDemo}
						Öffentliche Demo zum Stöbern; erweiterter Zugriff nur für freigegebene Konten — nicht per
						Selbstregistrierung.
					{:else}
						Anmeldung für die interne Oberfläche: Vorlagen, Stammdaten, Skripte und Export aus einer
						gemeinsamen Bibliothek.
					{/if}
				</p>
			</div>
		</header>

		<div class="flex flex-col gap-5">
			{#if openPortfolioDemo}
				<Card class="border-border shadow-sm">
					<CardHeader class="space-y-1.5 pb-0">
						<CardTitle class="text-base font-medium">Öffentliche Demo</CardTitle>
						<CardDescription class="text-sm leading-snug">
							Ohne Login eingeschränkt nutzbar. Hier geht es zurück in die Demo-Ansicht.
						</CardDescription>
					</CardHeader>
					<CardContent class="pt-3">
						<Button variant="outline" size="sm" class="w-full sm:w-auto" href={resolve('/welcome')}
							>Zurück zur Demo</Button
						>
					</CardContent>
				</Card>
			{/if}
			{#if cfg?.devLogin?.enabled}
				<Card class="border-border shadow-sm">
					<CardHeader class="space-y-1.5 pb-0">
						<CardTitle class="text-base font-medium">
							{openPortfolioDemo ? 'Zugang mit Passwort' : 'Lokal (Entwickler)'}
						</CardTitle>
						<CardDescription class="text-sm leading-snug">
							{#if openPortfolioDemo}
								Rolle wählen und das vereinbarte Passwort eingeben.
							{:else}
								Für lokale oder abgeschirmte Umgebungen. Produktiv nutzen Sie Microsoft Entra ID unten.
							{/if}
						</CardDescription>
					</CardHeader>
					<CardContent class="flex flex-col gap-3 pt-3">
						<FormSelect id="role" label="Rolle" bind:value={devRole} options={roleOptions} />
						{#if cfg.devLogin.passwordRequired}
							<div class="grid gap-2">
								<Label for="devpw">Passwort</Label>
								<Input id="devpw" type="password" bind:value={devPassword} autocomplete="off" />
							</div>
						{/if}
						<Button disabled={busy} variant="secondary" class="w-full sm:w-auto" onclick={loginDev}>
							{busy ? 'Wird angemeldet …' : 'Lokal anmelden'}
						</Button>
					</CardContent>
				</Card>
			{/if}

			{#if !(openPortfolioDemo && cfg && !cfg.clientId)}
				<Card class="border-border shadow-sm">
					<CardHeader class="space-y-1.5 pb-0">
						<CardTitle class="text-base font-medium">Microsoft Entra ID</CardTitle>
						<CardDescription class="text-sm leading-snug">
							Anmeldung mit Organisationskonto (Popup). Redirect-URI und App-Registrierung müssen zur
							Umgebung passen.
						</CardDescription>
					</CardHeader>
					<CardContent class="flex flex-col gap-2 pt-3">
						<Button disabled={busy || !cfg?.clientId} class="w-full sm:w-auto" onclick={loginMicrosoft}>
							{busy ? 'Wird angemeldet …' : 'Mit Microsoft anmelden'}
						</Button>
						{#if cfg && !cfg.clientId}
							<p class="text-muted-foreground text-sm">
								<code class="bg-muted rounded px-1 py-0.5 font-mono text-xs">AZURE_CLIENT_ID</code> fehlt —
								Entra-Login ist deaktiviert.
							</p>
						{/if}
					</CardContent>
				</Card>
			{/if}

			{#if status}
				<LiveRegionFocus
					when={status}
					role="alert"
					ariaLive="assertive"
					class="text-destructive rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm outline-none"
				>
					{status}
				</LiveRegionFocus>
			{/if}
		</div>

		<div class="text-muted-foreground space-y-2 text-center text-[11px] leading-snug">
			<nav class="flex flex-wrap justify-center gap-x-3 gap-y-1">
				<a class="text-primary underline-offset-2 hover:underline" href="/impressum">Impressum</a>
				<a class="text-primary underline-offset-2 hover:underline" href="/datenschutz">Datenschutz</a>
				<a class="text-primary underline-offset-2 hover:underline" href="/nutzungsbedingungen"
					>Nutzungsbedingungen</a
				>
			</nav>
			<p class="mx-auto max-w-md">
				Installer und Skripte nur mit gültigen Rechten verwenden; keine Schadsoftware einbinden.
			</p>
		</div>
	</main>
</div>
