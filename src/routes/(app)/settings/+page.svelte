<script lang="ts">
	import { APP_PAGE_SHELL_CLASS } from '$lib/app/app-page-shell';
	import { PRODUCT_NAME } from '$lib/app/brand';
	import SettingsAiPanel from '$lib/components/settings-ai-panel.svelte';
	import SettingsInstanceExportPanel from '$lib/components/settings-instance-export-panel.svelte';
	import SettingsPowershellLintPanel from '$lib/components/settings-powershell-lint-panel.svelte';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Einstellungen — {PRODUCT_NAME}</title>
</svelte:head>

<div class="{APP_PAGE_SHELL_CLASS} flex flex-col gap-4">
	<header class="shrink-0 space-y-0.5">
		<h1 class="text-xl font-semibold tracking-tight md:text-2xl">Einstellungen</h1>
		<p class="text-muted-foreground text-sm leading-snug">KI, API-Schlüssel und Instanz-Export (Admin).</p>
	</header>

	<SettingsAiPanel aiDailyMax={data.aiDailyMax} />
	<SettingsPowershellLintPanel />
	<SettingsInstanceExportPanel />

	<section class="border-border mt-2 border-t pt-6" aria-labelledby="settings-legal-heading">
		<h2
			id="settings-legal-heading"
			class="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase"
		>
			Rechtliches
		</h2>
		<p class="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 text-[11px] leading-snug">
			<a class="hover:text-foreground underline-offset-2 hover:underline" href="/impressum">Impressum</a>
			<a class="hover:text-foreground underline-offset-2 hover:underline" href="/datenschutz">Datenschutz</a>
			<a class="hover:text-foreground underline-offset-2 hover:underline" href="/nutzungsbedingungen"
				>Nutzungsbedingungen</a
			>
		</p>
	</section>
</div>
