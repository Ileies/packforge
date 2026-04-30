import type { SQLQueryBindings } from 'bun:sqlite';
import type { InferSelectModel } from 'drizzle-orm';
import { eq } from 'drizzle-orm';

import { getPackagesDb, getPackagesSqlite } from '../db/packages-db';
import {
	escapeFtsTrigramPhrase,
	isPackagesFtsSearchReady,
	PACKAGE_LIST_SEARCH_COLUMNS
} from '../db/packages-search-fts';
import { packages } from '../schema/packages';
import { sanitizeVendorDisplayString } from '../vendor-normalize';

export type PackageRow = InferSelectModel<typeof packages>;
export type PackageListRow = Pick<
	PackageRow,
	'id' | 'app_vendor' | 'app_name' | 'app_version' | 'created_at' | 'updated_at'
>;

export type PackageDetailSummaryRow = Omit<PackageRow, 'original_script_text'>;

const SORTABLE = new Set<string>([
	'id',
	'check_by_ai',
	'is_software_package',
	...PACKAGE_LIST_SEARCH_COLUMNS,
	'original_script_text',
	'created_at',
	'updated_at',
	'require_admin',
	'processes_to_close_timer'
]);

function escapeLike(term: string): string {
	return String(term || '')
		.replace(/\\/g, '\\\\')
		.replace(/%/g, '\\%')
		.replace(/_/g, '\\_');
}

function searchWhere(search1: string, search2: string): { clause: string; params: string[] } {
	getPackagesSqlite();
	const terms = [search1, search2].filter((t) => t && String(t).trim());
	if (!terms.length) return { clause: '', params: [] };
	if (isPackagesFtsSearchReady()) {
		const ins = terms.map(() => `packages.id IN (SELECT rowid FROM packages_fts WHERE packages_fts MATCH ?)`);
		return {
			clause: ' WHERE ' + ins.join(' AND '),
			params: terms.map((t) => escapeFtsTrigramPhrase(t.trim()))
		};
	}
	const parts: string[] = [];
	const params: string[] = [];
	for (const t of terms) {
		const p = `%${escapeLike(t.trim())}%`;
		const ors = PACKAGE_LIST_SEARCH_COLUMNS.map((c) => `${c} LIKE ? ESCAPE '\\'`).join(' OR ');
		parts.push(`(${ors})`);
		for (let i = 0; i < PACKAGE_LIST_SEARCH_COLUMNS.length; i++) params.push(p);
	}
	return { clause: ' WHERE ' + parts.join(' AND '), params };
}

export function getPackagesTableRevision(): { count: number; maxId: number; maxUpdated: string } {
	const row = getPackagesSqlite()
		.prepare('SELECT COUNT(*) AS cnt, MAX(id) AS maxId, MAX(updated_at) AS maxUpdated FROM packages')
		.get() as { cnt: number; maxId: number | null; maxUpdated: string | null };
	return {
		count: Number(row?.cnt ?? 0),
		maxId: Number(row?.maxId ?? 0),
		maxUpdated: String(row?.maxUpdated ?? '')
	};
}

export function countPackages(search1: string, search2: string): number {
	const { clause, params } = searchWhere(search1, search2);
	const row = getPackagesSqlite()
		.prepare(`SELECT COUNT(*) as count FROM packages${clause}`)
		.get(...params) as { count: number };
	return row?.count ?? 0;
}

export function listPackages(
	limit: number,
	offset: number,
	search1: string,
	search2: string,
	sortColumn: string,
	sortDirection: string
): PackageListRow[] {
	const { clause, params } = searchWhere(search1, search2);
	const col = SORTABLE.has(sortColumn) ? sortColumn : 'id';
	const dir = sortDirection === 'desc' ? 'DESC' : 'ASC';
	const sql = `SELECT id, app_vendor, app_name, app_version, created_at, updated_at FROM packages${clause} ORDER BY ${col} ${dir} LIMIT ? OFFSET ?`;
	return getPackagesSqlite()
		.prepare(sql)
		.all(...params, limit, offset) as PackageListRow[];
}

