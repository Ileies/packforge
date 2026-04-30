<script lang="ts">
	import Info from 'lucide-svelte/icons/info';

	import { resolve } from '$app/paths';
	import { PRODUCT_PUBLIC_HOST } from '$lib/app/brand';
	import { Button } from '$lib/components/ui/button/index';

	let { showLoginCta = true }: { showLoginCta?: boolean } = $props();
</script>

<div
	class="border-primary/20 bg-primary/5 text-foreground flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
	role="region"
	aria-label="Hinweis zur öffentlichen Demo"
>
	<div class="flex min-w-0 gap-3">
		<span class="text-primary mt-0.5 shrink-0" aria-hidden="true">
			<Info class="size-5" />
		</span>
		<div class="min-w-0 space-y-1 text-sm leading-relaxed">
			<p class="font-medium">Öffentliche Demo — ohne Anmeldung nutzbar</p>
			<p class="text-muted-foreground">
				Sie sehen einen eingeschränkten Funktionsumfang. Vollzugrang (u. a. Stammdaten, Einstellungen,
				Paketbau, KI) ist <strong class="text-foreground font-medium">nur auf persönliche Einladung</strong>
				möglich — es gibt <strong class="text-foreground font-medium">keine Selbstregistrierung</strong>.
			</p>
			<p class="text-muted-foreground text-xs">Offizielle Instanz: {PRODUCT_PUBLIC_HOST}</p>
		</div>
	</div>
	{#if showLoginCta}
		<Button
			variant="secondary"
			size="sm"
			class="shrink-0 self-start sm:self-center"
			href={resolve('/login')}
			title="Anmelden"
			aria-label="Anmelden"
		>
			Anmelden
		</Button>
	{/if}
</div>
