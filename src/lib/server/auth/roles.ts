export const ROLES = {
	/** Nur für automatische Sessions, wenn `PUBLIC_OPEN_PORTFOLIO_MODE=true` — nicht über Entra vergeben. */
	PortfolioGast: {
		label: 'Öffentliche Demo',
		description:
			'Portfolio: Oberfläche erkunden (Bibliothek, Skript- und Vorlagen-Editor lesen). Keine Stammdaten- oder Einstellungsbereiche.',
		permissions: ['VIEW_WELCOME', 'VIEW_SOFTWARE_LIBRARY', 'VIEW_SCRIPT_EDITOR', 'VIEW_TEMPLATE_EDITOR']
	},
	Besucher: {
		label: 'Besucher',
		description: 'Nur Lesezugriff auf Bibliothek',
		permissions: ['VIEW_WELCOME', 'VIEW_SOFTWARE_LIBRARY']
	},
	Mitarbeiter: {
		label: 'Mitarbeiter',
		description: 'Vollzugriff auf Script-Erstellung und -Bearbeitung',
		permissions: [
			'VIEW_WELCOME',
			'VIEW_SOFTWARE_LIBRARY',
			'CREATE_SCRIPTS',
			'EDIT_OWN_SCRIPTS',
			'EDIT_ALL_SCRIPTS',
			'VIEW_SCRIPT_EDITOR',
			'EXPORT_PSADT',
			'USE_AI_FEATURES',
			'VIEW_SETTINGS',
			'VIEW_STAMMDATEN',
			'VIEW_TEMPLATE_EDITOR',
			'VIEW_DATA_EDITOR'
		]
	},
	Admin: {
		label: 'Administrator',
		description: 'Vollzugriff auf alle Features und Einstellungen',
		permissions: [
			'VIEW_WELCOME',
			'VIEW_SOFTWARE_LIBRARY',
			'CREATE_SCRIPTS',
			'EDIT_OWN_SCRIPTS',
			'EDIT_ALL_SCRIPTS',
			'VIEW_SCRIPT_EDITOR',
			'EXPORT_PSADT',
			'USE_AI_FEATURES',
			'VIEW_TEMPLATE_EDITOR',
			'EDIT_TEMPLATES',
			'VIEW_DATA_EDITOR',
			'VIEW_STAMMDATEN',
			'MANAGE_FORMFIELDS',
			'VIEW_SETTINGS',
			'MANAGE_ROLES',
			'MANAGE_AI_KEYS',
			'ADMIN_INSTANCE_EXPORT'
		]
	}
} as const;

export type RoleName = keyof typeof ROLES;

export function getRolePermissions(roleName: string): string[] {
	const r = ROLES[roleName as RoleName];
	return r ? [...r.permissions] : [];
}
