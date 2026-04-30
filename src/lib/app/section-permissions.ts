/** Route-Segment → mindestens eine Berechtigung (wie Legacy SECTION_PERMISSIONS). */
export const SECTION_PERMISSIONS: Record<string, string[]> = {
	welcome: ['VIEW_WELCOME'],
	'software-library': ['VIEW_SOFTWARE_LIBRARY'],
	'script-maker': ['CREATE_SCRIPTS'],
	'script-editor': ['VIEW_SCRIPT_EDITOR'],
	'template-editor': ['VIEW_TEMPLATE_EDITOR'],
	'data-editor': ['VIEW_DATA_EDITOR'],
	stammdaten: ['VIEW_STAMMDATEN'],
	settings: ['VIEW_SETTINGS']
};
