<script lang="ts">
	import { onMount } from 'svelte';

	import { type ApiErrorSurface, fromJsonErr } from '$lib/client/api-error-present';
	import { apiJson, authHeaders } from '$lib/client/api-fetch';
	import { apiRoutes } from '$lib/client/api-routes';
	import { hasPermission } from '$lib/client/session-user';
	import ApiErrorCallout from '$lib/components/api-error-callout.svelte';
	import FormSelect from '$lib/components/form-select.svelte';
	import { Button } from '$lib/components/ui/button/index';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index';

	const options = [
		{
			value: 'relaxed',
			label: 'Minimal — nur kritische Hinweise (Sicherheit / Klartext-Secrets)'
		},
		{ value: 'strict', label: 'Erweitert — zusätzlich Stil- und Qualitätshinweise' }
	];

	let profile = $state<'relaxed' | 'strict'>('relaxed');
	let busy = $state(false);
	let message = $state<string | null>(null);
	let error = $state<ApiErrorSurface | null>(null);

	const canManage = $derived(hasPermission('MANAGE_AI_KEYS'));

	async function refresh() {
		error = null;
		const r = await apiJson<{ profile?: string }>(apiRoutes.settings.powershellLintProfile, {
			headers: authHeaders()
		});
		if (!r.ok) {
			error = fromJsonErr(r);
			return;
		}
		const p = r.data.profile;
		profile = p === 'strict' || p === 'relaxed' ? p : 'relaxed';
	}

	async function save() {
		if (!canManage) return;
		busy = true;
		error = null;
		message = null;
		const r = await apiJson(apiRoutes.settings.powershellLintProfile, {
			method: 'POST',
			jsonBody: { profile }
		});
		busy = false;
		if (!r.ok) {
			error = fromJsonErr(r);
			return;
		}
		message = 'Lint-Profil gespeichert.';
		await refresh();
	}

	onMount(refresh);
</script>

<Card class="border-border/80 flex flex-col gap-0 overflow-hidden pt-0 shadow-sm">
	<CardHeader class="border-border/60 bg-muted/30 border-b px-4 py-3 sm:px-5">
		<CardTitle class="text-base">PowerShell-Lint (Skript-Editor)</CardTitle>
		<CardDescription class="text-sm">
			Profil gilt für alle Benutzer: Regeln beim manuellen „Jetzt prüfen“ im Script-Editor (Prüfung auf dem
			Server).
		</CardDescription>
		<p
			class="border-border/60 bg-muted/25 text-muted-foreground mt-2 rounded-md border px-3 py-2 text-xs leading-snug"
			role="note"
		>
			<strong class="text-foreground">Wo es wirkt:</strong> Nach
			<strong class="text-foreground">Speichern</strong>
			nutzen alle Benutzer mit Lint-Recht dieselbe
			<strong class="text-foreground">Regelstärke</strong> beim manuellen Prüflauf im Script-Editor (kein Einzel-Override
			pro Nutzer).
		</p>
	</CardHeader>
	<CardContent class="space-y-3 px-4 py-3 sm:px-5 sm:py-4">
		{#if error}
			<ApiErrorCallout {...error} />
		{/if}
		{#if message}
			<p class="text-muted-foreground text-sm">{message}</p>
		{/if}
		<FormSelect
			id="ps-lint-profile"
			label="Lint-Profil"
			bind:value={profile}
			{options}
			disabled={busy || !canManage}
		/>
		{#if canManage}
			<Button type="button" size="sm" disabled={busy} onclick={() => void save()}>Speichern</Button>
		{:else}
			<p class="text-muted-foreground text-xs">Nur Administratoren können das Profil ändern.</p>
		{/if}
	</CardContent>
</Card>
