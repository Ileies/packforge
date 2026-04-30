<script lang="ts">
	import LegalDocumentShell from '$lib/components/legal-document-shell.svelte';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<LegalDocumentShell title="Impressum" appVersion={data.appVersion}>
	<p class="text-muted-foreground">
		<strong class="text-foreground">Hinweis:</strong> PackForge wird typischerweise
		<strong class="text-foreground">self-hosted</strong>
		betrieben. Impressumspflichtige Angaben nach
		<a
			class="text-primary underline-offset-2 hover:underline"
			href="https://www.gesetze-im-internet.de/tmg/__5.html"
			rel="noopener noreferrer"
			target="_blank">§&nbsp;5 TMG</a
		>
		betreffen die <strong class="text-foreground">jeweils betreibende Organisation</strong> (Arbeitgeber,
		Mandant, Behörde o.&nbsp;Ä.), nicht den Quellcode als solchen. Die folgenden Angaben sind eine
		<strong class="text-foreground">Vorlage</strong> — bitte durch Ihre konkreten Daten ersetzen oder die
		Seite über <code class="bg-muted rounded px-1 py-0.5 font-mono text-xs">LEGAL_IMPRESSUM_URL</code> auf ein verbindliches
		Dokument Ihrer Rechtsabteilung weiterleiten.
	</p>

	<div class="bg-muted/40 border-border rounded-lg border p-4 text-sm">
		<p class="text-foreground font-medium">Anbieter dieser PackForge-Instanz (Muster — bitte anpassen)</p>
		<address class="text-muted-foreground mt-2 not-italic">
			<span class="text-foreground">[Firma / Behörde / Organisation]</span><br />
			[Rechtsform, z.&nbsp;B. GmbH]<br />
			[Straße und Hausnummer]<br />
			[PLZ Ort]<br />
			<span class="mt-2 block">E-Mail: [kontakt@beispiel.de]</span>
			<span class="block">Telefon: [optional]</span>
		</address>
		<p class="text-muted-foreground mt-3">
			<strong class="text-foreground">Vertretungsberechtigt:</strong> [Name der Geschäftsführung / des
			Organisationsleiters]<br />
			<strong class="text-foreground">Register:</strong> [z.&nbsp;B. Handelsregister HRB …, Amtsgericht …] —
			falls nicht zutreffend: entfallen lassen<br />
			<strong class="text-foreground">USt-IdNr.:</strong> [falls vorhanden]
		</p>
	</div>

	<h2 class="text-foreground pt-2 text-base font-semibold">
		Verantwortlich für den Inhalt nach §&nbsp;55 Abs.&nbsp;2 RStV
	</h2>
	<p class="text-muted-foreground">
		[Name, Anschrift — in der Praxis oft identisch mit dem Anbieter oder der Pressestelle / dem
		öffentlich-rechtlichen Auftraggeber]
	</p>

	<h2 class="text-foreground pt-2 text-base font-semibold">Streitschlichtung / EU-Schlichtungsstelle</h2>
	<p class="text-muted-foreground">
		Wir sind nicht verpflichtet und grundsätzlich nicht bereit, an Streitbeilegungsverfahren vor einer
		Verbraucherschlichtungsstelle teilzunehmen — soweit für Ihre Nutzung (B2B / intern) überhaupt relevant.
		Die Europäische Kommission stellt eine Plattform zur
		<a
			class="text-primary underline-offset-2 hover:underline"
			href="https://ec.europa.eu/consumers/odr/"
			rel="noopener noreferrer"
			target="_blank">Online-Streitbeilegung (OS)</a
		>
		bereit. Unsere E-Mail-Adresse finden Sie oben im Impressum.
	</p>

	<h2 class="text-foreground pt-2 text-base font-semibold">Haftung für Inhalte und Links</h2>
	<p class="text-muted-foreground">
		Als Diensteanbieter sind wir gemäß §&nbsp;7 Abs.&nbsp;1 TMG für eigene Inhalte auf diesen Seiten nach den
		allgemeinen Gesetzen verantwortlich. Nach §§&nbsp;8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht
		verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu
		forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der
		Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt — erst ab dem Zeitpunkt
		der Kenntnis einer konkreten Rechtsverletzung haften wir. Bei Bekanntwerden von entsprechenden
		Rechtsverletzungen entfernen wir diese Inhalte umgehend.
	</p>
	<p class="text-muted-foreground">
		Unser Angebot kann Links zu externen Websites Dritter enthalten. Auf deren Inhalte haben wir keinen
		Einfluss; deshalb können wir für diese fremden Inhalte keine Gewähr übernehmen. Für die Inhalte der
		verlinkten Seiten ist stets der jeweilige Anbieter verantwortlich.
	</p>

	<h2 class="text-foreground pt-2 text-base font-semibold">Urheberrecht</h2>
	<p class="text-muted-foreground">
		Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen
		Urheberrecht. Die durch Nutzerinnen und Nutzer in PackForge eingestellten Inhalte (z.&nbsp;B. Skripte,
		Metadaten, Paketbeschreibungen) stehen im Verantwortungsbereich der jeweils handelnden Organisation;
		Lizenzen und interne Regelungen richten sich nach Ihren betrieblichen Vorgaben.
	</p>

	<p class="text-muted-foreground border-border mt-6 border-t pt-4 text-xs">
		Keine Rechtsberatung. Verbindliche Texte und die endgültige Ausgestaltung des Impressums sollten mit Ihrer
		Rechtsabteilung abgestimmt werden.
	</p>
</LegalDocumentShell>
