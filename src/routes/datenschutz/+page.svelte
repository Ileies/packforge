<script lang="ts">
	import LegalDocumentShell from '$lib/components/legal-document-shell.svelte';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<LegalDocumentShell title="Datenschutzerklärung" appVersion={data.appVersion}>
	<p class="text-muted-foreground">
		<strong class="text-foreground">PackForge</strong> ist eine Webanwendung zur Erstellung und Verwaltung von
		PowerShell-App-Deployment-Toolkit-(PSADT)-Paketen. Diese Datenschutzerklärung beschreibt die
		<strong class="text-foreground">typische Verarbeitung personenbezogener Daten</strong> bei Betrieb der
		Software auf Infrastruktur Ihrer Organisation (Self-Hosting). Für verbindliche Konformität (z.&nbsp;B.
		Verarbeitungsverzeichnis, AV-Verträge) ist die
		<strong class="text-foreground">betreibende Stelle</strong> verantwortlich — bitte mit Legal abstimmen.
		Alternativ kann ein externes Dokument über
		<code class="bg-muted rounded px-1 py-0.5 font-mono text-xs">LEGAL_PRIVACY_URL</code> eingebunden werden (Weiterleitung).
	</p>

	<h2 class="text-foreground pt-2 text-base font-semibold">Verantwortliche Stelle</h2>
	<p class="text-muted-foreground">
		Verantwortlich im Sinne der DSGVO ist die Organisation, die diese PackForge-Instanz betreibt — z.&nbsp;B.
		Ihr Arbeitgeber oder IT-Dienstleister nach Weisung. Kontaktdaten und Datenschutzbeauftragte:r entnehmen
		Sie bitte Ihrem internen Verzeichnis oder ergänzen Sie die Angaben in Ihrer veröffentlichten Policy.
	</p>

	<h2 class="text-foreground pt-2 text-base font-semibold">Zwecke und Rechtsgrundlagen</h2>
	<ul class="text-muted-foreground list-inside list-disc space-y-1">
		<li>
			<strong class="text-foreground">Bereitstellung der Anwendung</strong> (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;b
			DSGVO, ggf. lit.&nbsp;c bei gesetzlichen Pflichten): Anmeldung, Sitzungen, rollenbasierter Zugriff, Erstellung
			und Bearbeitung von Paketdaten, Exporte.
		</li>
		<li>
			<strong class="text-foreground">Sicherheit und Missbrauchsprävention</strong> (Art.&nbsp;6 Abs.&nbsp;1
			lit.&nbsp;f DSGVO): technische Logs, begrenzte Rate-Limits, Schutz vor unbefugtem Zugriff; ggf.
			<strong class="text-foreground">Audit-Ereignisse</strong> zu sicherheits- und compliance-relevanten Aktionen
			(z.&nbsp;B. Admin-Exporte), soweit in Ihrer Konfiguration aktiv.
		</li>
		<li>
			<strong class="text-foreground">Optional: Microsoft Entra ID (Azure&nbsp;AD)</strong> — Anmeldung über Ihren
			Identitätsanbieter; Umfang der übermittelten Attribute richtet sich nach App-Registrierung und Tenant-Konfiguration
			(häufig Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;b bzw. lit.&nbsp;f).
		</li>
		<li>
			<strong class="text-foreground">Optional: KI-Funktionen</strong> (derzeit OpenAI und Anthropic, sofern
			API-Schlüssel gesetzt): Verarbeitung kann u. a. <strong class="text-foreground">Skriptinhalte</strong>,
			<strong class="text-foreground">Nutzertexte</strong> und
			<strong class="text-foreground">serverseitige Prompt-Vorlagen</strong>
			umfassen — Rechtsgrundlage und erforderliche Vorkehrungen (TOM, ggf. Auftragsverarbeitung, Drittlandtransfer)
			sind mit Legal zu klären, bevor Schlüssel produktiv gesetzt werden. Betreibende finden eine
			<strong class="text-foreground">Kurzübersicht</strong>
			unter
			<strong class="text-foreground">Einstellungen → KI &amp; API-Schlüssel</strong> sowie eine technische
			Detailtabelle in der <strong class="text-foreground">Compliance-Dokumentation</strong> zum Produkt
			(z.&nbsp;B.
			<code class="bg-muted rounded px-1 py-0.5 font-mono text-xs">docs/compliance.md</code> beim Quellcode).
		</li>
	</ul>

	<h2 class="text-foreground pt-2 text-base font-semibold">Kategorien personenbezogener Daten</h2>
	<p class="text-muted-foreground">Je nach Konfiguration können u.&nbsp;a. verarbeitet werden:</p>
	<ul class="text-muted-foreground list-inside list-disc space-y-1">
		<li>
			<strong class="text-foreground">Konto- und Identifikationsdaten</strong> (z.&nbsp;B. Anzeigename, E-Mail,
			Rollen, interne Benutzer-IDs), bei Entra-ID zusätzlich vom IdP gelieferte Attribute.
		</li>
		<li>
			<strong class="text-foreground">Nutzungs- und technische Daten</strong>: Session-Informationen
			(z.&nbsp;B. JWT in HttpOnly-Cookie), CSRF-Schutz, Zeitstempel, IP-Adressen und Metadaten in
			HTTP-Zugriffslogs (falls aktiviert), Fehler- und Sicherheitsprotokolle in Ihrer Log-Infrastruktur.
		</li>
		<li>
			<strong class="text-foreground">Inhaltsdaten</strong>: Stammdaten zu Softwarepaketen, Vorlagen, Skripte,
			Formularfelder, hochgeladene Installationsartefakte im konfigurierten Upload-Bereich.
		</li>
	</ul>

	<h2 class="text-foreground pt-2 text-base font-semibold">Speicherort und Aufbewahrung</h2>
	<p class="text-muted-foreground">
		Daten werden <strong class="text-foreground">lokal auf den von Ihnen betriebenen Systemen</strong>
		gehalten (typischerweise SQLite-Datenbanken und Dateiverzeichnisse unter dem konfigurierten
		<code class="bg-muted rounded px-1 py-0.5 font-mono text-xs">DATA_ROOT</code> bzw. den dokumentierten
		Pfaden). Es besteht <strong class="text-foreground">keine zentrale SaaS-Datenbank</strong> durch den PackForge-Quellcode-Anbieter.
		Aufbewahrungsfristen für Logs und Geschäftsdaten legen Sie betrieblich bzw. vertraglich fest (Export- und Löschkonzepte).
	</p>

	<h2 class="text-foreground pt-2 text-base font-semibold">Cookies und lokale Speicherung</h2>
	<p class="text-muted-foreground">
		Für die Funktion der Anwendung werden <strong class="text-foreground">funktionale Cookies</strong>
		(Session, CSRF) gesetzt. Es werden
		<strong class="text-foreground">keine Marketing- und keine Analytics-Cookies</strong>
		gesetzt; mögliche Nutzungs- oder Auswertungsdaten werden — falls überhaupt —
		<strong class="text-foreground">serverseitig</strong>
		(z.&nbsp;B. Session, Datenbank, Logs) geführt, nicht über Browser-Tracking-Cookies. Ein separates Cookie-Consent-Banner
		ist dafür
		<strong class="text-foreground">nicht vorgesehen</strong> — bei späterer Einführung cookie-basierter Drittanbieter-Analytics
		oder Marketing-Pixel sind Einwilligung und Policy mit Legal anzupassen.
	</p>

	<h2 class="text-foreground pt-2 text-base font-semibold">Weitergabe und Auftragsverarbeitung</h2>
	<p class="text-muted-foreground">
		Eine Übermittlung an Dritte erfolgt nur, soweit Sie dies technisch konfigurieren (z.&nbsp;B.
		<strong class="text-foreground">Microsoft-Login</strong>,
		<strong class="text-foreground">KI-APIs</strong>, Hosting-Provider, Backup-Dienst). Mit diesen Stellen
		sind die erforderlichen Verträge (insbesondere AV-Verträge) zu schließen.
	</p>

	<h2 class="text-foreground pt-2 text-base font-semibold">Ihre Rechte (Betroffene)</h2>
	<p class="text-muted-foreground">
		Soweit die DSGVO Anwendung findet, stehen Ihnen u.&nbsp;a. Rechte auf Auskunft, Berichtigung, Löschung,
		Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch zu — sowie das Recht, bei einer
		Aufsichtsbehörde Beschwerde einzulegen. Ansprechpartner ist die oben genannte verantwortliche Stelle.
	</p>

	<p class="text-muted-foreground border-border mt-6 border-t pt-4 text-xs">
		Stand: Orientierungstext für PackForge-Betrieb. Keine Rechtsberatung — bitte von Ihrer
		Datenschutzorganisation prüfen und anpassen.
	</p>
</LegalDocumentShell>
