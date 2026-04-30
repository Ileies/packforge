import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const packages = sqliteTable('packages', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	check_by_ai: integer('check_by_ai', { mode: 'boolean' }).notNull().default(false),
	is_software_package: integer('is_software_package', { mode: 'boolean' }).notNull().default(true),
	app_vendor: text('app_vendor').notNull(),
	app_name: text('app_name').notNull(),
	app_search_name: text('app_search_name').notNull(),
	app_version: text('app_version'),
	app_arch: text('app_arch'),
	app_lang: text('app_lang'),
	app_revision: text('app_revision'),
	app_script_author: text('app_script_author'),
	app_script_date: text('app_script_date'),
	target_environment: text('target_environment'),
	legacy_script_path: text('legacy_script_path'),
	created_at: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`),
	updated_at: text('updated_at')
		.notNull()
		.default(sql`(datetime('now'))`),
	install_file_path: text('install_file_path').notNull(),
	install_args: text('install_args'),
	install_file_path_mst: text('install_file_path_mst'),
	install_file_path_msp: text('install_file_path_msp'),
	uninstall_file_path: text('uninstall_file_path'),
	uninstall_args: text('uninstall_args'),
	uninstall_type: text('uninstall_type').notNull().default('EXE'),
	require_admin: integer('require_admin'),
	success_exit_codes: text('success_exit_codes'),
	reboot_exit_codes: text('reboot_exit_codes'),
	processes_to_close: text('processes_to_close'),
	processes_to_close_timer: integer('processes_to_close_timer').default(900),
	pre_install_checks: text('pre_install_checks'),
	update_path: text('update_path'),
	post_install_actions: text('post_install_actions'),
	extended_return_codes: text('extended_return_codes'),
	post_uninstall_actions: text('post_uninstall_actions'),
	original_script_text: text('original_script_text')
});
