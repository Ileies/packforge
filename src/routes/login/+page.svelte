<script lang="ts">
	import Package from 'lucide-svelte/icons/package';
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
		class="outline-none mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-8 px-4 py-12 sm:px-6"
	>
		<header class="space-y-3 text-center">
			<div class="flex justify-center">
				<span
					class="bg-primary/15 text-primary inline-flex size-14 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.08]"
				>
					<Package class="size-8" aria-hidden="true" />
				</span>
			</div>
			<div class="space-y-2">
				<h1 class="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">{PRODUCT_NAME}</h1>
				<p class="text-muted-foreground mx-auto max-w-md text-sm leading-relaxed">
					{#if openPortfolioDemo}
						Vollzugrang nur auf <strong class="text-foreground font-medium">persönliche Einladung</strong> —
						keine öffentliche Registrierung oder Selbstservice für die erweiterten Funktionen. Details und
						Zugang unten auf dieser Seite.
					{:else}
						Anmeldung für die interne Oberfläche: PSADT-Pakete, Stammdaten, Vorlagen und Export aus einem
						gemeinsamen Hub.
					{/if}
				</p>
			</div>
		</header>

		<div class="flex flex-col gap-6">
			{#if openPortfolioDemo}
				<Card
					class="border-primary/25 bg-primary/5 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.06]"
				>
					<CardHeader class="pb-2">
						<CardTitle class="text-base">Öffentliche Demo</CardTitle>
						<CardDescription class="leading-relaxed">
							Die App ist ohne Login nutzbar (eingeschränkt). Vollzugrang nur mit Einladung: unten mit
							vergebenem Passwort und Rolle anmelden (oder, falls eingerichtet, mit Microsoft Entra ID).
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button variant="outline" size="sm" href={resolve('/welcome')}>Zurück zur Demo</Button>
					</CardContent>
				</Card>
			{/if}
			{#if cfg?.devLogin?.enabled}
				<Card class="border-primary/20 shadow-md ring-1 ring-black/[0.03] dark:ring-white/[0.06]">
					<CardHeader class="pb-2">
						<CardTitle class="text-lg">
							{openPortfolioDemo ? 'Anmeldung (Einladung)' : 'Lokal ohne Microsoft'}
						</CardTitle>
						<CardDescription class="leading-relaxed">
							{#if openPortfolioDemo}
								Nur für freigeschaltete Nutzer: Rolle wählen und das vereinbarte Passwort eingeben. Kein
								Selbstservice — Zugang erfolgt auf Einladung.
							{:else}
								Anmeldung ohne Entra ID — nur für lokale oder abgeschirmte Umgebungen; regulärer Zugang über
								die Karte „Microsoft Entra ID“ darunter.
							{/if}
						</CardDescription>
						<details class="text-muted-foreground mt-3 text-sm leading-relaxed">
							<summary
								class="text-foreground cursor-pointer text-sm font-medium underline-offset-4 hover:underline"
							>
								Einrichtung und Abgrenzung
							</summary>
							<div class="mt-2 space-y-2">
								<p>
									Interner Hilfsweg (nicht die produktive Kundenanmeldung). Technisch dieselbe App-Session wie
									nach Entra-Login.
								</p>
								<p>
									Server-Umgebung: zum Aktivieren
									<code class="bg-muted mx-0.5 rounded px-1 py-0.5 font-mono text-xs">ALLOW_DEV_LOGIN</code>
									auf
									<code class="bg-muted rounded px-1 py-0.5 font-mono text-xs">true</code>,
									<code class="bg-muted rounded px-1 py-0.5 font-mono text-xs">1</code> oder
									<code class="bg-muted rounded px-1 py-0.5 font-mono text-xs">yes</code>
									setzen; mit
									<code class="bg-muted mx-0.5 rounded px-1 py-0.5 font-mono text-xs">false</code>
									oder ohne explizite Variable bleibt der Weg aus.{#if cfg.devLogin.passwordRequired}
										Das Passwortfeld unten entspricht
										<code class="bg-muted rounded px-1 py-0.5 font-mono text-xs">DEV_LOGIN_PASSWORD</code>.
									{:else}
										Über
										<code class="bg-muted mx-0.5 rounded px-1 py-0.5 font-mono text-xs"
											>DEV_LOGIN_PASSWORD</code
										>
										erzwingen Sie eine zusätzliche Abfrage vor dem Login.
									{/if}
								</p>
							</div>
						</details>
					</CardHeader>
					<CardContent class="flex flex-col gap-4">
						<FormSelect id="role" label="Rolle" bind:value={devRole} options={roleOptions} />
						{#if cfg.devLogin.passwordRequired}
							<div class="grid gap-2">
								<Label for="devpw">Entwickler-Passwort</Label>
								<Input id="devpw" type="password" bind:value={devPassword} autocomplete="off" />
							</div>
						{/if}
						<Button disabled={busy} variant="secondary" class="w-full sm:w-auto" onclick={loginDev}>
							{busy ? 'Anmeldung läuft …' : 'Als Entwickler anmelden'}
						</Button>
					</CardContent>
				</Card>
			{/if}

			{#if !(openPortfolioDemo && cfg && !cfg.clientId)}
				<Card class="shadow-md ring-1 ring-black/[0.03] dark:ring-white/[0.06]">
					<CardHeader class="pb-2">
						<CardTitle class="text-lg">Microsoft Entra ID</CardTitle>
						<CardDescription class="leading-relaxed">
							Organisationskonto per MSAL-Popup. App-Registrierung in Entra ID, Redirect-URI und
							Netzwerkzugriff müssen zur Umgebung passen.
						</CardDescription>
					</CardHeader>
					<CardContent class="flex flex-col gap-4">
						<Button disabled={busy || !cfg?.clientId} class="w-full sm:w-auto" onclick={loginMicrosoft}>
							{busy ? 'Anmeldung läuft …' : 'Mit Microsoft anmelden'}
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

		<p class="text-muted-foreground mx-auto max-w-md text-center text-[11px] leading-snug">
			<a class="text-primary underline-offset-2 hover:underline" href="/impressum">Impressum</a>
			<span aria-hidden="true"> · </span>
			<a class="text-primary underline-offset-2 hover:underline" href="/datenschutz">Datenschutz</a>
			<span aria-hidden="true"> · </span>
			<a class="text-primary underline-offset-2 hover:underline" href="/nutzungsbedingungen"
				>Nutzungsbedingungen</a
			>
		</p>

		<p class="text-muted-foreground mx-auto max-w-md text-center text-[11px] leading-snug">
			Hochgeladene Installer und erzeugte Skripte nur im Rahmen gültiger Lizenzen nutzen; keine Schadsoftware
			einbinden.
		</p>
	</main>
</div>
