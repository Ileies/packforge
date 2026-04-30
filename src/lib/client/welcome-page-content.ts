import { BookOpen, Database, FileCode, Library, PenLine, Settings, WandSparkles } from '@lucide/svelte';

/** Interne Ziele der Welcome-Seite (für `resolve` aus `$app/paths`). */
export type WelcomeAppPathname =
	| '/stammdaten'
	| '/data-editor'
	| '/script-editor'
	| '/script-maker'
	| '/settings'
	| '/software-library'
	| '/template-editor';

/** Lucide-Svelte-Icons, die auf der Welcome-Seite in Kacheln vorkommen. */
export type WelcomeAreaIcon =
	| typeof BookOpen
	| typeof Database
	| typeof FileCode
	| typeof Library
	| typeof PenLine
	| typeof Settings
	| typeof WandSparkles;

/** Nur Text für die Welcome-Seite — Navigation erfolgt über Kacheln / Sidebar (keine zweiten Links). */
export type WelcomeWorkflowStep = {
	step: number;
	title: string;
	body: string;
};

export const WELCOME_WORKFLOW: readonly WelcomeWorkflowStep[] = [
	{
		step: 1,
		title: 'Grundlage sichern',
		body: 'Sie pflegen Stammdaten zu Software-Paketen und Formularfelder einmal sauber — für alle Pakete nutzbar.'
	},
	{
		step: 2,
		title: 'Paket erzeugen',
		body: 'Sie laden Installer und Dateien hoch und wählen eine Vorlage — der Script Maker erzeugt das PSADT-Grundgerüst.'
	},
	{
		step: 3,
		title: 'Feinschliff & Export',
		body: 'Sie passen Skripte an, verwalten Einträge in der Bibliothek und exportieren sie als ZIP für die Verteilung.'
	}
];

/** Schlüssel wie in `$lib/app/section-permissions` (Navigation / Zugriffskontrolle). */
export type WelcomeAreaSection =
	| 'software-library'
	| 'script-maker'
	| 'script-editor'
	| 'template-editor'
	| 'data-editor'
	| 'stammdaten'
	| 'settings';

export type WelcomeArea = {
	href: WelcomeAppPathname;
	section: WelcomeAreaSection;
	title: string;
	desc: string;
	Icon: WelcomeAreaIcon;
};

export type WelcomeAreaGroup = {
	label: string;
	hint: string;
	items: WelcomeArea[];
};

export const WELCOME_AREA_GROUPS: WelcomeAreaGroup[] = [
	{
		label: 'Paket & Verteilung',
		hint: 'Vom neuen Paket bis zum Download',
		items: [
			{
				href: '/software-library',
				section: 'software-library',
				title: 'Software-Bibliothek',
				desc: 'Alle angelegten Pakete, Export als PSADT-ZIP, Aufräumen.',
				Icon: Library
			},
			{
				href: '/script-maker',
				section: 'script-maker',
				title: 'Script Maker',
				desc: 'Neues Paket aus Installer-Dateien und Vorlage erzeugen.',
				Icon: WandSparkles
			},
			{
				href: '/script-editor',
				section: 'script-editor',
				title: 'Script-Editor',
				desc: 'Deploy-Skripte zu bestehender Software bearbeiten.',
				Icon: FileCode
			}
		]
	},
	{
		label: 'Vorlagen & Daten',
		hint: 'Inhalte und Metadaten zentral halten',
		items: [
			{
				href: '/template-editor',
				section: 'template-editor',
				title: 'Template-Editor',
				desc: 'Vorlagen-Versionen und Textbausteine pflegen.',
				Icon: BookOpen
			},
			{
				href: '/data-editor',
				section: 'data-editor',
				title: 'Daten-Editor',
				desc: 'Formularfelder und Eingaben für Pakete definieren.',
				Icon: PenLine
			},
			{
				href: '/stammdaten',
				section: 'stammdaten',
				title: 'Stammdaten',
				desc: 'Alle Pakete tabellarisch mit Hersteller, Name und Version — ergänzt die Kartenansicht der Bibliothek.',
				Icon: Database
			}
		]
	},
	{
		label: 'System',
		hint: 'Anbindungen und Berechtigungen',
		items: [
			{
				href: '/settings',
				section: 'settings',
				title: 'Einstellungen',
				desc: 'KI-Anbieter, API-Schlüssel und Umgebungsoptionen.',
				Icon: Settings
			}
		]
	}
];
