import type { Database } from 'bun:sqlite';

/** Ohne `original_script_text` (zu groß für LIKE/FTS-Corpus in Listen). */
export const PACKAGE_LIST_SEARCH_COLUMNS = [
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
	'success_exit_codes',
	'reboot_exit_codes',
	'processes_to_close',
	'pre_install_checks',
	'update_path',
	'post_install_actions',
	'extended_return_codes',
	'post_uninstall_actions'
] as const;

let ftsSearchReady = false;
let ftsSearchAttempted = false;

export function isPackagesFtsSearchReady(): boolean {
	return ftsSearchReady;
}

function corpusConcatSql(alias: 'NEW' | 'OLD' | 'packages'): string {
	const p = alias;
	const parts = PACKAGE_LIST_SEARCH_COLUMNS.map((c) => `coalesce(${p}.${c},'')`);
	return `trim(${parts.join(` || ' ' || `)})`;
}

/** FTS5 MATCH: Phrase in doppelten Anführungszeichen, `"` verdoppeln. */
export function escapeFtsTrigramPhrase(term: string): string {
	const t = String(term || '')
		.trim()
		.replace(/\s+/g, ' ')
		.replace(/"/g, '""');
	return `"${t}"`;
}

/**
 * Legt `packages_fts` (trigram) + Trigger an und füllt einmalig aus `packages`.
 * Bei Fehler (z. B. fehlendes FTS5): stiller Fallback, `isPackagesFtsSearchReady()` bleibt false.
 */
export function ensurePackagesSearchFts(db: Database): void {
	if (ftsSearchAttempted) return;
	const exists = db
		.prepare(`SELECT 1 AS o FROM sqlite_master WHERE type='table' AND name='packages_fts'`)
		.get() as { o: number } | undefined;
	if (exists) {
		ftsSearchReady = true;
		ftsSearchAttempted = true;
		return;
	}
	ftsSearchAttempted = true;
	const corpusPackages = corpusConcatSql('packages');
	const corpusNew = corpusConcatSql('NEW');
	const corpusOld = corpusConcatSql('OLD');
	try {
		db.run(`CREATE VIRTUAL TABLE packages_fts USING fts5(corpus, tokenize='trigram')`);
		db.run(`
			CREATE TRIGGER packages_fts_ad AFTER DELETE ON packages BEGIN
				INSERT INTO packages_fts(packages_fts, rowid, corpus) VALUES('delete', old.id, ${corpusOld});
			END`);
		db.run(`
			CREATE TRIGGER packages_fts_ai AFTER INSERT ON packages BEGIN
				INSERT INTO packages_fts(rowid, corpus) VALUES (new.id, ${corpusNew});
			END`);
		db.run(`
			CREATE TRIGGER packages_fts_au AFTER UPDATE ON packages BEGIN
				INSERT INTO packages_fts(packages_fts, rowid, corpus) VALUES('delete', old.id, ${corpusOld});
				INSERT INTO packages_fts(rowid, corpus) VALUES (new.id, ${corpusNew});
			END`);
		const row = db.prepare(`SELECT COUNT(*) AS c FROM packages_fts`).get() as { c: number };
		if ((row?.c ?? 0) === 0) {
			db.run(`INSERT INTO packages_fts(rowid, corpus) SELECT id, ${corpusPackages} FROM packages`);
		}
		ftsSearchReady = true;
	} catch {
		ftsSearchReady = false;
		try {
			db.run(`DROP TABLE IF EXISTS packages_fts`);
		} catch {
			/* ignore */
		}
	}
}