export function getPackageById(id: number) {
	return getPackagesDb()
		.select({
			id: packages.id,
			check_by_ai: packages.check_by_ai,
			is_software_package: packages.is_software_package,
			app_vendor: packages.app_vendor,
			app_name: packages.app_name,
			app_search_name: packages.app_search_name,
			app_version: packages.app_version,
			app_arch: packages.app_arch,
			app_lang: packages.app_lang,
			app_revision: packages.app_revision,
			app_script_author: packages.app_script_author,
			app_script_date: packages.app_script_date,
			target_environment: packages.target_environment,
			legacy_script_path: packages.legacy_script_path,
			created_at: packages.created_at,
			updated_at: packages.updated_at,
			install_file_path: packages.install_file_path,
			install_args: packages.install_args,
			install_file_path_mst: packages.install_file_path_mst,
			install_file_path_msp: packages.install_file_path_msp,
			uninstall_file_path: packages.uninstall_file_path,
			uninstall_args: packages.uninstall_args,
			uninstall_type: packages.uninstall_type,
			require_admin: packages.require_admin,
			success_exit_codes: packages.success_exit_codes,
			reboot_exit_codes: packages.reboot_exit_codes,
			processes_to_close: packages.processes_to_close,
			processes_to_close_timer: packages.processes_to_close_timer,
			pre_install_checks: packages.pre_install_checks,
			update_path: packages.update_path,
			post_install_actions: packages.post_install_actions,
			extended_return_codes: packages.extended_return_codes,
			post_uninstall_actions: packages.post_uninstall_actions,
			original_script_text: packages.original_script_text
		})
		.from(packages)
		.where(eq(packages.id, id))
		.get();
}

/** Wie vollständige Zeile, aber ohne `original_script_text` (für `GET …?view=summary`). */
export function getPackageByIdSummary(id: number): PackageDetailSummaryRow | undefined {
	return getPackagesDb()
		.select({
			id: packages.id,
			check_by_ai: packages.check_by_ai,
			is_software_package: packages.is_software_package,
			app_vendor: packages.app_vendor,
			app_name: packages.app_name,
			app_search_name: packages.app_search_name,
			app_version: packages.app_version,
			app_arch: packages.app_arch,
			app_lang: packages.app_lang,
			app_revision: packages.app_revision,
			app_script_author: packages.app_script_author,
			app_script_date: packages.app_script_date,
			target_environment: packages.target_environment,
			legacy_script_path: packages.legacy_script_path,
			created_at: packages.created_at,
			updated_at: packages.updated_at,
			install_file_path: packages.install_file_path,
			install_args: packages.install_args,
			install_file_path_mst: packages.install_file_path_mst,
			install_file_path_msp: packages.install_file_path_msp,
			uninstall_file_path: packages.uninstall_file_path,
			uninstall_args: packages.uninstall_args,
			uninstall_type: packages.uninstall_type,
			require_admin: packages.require_admin,
			success_exit_codes: packages.success_exit_codes,
			reboot_exit_codes: packages.reboot_exit_codes,
			processes_to_close: packages.processes_to_close,
			processes_to_close_timer: packages.processes_to_close_timer,
			pre_install_checks: packages.pre_install_checks,
			update_path: packages.update_path,
			post_install_actions: packages.post_install_actions,
			extended_return_codes: packages.extended_return_codes,
			post_uninstall_actions: packages.post_uninstall_actions
		})
		.from(packages)
		.where(eq(packages.id, id))
		.get();
}

const UPDATE_COLS = [
	'check_by_ai',
	'is_software_package',
	'app_vendor',
	'app_name',
	'app_search_name',
	'app_version',
	'app_arch',
	'app_lang',
	'app_revision',
	'app_script_author',
	'app_script_date',
	'target_environment',
	'legacy_script_path',
	'install_file_path',
	'install_args',
	'install_file_path_mst',
	'install_file_path_msp',
	'uninstall_file_path',
	'uninstall_args',
	'uninstall_type',
	'require_admin',
	'success_exit_codes',
	'reboot_exit_codes',
	'processes_to_close',
	'processes_to_close_timer',
	'pre_install_checks',
	'update_path',
	'post_install_actions',
	'extended_return_codes',
	'post_uninstall_actions',
	'original_script_text'
] as const;

export function updatePackageRow(id: number, data: Record<string, unknown>) {
	const sets: string[] = [];
	const vals: unknown[] = [];
	for (const c of UPDATE_COLS) {
		if (c in data) {
			sets.push(`${c} = ?`);
			let v: unknown = data[c] ?? null;
			if (c === 'app_vendor' && typeof v === 'string') v = sanitizeVendorDisplayString(v);
			if (typeof v === 'boolean') v = v ? 1 : 0;
			vals.push(v);
		}
	}
	if (!sets.length) return;
	vals.push(id);
	getPackagesSqlite()
		.prepare(`UPDATE packages SET ${sets.join(', ')}, updated_at = datetime('now') WHERE id = ?`)
		.run(...(vals as SQLQueryBindings[]));
}
