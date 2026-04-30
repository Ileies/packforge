import { and, eq } from 'drizzle-orm';

import { getMainDb, getMainRaw } from './db/main-db';
import { POWERSHELL_LINT_PROFILE_KEY } from './powershell-lint-profile';
import { formfields, systemSettings } from './schema/main-schema';
import { getSystemFields } from './system-fields';

let done = false;

/** Systemfelder + Default AI-Modell wie im Legacy-Server. */
export function ensureAppSeed(): void {
	if (done) return;
	done = true;
	try {
		getMainRaw().run('DROP TABLE IF EXISTS idempotency_records');
	} catch {
		/* Legacy-DBs: entfernte Idempotenz-Tabelle bereinigen */
	}
	const db = getMainDb();

	const existing = db
		.select({ key: systemSettings.key })
		.from(systemSettings)
		.where(eq(systemSettings.key, 'active_ai_model'))
		.get();
	if (!existing) {
		db.insert(systemSettings).values({ key: 'active_ai_model', value: 'openai' }).run();
	}

	const lintProf = db
		.select({ key: systemSettings.key })
		.from(systemSettings)
		.where(eq(systemSettings.key, POWERSHELL_LINT_PROFILE_KEY))
		.get();
	if (!lintProf) {
		db.insert(systemSettings).values({ key: POWERSHELL_LINT_PROFILE_KEY, value: 'relaxed' }).run();
	}

	for (const field of getSystemFields()) {
		const row = db
			.select({ id: formfields.id })
			.from(formfields)
			.where(and(eq(formfields.name, field.name), eq(formfields.is_system_field, true)))
			.get();

		if (row) {
			db.update(formfields)
				.set({
					label: field.label,
					required: field.required,
					validation: field.validation,
					predefinedvalues: field.predefinedvalues,
					predefinedvalues_map: field.predefinedvalues_map,
					autofill_source: field.autofill_source,
					is_installer_dropdown: field.is_installer_dropdown,
					is_readonly: field.is_readonly,
					show_in_library: field.show_in_library,
					default_value: field.default_value,
					info: field.info
				})
				.where(eq(formfields.id, row.id))
				.run();
		} else {
			db.insert(formfields)
				.values({
					name: field.name,
					label: field.label,
					required: field.required,
					validation: field.validation,
					predefinedvalues: field.predefinedvalues,
					predefinedvalues_map: field.predefinedvalues_map,
					autofill_source: field.autofill_source,
					is_installer_dropdown: field.is_installer_dropdown,
					is_readonly: field.is_readonly,
					show_in_library: field.show_in_library,
					is_system_field: true,
					is_spacer: false,
					default_value: field.default_value,
					info: field.info,
					sort_order: field.sort_order
				})
				.run();
		}
	}
}
