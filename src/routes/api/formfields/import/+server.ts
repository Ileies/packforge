import z from 'zod';

import { forbiddenWithoutPermission, requireSessionApi } from '$lib/server/auth/api-route-guards';
import { json } from '$lib/server/http/json';
import { parseRequestJson } from '$lib/server/http/parse-request-json';
import type { FormfieldInput } from '$lib/server/repo/formfields.repo';
import * as repo from '$lib/server/repo/formfields.repo';

import type { RequestHandler } from './$types';

const postBodySchema = z.object({
	formfields: z.array(z.record(z.string(), z.unknown())),
	mode: z.string().optional()
});

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await requireSessionApi(request, locals);
	if (!session.ok) return session.response;
	const denied = forbiddenWithoutPermission(
		session.user,
		'MANAGE_FORMFIELDS',
		'Keine Berechtigung für die Verwaltung von Formularfeldern.',
		'PF_FORMFIELDS_FORBIDDEN'
	);
	if (denied) return denied;

	const parsed = await parseRequestJson(request, postBodySchema);
	if (!parsed.ok) return parsed.response;
	const body = parsed.data;
	const list = body.formfields;
	const mode = body.mode || 'append';

	let imported = 0;
	let skipped = 0;
	const errors: { name: string; error: string }[] = [];
	const existingLabels = repo.labelsOfNonSystem();
	let maxSort = repo.maxSortOrder();

	const fieldsToImport = list.filter(
		(f) => f && typeof f === 'object' && !(f as { is_spacer?: boolean }).is_spacer
	);

	for (let index = 0; index < fieldsToImport.length; index++) {
		const field = fieldsToImport[index] as Record<string, unknown>;
		const label = (field.label as string) || (field.name as string);
		if (mode === 'append' && existingLabels.includes(label)) {
			skipped++;
			continue;
		}
		const name = (field.name as string) || `imported-${Date.now()}-${index}`;
		const input: FormfieldInput = {
			name,
			label: label || name,
			required: Boolean(field.required),
			validation: String(field.validation || ''),
			predefinedvalues: Boolean(field.predefinedvalues),
			predefinedvalues_map: field.predefinedvalues_map ? JSON.stringify(field.predefinedvalues_map) : null,
			autofill_source: (field.autofill_source as string) || null,
			is_installer_dropdown: Boolean(field.is_installer_dropdown),
			is_readonly: Boolean(field.is_readonly),
			is_spacer: false,
			info: (field.info as string) || null,
			default_value: (field.default_value as string) || null,
			is_dropdown: Boolean(field.is_dropdown),
			dropdown_values: (field.dropdown_values as unknown) ?? null,
			field_scope: (field.field_scope as string) || 'both'
		};
		try {
			maxSort++;
			const id = repo.insertFormfield(input);
			repo.setSortOrder(id, maxSort);
			existingLabels.push(input.label);
			imported++;
		} catch (e) {
			errors.push({ name, error: e instanceof Error ? e.message : 'err' });
		}
	}

	return json({
		success: true,
		imported,
		skipped,
		errors: errors.length ? errors : undefined
	});
};
