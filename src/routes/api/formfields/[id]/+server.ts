import { forbiddenWithoutPermission, requireSessionApi } from '$lib/server/auth/api-route-guards';
import { badRequest, forbidden, notFound } from '$lib/server/http/errors';
import { json } from '$lib/server/http/json';
import { parseRequestJson } from '$lib/server/http/parse-request-json';
import {
	fieldScopeFromUnknown,
	formfieldUpsertBodySchema,
	optionalJsonString
} from '$lib/server/http/schemas/formfield-upsert-body';
import type { FormfieldInput } from '$lib/server/repo/formfields.repo';
import * as repo from '$lib/server/repo/formfields.repo';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, request, locals }) => {
	const session = await requireSessionApi(request, locals);
	if (!session.ok) return session.response;
	const denied = forbiddenWithoutPermission(
		session.user,
		'MANAGE_FORMFIELDS',
		'Keine Berechtigung für die Verwaltung von Formularfeldern.',
		'PF_FORMFIELDS_FORBIDDEN'
	);
	if (denied) return denied;

	const id = Number(params.id);
	const row = repo.getFormfieldById(id);
	if (!row) return notFound('Formularfeld nicht gefunden.', 'PF_FORMFIELD_NOT_FOUND');
	return json(row);
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const session = await requireSessionApi(request, locals);
	if (!session.ok) return session.response;
	const denied = forbiddenWithoutPermission(
		session.user,
		'MANAGE_FORMFIELDS',
		'Keine Berechtigung für die Verwaltung von Formularfeldern.',
		'PF_FORMFIELDS_FORBIDDEN'
	);
	if (denied) return denied;

	const id = Number(params.id);
	const existing = repo.getFormfieldGuardById(id);
	if (!existing) return notFound('Formularfeld nicht gefunden.', 'PF_FORMFIELD_NOT_FOUND');
	if (existing.is_system_field)
		return forbidden('Systemfelder dürfen nicht geändert werden.', 'PF_FORMFIELD_SYSTEM_READONLY');
	const parsed = await parseRequestJson(request, formfieldUpsertBodySchema);
	if (!parsed.ok) return parsed.response;
	const body = parsed.data;
	if (body?.isSpacer) {
		repo.updateFormfield(id, {
			name: existing.name,
			label: existing.label,
			required: false,
			validation: '',
			predefinedvalues: false,
			predefinedvalues_map: null,
			autofill_source: null,
			is_installer_dropdown: false,
			is_readonly: false,
			is_spacer: true,
			info: null,
			default_value: null,
			is_dropdown: false,
			dropdown_values: null,
			field_scope: 'both'
		});
		return json({ success: true });
	}
	const name = body?.name as string;
	const label = body?.label as string;
	if (!name || !label)
		return badRequest('Name und Bezeichnung (Label) sind Pflicht.', 'PF_NAME_LABEL_REQUIRED');
	const input: FormfieldInput = {
		name,
		label,
		required: Boolean(body.required),
		validation: String(body.validation || ''),
		predefinedvalues: Boolean(body.predefinedvalues),
		predefinedvalues_map: body.predefinedvaluesMap ? JSON.stringify(body.predefinedvaluesMap) : null,
		autofill_source: optionalJsonString(body.autofillSource),
		is_installer_dropdown: Boolean(body.isInstallerDropdown),
		is_readonly: Boolean(body.isReadonly),
		is_spacer: false,
		info: optionalJsonString(body.info),
		default_value: optionalJsonString(body.defaultValue),
		is_dropdown: Boolean(body.isDropdown),
		dropdown_values: body.dropdownValues ?? null,
		field_scope: fieldScopeFromUnknown(body.fieldScope)
	};
	repo.updateFormfield(id, input);
	return json({ success: true });
};

export const DELETE: RequestHandler = async ({ params, request, locals }) => {
	const session = await requireSessionApi(request, locals);
	if (!session.ok) return session.response;
	const denied = forbiddenWithoutPermission(
		session.user,
		'MANAGE_FORMFIELDS',
		'Keine Berechtigung für die Verwaltung von Formularfeldern.',
		'PF_FORMFIELDS_FORBIDDEN'
	);
	if (denied) return denied;

	const id = Number(params.id);
	const existing = repo.getFormfieldGuardById(id);
	if (!existing) return notFound('Formularfeld nicht gefunden.', 'PF_FORMFIELD_NOT_FOUND');
	if (existing.is_system_field)
		return forbidden('Systemfelder dürfen nicht gelöscht werden.', 'PF_FORMFIELD_SYSTEM_DELETE_FORBIDDEN');
	repo.deleteFormfield(id);
	return json({ success: true });
};
