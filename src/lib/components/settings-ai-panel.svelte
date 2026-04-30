<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';

	import { AI_PROVIDERS, isAiProvider } from '$lib/app/ai-providers';
	import { type ApiErrorSurface, fromJsonErr, msgErr } from '$lib/client/api-error-present';
	import { apiJson, authHeaders } from '$lib/client/api-fetch';
	import { apiRoutes } from '$lib/client/api-routes';
	import { sessionUser } from '$lib/client/session-user';
	import ApiErrorCallout from '$lib/components/api-error-callout.svelte';
	import FormSelect from '$lib/components/form-select.svelte';
	import { Button } from '$lib/components/ui/button/index';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index';
	import { Input } from '$lib/components/ui/input/index';
	import { Label } from '$lib/components/ui/label/index';
	import { Separator } from '$lib/components/ui/separator/index';

	const providerOptions = AI_PROVIDERS.map((p) => ({
		value: p,
		label: p === 'openai' ? 'OpenAI' : 'Anthropic'
	}));

	let { aiDailyMax }: { aiDailyMax?: number | null } = $props();

	let activeModel = $state<string>('openai');
	let openaiMasked = $state<string | null>(null);
	let anthropicMasked = $state<string | null>(null);
	let newKey = $state('');
	let busy = $state(false);
	let message = $state<string | null>(null);
	let error = $state<ApiErrorSurface | null>(null);

	async function refresh() {
		error = null;
		const [m, k] = await Promise.all([
			apiJson<{ activeModel?: string }>(apiRoutes.ai.activeModel, { headers: authHeaders() }),
			apiJson<{ openaiMasked?: string | null; anthropicMasked?: string | null }>(apiRoutes.ai.apiKey, {
				headers: authHeaders()
			})
		]);
		if (m.ok && m.data.activeModel && isAiProvider(m.data.activeModel)) {
			activeModel = m.data.activeModel;
		}
		if (k.ok) {
			openaiMasked = k.data.openaiMasked ?? null;
			anthropicMasked = k.data.anthropicMasked ?? null;
		}
	}

	async function saveModel() {
		busy = true;
		error = null;
		message = null;
		if (!isAiProvider(activeModel)) {
			error = msgErr('Ungültiger Anbieter.');
			busy = false;
			return;
		}
		const r = await apiJson(apiRoutes.ai.setModel, {
			method: 'POST',
			jsonBody: { model: activeModel }
		});
		busy = false;
		if (!r.ok) {
			error = fromJsonErr(r);
			return;
		}
		message = 'KI-Anbieter gespeichert.';
		await refresh();
	}

	function validateApiKeyFormat(provider: string, key: string): string | null {
		const t = key.trim();
		if (t.length < 20) return 'Der API-Schlüssel ist zu kurz. Bitte Eingabe überprüfen.';
		if (provider === 'openai' && !t.startsWith('sk-')) {
			return 'Format passt nicht zu OpenAI (erwartet Präfix sk- oder sk-proj-).';
		}
		if (provider === 'anthropic' && !t.startsWith('sk-ant-')) {
			return 'Format passt nicht zu Anthropic (erwartet Präfix sk-ant-).';
		}
		return null;
	}

	async function saveApiKey() {
		if (!newKey.trim()) {
			error = msgErr('Bitte einen API-Schlüssel eingeben.');
			return;
		}
		if (!isAiProvider(activeModel)) {
			error = msgErr('Ungültiger Anbieter.');
			return;
		}
		const fmtErr = validateApiKeyFormat(activeModel, newKey);
		if (fmtErr) {
			error = msgErr(fmtErr);
			return;
		}
		busy = true;
		error = null;
		message = null;
		const r = await apiJson(apiRoutes.ai.setApiKey, {
			method: 'POST',
			jsonBody: { apiKey: newKey.trim(), provider: activeModel }
		});
		busy = false;
		newKey = '';
		if (!r.ok) {
			error = fromJsonErr(r);
			return;
		}
		message = 'API-Schlüssel gespeichert.';
		await refresh();
	}

	async function testConnection() {
		busy = true;
		error = null;
		message = null;
		const url = activeModel === 'openai' ? apiRoutes.ai.testOpenai : apiRoutes.ai.testAnthropic;
		const r = await apiJson<{ success?: boolean; message?: string }>(url, {
			method: 'POST',
			headers: authHeaders()
		});
		busy = false;
		if (!r.ok) {
			error = fromJsonErr(r);
			return;
		}
		if (r.data.success) message = r.data.message ?? 'OK';
		else error = msgErr(r.data.message ?? 'Verbindung fehlgeschlagen');
	}

	onMount(() => {
		if (get(sessionUser)?.permissions?.includes('MANAGE_AI_KEYS')) {
			void refresh();
		}
	});
