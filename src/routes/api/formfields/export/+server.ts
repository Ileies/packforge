import { forbiddenWithoutPermission, requireSessionApi } from '$lib/server/auth/api-route-guards';
import * as repo from '$lib/server/repo/formfields.repo';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, locals }) => {
	const session = await requireSessionApi(request, locals);
	if (!session.ok) return session.response;
	const denied = forbiddenWithoutPermission(
		session.user,
		'MANAGE_FORMFIELDS',
		'Keine Berechtigung für die Verwaltung von Formularfeldern.',
		'PF_FORMFIELDS_FORBIDDEN'
	);
	if (denied) return denied;

	const formfields = repo.listFormfields();
	const exportData = formfields
		.filter((f) => !f.is_system_field && !f.is_spacer)
		.map((f) => ({
			name: f.name,
			label: f.label,
			required: f.required,
			validation: f.validation || null,
			predefinedvalues: f.predefinedvalues,
			predefinedvalues_map: f.predefinedvalues_map ? JSON.parse(f.predefinedvalues_map) : null,
			autofill_source: f.autofill_source || null,
			is_installer_dropdown: f.is_installer_dropdown,
			is_readonly: f.is_readonly,
			is_dropdown: f.is_dropdown,
			dropdown_values: f.dropdown_values ? JSON.parse(f.dropdown_values) : null,
			field_scope: f.field_scope || 'both',
			info: f.info || null,
			default_value: f.default_value || null
		}));
	const body = JSON.stringify(
		{ version: '1.0', exportedAt: new Date().toISOString(), formfields: exportData },
		null,
		2
	);
	return new Response(body, {
		headers: {
			'Content-Type': 'application/json',
			'Content-Disposition': 'attachment; filename="formfields-export.json"'
		}
	});
};
