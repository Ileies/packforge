import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const templates = sqliteTable(
	'templates',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		content: text('content').notNull(),
		major_version: integer('major_version').notNull().default(1),
		minor_version: integer('minor_version').notNull().default(0),
		created_at: text('created_at').default(sql`(datetime('now', 'localtime'))`)
	},
	(t) => [index('idx_templates_created_at').on(t.created_at)]
);

export const formfields = sqliteTable('formfields', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	label: text('label').notNull().unique(),
	required: integer('required', { mode: 'boolean' }).notNull().default(false),
	validation: text('validation'),
	predefinedvalues: integer('predefinedvalues', { mode: 'boolean' }).notNull().default(false),
	predefinedvalues_map: text('predefinedvalues_map'),
	autofill_source: text('autofill_source'),
	is_installer_dropdown: integer('is_installer_dropdown', { mode: 'boolean' }).notNull().default(false),
	is_system_field: integer('is_system_field', { mode: 'boolean' }).notNull().default(false),
	is_readonly: integer('is_readonly', { mode: 'boolean' }).notNull().default(false),
	show_in_library: integer('show_in_library', { mode: 'boolean' }).notNull().default(true),
	is_spacer: integer('is_spacer', { mode: 'boolean' }).notNull().default(false),
	is_dropdown: integer('is_dropdown', { mode: 'boolean' }).notNull().default(false),
	dropdown_values: text('dropdown_values'),
	default_value: text('default_value'),
	field_scope: text('field_scope').default('both'),
	sort_order: integer('sort_order').default(0),
	info: text('info'),
	created_at: text('created_at').default(sql`(datetime('now', 'localtime'))`)
});

export const software = sqliteTable(
	'software',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		name: text('name').notNull(),
		version: text('version'),
		file_name: text('file_name').notNull(),
		file_path: text('file_path').notNull(),
		/** SHA-256 des Haupt-Installers (Hex, Kleinbuchstaben); Duplikat-Erkennung mit Name + Version. */
		installer_sha256: text('installer_sha256'),
		file_size: integer('file_size'),
		form_data: text('form_data'),
		generated_script: text('generated_script').notNull(),
		template_id: integer('template_id'),
		additional_files: text('additional_files'),
		support_files: text('support_files'),
		created_at: text('created_at').default(sql`(datetime('now', 'localtime'))`),
		updated_at: text('updated_at').default(sql`(datetime('now', 'localtime'))`)
	},
	(t) => [
		index('idx_software_created_at').on(t.created_at),
		index('idx_software_name_version').on(t.name, t.version)
	]
);

export const systemSettings = sqliteTable('system_settings', {
	key: text('key').primaryKey(),
	value: text('value').notNull(),
	updated_at: text('updated_at').default(sql`(datetime('now', 'localtime'))`)
});

/** Zähler für optionales KI-Tageslimit (`AI_DAILY_MAX_REQUESTS`), UTC-Datum `YYYY-MM-DD`. */
export const aiDailyUsage = sqliteTable('ai_daily_usage', {
	day: text('day').primaryKey(),
	count: integer('count').notNull().default(0)
});

/** Automations-API: nur Hash des Klartext-Keys; Scopes siehe `api-key-scopes.ts`. */
export const apiKeys = sqliteTable(
	'api_keys',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		key_hash: text('key_hash').notNull().unique(),
		key_prefix: text('key_prefix').notNull(),
		label: text('label'),
		expires_at: text('expires_at'),
		scopes_json: text('scopes_json').notNull(),
		created_at: text('created_at').default(sql`(datetime('now', 'localtime'))`),
		revoked_at: text('revoked_at'),
		last_used_at: text('last_used_at')
	},
	(t) => [index('idx_api_keys_active').on(t.revoked_at)]
);

export const scriptCheckpoints = sqliteTable(
	'script_checkpoints',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		software_id: integer('software_id')
			.notNull()
			.references(() => software.id, { onDelete: 'cascade' }),
		checkpoint_number: integer('checkpoint_number').notNull(),
		name: text('name'),
		generated_script: text('generated_script').notNull(),
		comment: text('comment'),
		author: text('author'),
		created_at: text('created_at').default(sql`(datetime('now', 'localtime'))`)
	},
	(t) => [
		index('idx_checkpoints_software_id').on(t.software_id),
		index('idx_checkpoints_number').on(t.software_id, t.checkpoint_number)
	]
);
