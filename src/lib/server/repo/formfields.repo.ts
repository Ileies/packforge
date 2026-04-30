import { asc, count, eq, max } from 'drizzle-orm';

import { getMainDb } from '../db/main-db';
import { sqliteRunResult } from '../db/sqlite-run-result';
import { formfields } from '../schema/main-schema';

export function getFormfieldListRevision() {
	const row = getMainDb()
		.select({
			cnt: count(),
			maxId: max(formfields.id),
			maxCreated: max(formfields.created_at)
		})
		.from(formfields)
		.get();
	return {
		count: Number(row?.cnt ?? 0),
		maxId: Number(row?.maxId ?? 0),
		maxCreated: row?.maxCreated ?? ''
	};
}

export function listFormfields() {
	return getMainDb()
		.select({
			id: formfields.id,
			name: formfields.name,
			label: formfields.label,
			required: formfields.required,
			validation: formfields.validation,
			predefinedvalues: formfields.predefinedvalues,
			predefinedvalues_map: formfields.predefinedvalues_map,
			autofill_source: formfields.autofill_source,
			is_installer_dropdown: formfields.is_installer_dropdown,
			is_system_field: formfields.is_system_field,
			is_readonly: formfields.is_readonly,
			show_in_library: formfields.show_in_library,
			is_spacer: formfields.is_spacer,
			is_dropdown: formfields.is_dropdown,
			dropdown_values: formfields.dropdown_values,
			default_value: formfields.default_value,
			field_scope: formfields.field_scope,
			sort_order: formfields.sort_order,
			info: formfields.info,
			created_at: formfields.created_at
		})
		.from(formfields)
		.orderBy(asc(formfields.sort_order), asc(formfields.id))
		.all();
}

export function getFormfieldById(id: number) {
	return getMainDb()
		.select({
			id: formfields.id,
			name: formfields.name,
			label: formfields.label,
			required: formfields.required,
			validation: formfields.validation,
			predefinedvalues: formfields.predefinedvalues,
			predefinedvalues_map: formfields.predefinedvalues_map,
			autofill_source: formfields.autofill_source,
			is_installer_dropdown: formfields.is_installer_dropdown,
			is_system_field: formfields.is_system_field,
			is_readonly: formfields.is_readonly,
			show_in_library: formfields.show_in_library,
			is_spacer: formfields.is_spacer,
			is_dropdown: formfields.is_dropdown,
			dropdown_values: formfields.dropdown_values,
			default_value: formfields.default_value,
			field_scope: formfields.field_scope,
			sort_order: formfields.sort_order,
			info: formfields.info,
			created_at: formfields.created_at
		})
		.from(formfields)
		.where(eq(formfields.id, id))
		.get();
}

/** Für PUT/DELETE-Guards und Spacer-Patch (ohne große Felder mehrfach zu lesen). */
export function getFormfieldGuardById(id: number) {
	return getMainDb()
		.select({
			is_system_field: formfields.is_system_field,
			name: formfields.name,
			label: formfields.label
		})
		.from(formfields)
		.where(eq(formfields.id, id))
		.get();
}

export type FormfieldInput = {
	name: string;
	label: string;
	required: boolean;
	validation: string;
	predefinedvalues: boolean;
	predefinedvalues_map: string | null;
	autofill_source: string | null;
	is_installer_dropdown: boolean;
	is_readonly: boolean;
	is_spacer: boolean;
	info: string | null;
	default_value: string | null;
	is_dropdown: boolean;
	dropdown_values: unknown | null;
	field_scope: string;
};

function dropdownJson(v: unknown | null): string | null {
	if (v == null) return null;
	return typeof v === 'string' ? v : JSON.stringify(v);
}

export function insertFormfield(input: FormfieldInput) {
	const r = sqliteRunResult(
		getMainDb()
			.insert(formfields)
			.values({
				name: input.name,
				label: input.label,
				required: input.required,
				validation: input.validation,
				predefinedvalues: input.predefinedvalues,
				predefinedvalues_map: input.predefinedvalues_map,
				autofill_source: input.autofill_source,
				is_installer_dropdown: input.is_installer_dropdown,
				is_readonly: input.is_readonly,
				is_spacer: input.is_spacer,
				info: input.info,
				default_value: input.default_value,
				is_dropdown: input.is_dropdown,
				dropdown_values: dropdownJson(input.dropdown_values),
				field_scope: input.field_scope
			})
			.run()
	);
	return Number(r.lastInsertRowid);
}

export function updateFormfield(id: number, input: FormfieldInput) {
	getMainDb()
		.update(formfields)
		.set({
			name: input.name,
			label: input.label,
			required: input.required,
			validation: input.validation,
			predefinedvalues: input.predefinedvalues,
			predefinedvalues_map: input.predefinedvalues_map,
			autofill_source: input.autofill_source,
			is_installer_dropdown: input.is_installer_dropdown,
			is_readonly: input.is_readonly,
			is_spacer: input.is_spacer,
			info: input.info,
			default_value: input.default_value,
			is_dropdown: input.is_dropdown,
			dropdown_values: dropdownJson(input.dropdown_values),
			field_scope: input.field_scope
		})
		.where(eq(formfields.id, id))
		.run();
}

export function deleteFormfield(id: number) {
	getMainDb().delete(formfields).where(eq(formfields.id, id)).run();
}

export function setSortOrder(id: number, order: number) {
	getMainDb().update(formfields).set({ sort_order: order }).where(eq(formfields.id, id)).run();
}

export function deleteAllNonSystemFormfields(): number {
	const r = sqliteRunResult(
		getMainDb().delete(formfields).where(eq(formfields.is_system_field, false)).run()
	);
	return r.changes;
}

export function labelsOfNonSystem(): string[] {
	const rows = getMainDb()
		.select({ label: formfields.label })
		.from(formfields)
		.where(eq(formfields.is_system_field, false))
		.all();
	return rows.map((r) => r.label);
}

export function maxSortOrder(): number {
	const row = getMainDb()
		.select({ m: max(formfields.sort_order) })
		.from(formfields)
		.get();
	return Math.max(0, Number(row?.m ?? 0));
}

/** Labels aller Formfelder mit Namen „Vendor“ (form_data-Keys), Fallback für frühe DB. */
export function listVendorFormfieldLabels(): string[] {
	const rows = getMainDb()
		.select({ label: formfields.label })
		.from(formfields)
		.where(eq(formfields.name, 'Vendor'))
		.all();
	const labels = rows.map((r) => r.label).filter(Boolean);
	return labels.length ? labels : ['AppVendor'];
}
