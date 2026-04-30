<script lang="ts">
	/** Anzeigename für den Hinweis, z. B. „Script-Editor“ oder „Template-Editor“. */
	let { featureName }: { featureName: string } = $props();
</script>

<div
	class="border-border/70 bg-muted/45 text-muted-foreground mb-4 rounded-lg border px-3 py-2.5 text-sm leading-snug md:hidden"
	role="note"
>
	<p class="text-foreground font-medium">Desktop empfohlen</p>
	<p class="mt-1 text-xs leading-relaxed">
		Der <span class="text-foreground font-medium">{featureName}</span> mit Code-Editor, Prüfungen und Seitenleisten
		(z. B. Checkpoints, KI) ist auf sehr schmalen Displays nur eingeschränkt nutzbar. Zuverlässiges Arbeiten gelingt
		mit größerem Fenster, Laptop oder Tablet.
	</p>
</div>