</script>

<Card class="border-border/80 flex flex-col gap-0 overflow-hidden pt-0 shadow-sm lg:min-h-0 lg:h-full">
	<CardHeader class="bg-muted/30 border-border/60 shrink-0 rounded-t-xl border-b px-4 py-3 sm:px-5">
		<CardTitle class="text-base">KI &amp; API-Schlüssel</CardTitle>
		<CardDescription class="text-sm">
			{#if $sessionUser?.permissions?.includes('MANAGE_AI_KEYS')}
				Aktiven Anbieter wählen, maskierte Schlüssel prüfen, neuen API-Schlüssel hinterlegen und Verbindung
				testen.
			{:else}
				Hinweise und Tageslimit — Anbieter und API-Schlüssel können nur von Administratoren gepflegt werden.
			{/if}
		</CardDescription>
		<details
			class="border-border/60 bg-muted/25 text-muted-foreground mt-2 rounded-md border text-xs leading-snug"
		>
			<summary
				class="text-foreground cursor-pointer list-none px-3 py-2 font-medium underline-offset-2 hover:underline [&::-webkit-details-marker]:hidden"
			>
				Datenschutz &amp; Datenfluss (DSGVO, Übermittlung, Limit, Schlüssel)
			</summary>
			<div class="space-y-2 border-t border-border/50 px-3 pb-3 pt-2" role="region">
				<p class="leading-snug">
					<strong class="text-foreground">Datenabfluss (DSGVO / VVT):</strong> Mit konfiguriertem Anbieter
					sendet diese Instanz ausgewählte Inhalte verschlüsselt (TLS) an
					<strong class="text-foreground">OpenAI</strong> oder
					<strong class="text-foreground">Anthropic</strong>. Für betroffene Personen gilt die
					<a class="text-foreground font-medium underline underline-offset-2" href="/datenschutz"
						>Datenschutzerklärung</a
					>.
				</p>
				<p>
					<strong class="text-foreground">Script-Editor:</strong> u. a. der volle Skripttext bei „Verbessern“
					und „Fehler beheben“, dazu freie
					<strong class="text-foreground">Nutzertexte</strong> (Verbesserungswunsch, Fehlerbeschreibung, Enrichment-Freitext,
					generischer Stream-Prompt).
				</p>
				<p>
					<strong class="text-foreground">Enrichment:</strong> optional
					<strong class="text-foreground">Name und Version</strong> des Pakets sowie Anweisungen aus den
					Prompt-Dateien der Installation.
					<strong class="text-foreground">Formular-Stammdaten</strong> (<code class="font-mono text-[11px]"
						>formData</code
					>
					als JSON) werden <strong class="text-foreground">nicht</strong> an den KI-Anbieter gesendet — nur eine
					Längenprüfung auf dem Server im API-Body.
				</p>
				<p>
					<strong class="text-foreground">API-Schlüssel</strong> stammen aus Umgebungsvariablen (siehe
					Betriebsdoku) oder aus den hier gesetzten Werten; je nach Setup können nach einem
					<strong class="text-foreground">Neustart</strong> des Dienstes wieder Umgebungsvariablen Vorrang haben.
				</p>
				<p>
					Vollständige technische Aufstellung für Betrieb und Legal:
					<code class="font-mono text-[11px]">docs/compliance.md</code> (Abschnitt „KI-Datenfluss“).
				</p>
				{#if aiDailyMax != null && aiDailyMax > 0}
					<p class="leading-snug" role="note">
						<strong class="text-foreground">Tageslimit:</strong> Auf dieser Instanz sind höchstens
						<span class="font-mono">{aiDailyMax}</span>
						erfolgreiche KI-Anfragen pro Kalendertag (UTC) möglich — gesteuert über
						<code class="bg-muted rounded px-1 py-0.5 font-mono text-[11px]">AI_DAILY_MAX_REQUESTS</code>.
					</p>
				{/if}
				{#if $sessionUser?.permissions?.includes('MANAGE_AI_KEYS')}
					<p class="leading-snug" role="note">
						<strong class="text-foreground">Anbieter speichern:</strong> setzt nur den
						<strong class="text-foreground">aktiven KI-Anbieter</strong> für neue Anfragen. Hinterlegte
						API-Schlüssel bleiben <strong class="text-foreground">je Anbieter</strong> erhalten und werden dabei
						nicht gelöscht.
					</p>
					<p class="leading-snug" role="note">
						<strong class="text-foreground">Neuer API-Schlüssel:</strong> wird an den Server gesendet und dort
						für diesen Anbieter gespeichert (siehe Datenabfluss oben). In der Produktion können
						<strong class="text-foreground">Umgebungsvariablen</strong> nach einem
						<strong class="text-foreground">Dienst-Neustart</strong> wieder Vorrang haben.
					</p>
				{/if}
			</div>
		</details>
	</CardHeader>
	<CardContent class="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 py-3 sm:px-5 sm:py-4">
		{#if error}
			<div class="shrink-0">
				<ApiErrorCallout {...error} />
			</div>
		{/if}
		{#if message}
			<p class="text-muted-foreground shrink-0 text-sm">{message}</p>
		{/if}

		{#if $sessionUser?.permissions?.includes('MANAGE_AI_KEYS')}
			<section class="shrink-0 space-y-2" aria-labelledby="settings-provider">
				<h2 id="settings-provider" class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
					Anbieter
				</h2>
				<div class="flex flex-col gap-2 sm:flex-row sm:items-end">
					<FormSelect
						id="model"
						label="Aktiver KI-Anbieter"
						bind:value={activeModel}
						options={providerOptions}
						disabled={busy}
					/>
					<Button
						type="button"
						variant="secondary"
						size="sm"
						class="shrink-0"
						disabled={busy}
						onclick={saveModel}
					>
						Speichern
					</Button>
				</div>
			</section>

			<Separator class="shrink-0" />

			<section class="shrink-0 space-y-2" aria-labelledby="settings-keys-overview">
				<h2
					id="settings-keys-overview"
					class="text-muted-foreground text-xs font-medium tracking-wide uppercase"
				>
					Hinterlegte API-Schlüssel · aktiv: {activeModel === 'openai' ? 'OpenAI' : 'Anthropic'}
				</h2>
				<div class="grid grid-cols-2 gap-2">
					<div class="bg-card border-border/80 min-w-0 space-y-1 rounded-lg border p-2.5 shadow-xs">
						<p class="text-muted-foreground text-[10px] font-medium uppercase">OpenAI</p>
						<p class="text-foreground font-mono text-xs leading-snug break-all">{openaiMasked ?? '—'}</p>
					</div>
					<div class="bg-card border-border/80 min-w-0 space-y-1 rounded-lg border p-2.5 shadow-xs">
						<p class="text-muted-foreground text-[10px] font-medium uppercase">Anthropic</p>
						<p class="text-foreground font-mono text-xs leading-snug break-all">{anthropicMasked ?? '—'}</p>
					</div>
				</div>
			</section>

			<Separator class="shrink-0" />

			<section class="shrink-0 space-y-2" aria-labelledby="settings-new-key">
				<h2 id="settings-new-key" class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
					Neuer API-Schlüssel
				</h2>
				<div class="space-y-2">
					<Label for="key" class="text-xs"
						>API-Schlüssel ({activeModel === 'openai' ? 'OpenAI' : 'Anthropic'})</Label
					>
					<Input
						id="key"
						type="password"
						autocomplete="off"
						class="h-9 font-mono text-sm"
						bind:value={newKey}
						disabled={busy}
						placeholder={activeModel === 'openai' ? 'sk-… oder sk-proj-…' : 'sk-ant-api03-…'}
					/>
					<div class="flex flex-wrap gap-2">
						<Button type="button" size="sm" disabled={busy} onclick={saveApiKey}
							>API-Schlüssel speichern</Button
						>
						<Button type="button" variant="outline" size="sm" disabled={busy} onclick={testConnection}>
							Test ({activeModel === 'openai' ? 'OpenAI' : 'Anthropic'})
						</Button>
					</div>
				</div>
			</section>
		{/if}
	</CardContent>
</Card>
