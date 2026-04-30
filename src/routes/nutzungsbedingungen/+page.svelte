<script lang="ts">
	import LegalDocumentShell from '$lib/components/legal-document-shell.svelte';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<LegalDocumentShell title="Nutzungsbedingungen" appVersion={data.appVersion}>
	<p class="text-muted-foreground">
		Diese Nutzungsbedingungen regeln die <strong class="text-foreground"
			>Nutzung der PackForge-Webanwendung</strong
		>
		(PSADT-Paketierung, Software-Bibliothek, Vorlagen- und Skriptbearbeitung, Exporte) innerhalb der Organisation,
		die die Instanz betreibt. Vertragspartner für etwaige individuelle Vereinbarungen bleiben Ihre internen Regelungen
		(Arbeitsvertrag, IT-Nutzungsrichtlinie, Auftraggeber-Vertrag). Ein externes Dokument kann über
		<code class="bg-muted rounded px-1 py-0.5 font-mono text-xs">LEGAL_TERMS_URL</code> verlinkt werden (Weiterleitung).
	</p>

	<h2 class="text-foreground pt-2 text-base font-semibold">Geltungsbereich und Zugang</h2>
	<p class="text-muted-foreground">
		PackForge ist für den <strong class="text-foreground">internen Fachgebrauch</strong> vorgesehen (IT,
		Packaging, Release-Management). Die Nutzung setzt eine
		<strong class="text-foreground">zulässige Authentifizierung</strong>
		voraus (z.&nbsp;B. Microsoft Entra ID oder — nur in nicht-produktiven Umgebungen — der dokumentierte Dev-Login).
		Zugangsdaten dürfen nicht an Unbefugte weitergegeben werden; gemeinsame Konten sind zu vermeiden, soweit Ihre
		Sicherheitsrichtlinien nichts anderes vorsehen.
	</p>

	<h2 class="text-foreground pt-2 text-base font-semibold">Pflichten der Nutzerinnen und Nutzer</h2>
	<ul class="text-muted-foreground list-inside list-disc space-y-1">
		<li>
			Einhaltung <strong class="text-foreground">Lizenz- und Urheberrechte</strong> an hochgeladenen Installern,
			Skripten und Dritt-Inhalten.
		</li>
		<li>
			Keine Nutzung zu rechtswidrigen Zwecken; keine Umgehung technischer Schutzmaßnahmen (Rate-Limits,
			Rollen, Step-Up bei sensiblen Exporten, sofern konfiguriert).
		</li>
		<li>
			<strong class="text-foreground">Vertraulichkeit</strong> von in der Anwendung sichtbaren Unternehmensdaten
			und Konfigurationen — entsprechend Ihrer Geheimhaltungs- und Compliance-Vorgaben.
		</li>
		<li>
			Bei <strong class="text-foreground">optionalen KI-Funktionen</strong>: keine Eingabe hochsensibler
			Daten, sofern dies durch interne Richtlinien untersagt ist; Beachtung der Regeln Ihres KI-Anbieters.
		</li>
	</ul>

	<h2 class="text-foreground pt-2 text-base font-semibold">Verfügbarkeit und Änderungen</h2>
	<p class="text-muted-foreground">
		Die betreibende Organisation bestimmt Wartungsfenster, Updates und Kapazität. Es besteht
		<strong class="text-foreground">kein Anspruch</strong> auf ununterbrochene Verfügbarkeit oder auf eine bestimmte
		Funktionsumfangsgarantie, sofern nicht gesondert vereinbart. Änderungen an der Software können Anpassungen in
		Arbeitsabläufen erfordern; Release-Hinweise sollten intern kommuniziert werden.
	</p>

	<h2 class="text-foreground pt-2 text-base font-semibold">Haftung</h2>
	<p class="text-muted-foreground">
		Die Software wird „wie besehen“ im Rahmen der jeweiligen Open-Source- bzw. Unternehmenslizenz
		bereitgestellt. Für Schäden aus der Nutzung gelten die gesetzlichen Regelungen und — soweit zulässig — die
		Haftungsbeschränkungen der zugrunde liegenden Lizenz. <strong class="text-foreground">Keine Gewähr</strong
		> dafür, dass erzeugte PSADT-Pakete in jeder Zielumgebung fehlerfrei deploybar sind — Endtests und Freigaben
		liegen in Ihrer Verantwortung.
	</p>

	<h2 class="text-foreground pt-2 text-base font-semibold">Sperrung und Beendigung</h2>
	<p class="text-muted-foreground">
		Die betreibende Organisation kann Zugänge aus wichtigem Grund sperren (Sicherheitsvorfall, Verstoß gegen
		IT-Richtlinien). Bei Beendigung des Beschäftigungs- oder Mandantenverhältnisses endet die
		Nutzungsberechtigung — sofern nichts anderes geregelt ist.
	</p>

	<h2 class="text-foreground pt-2 text-base font-semibold">Anwendbares Recht</h2>
	<p class="text-muted-foreground">
		Soweit nicht durch zwingendes Recht oder abweichende Verträge vorgegeben, kann die Anwendung des Rechts
		der Bundesrepublik Deutschland vorgesehen werden — bitte durch Ihre Legal-Abteilung festlegen.
	</p>

	<p class="text-muted-foreground border-border mt-6 border-t pt-4 text-xs">
		Keine Rechtsberatung. Diese Bedingungen sind eine sachliche Grundlage für interne PackForge-Nutzung und
		ersetzen keine individuelle juristische Prüfung.
	</p>
</LegalDocumentShell>
