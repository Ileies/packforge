import { existsSync, unlinkSync } from 'node:fs';

import { and, asc, count, desc, eq, max, or, sql } from 'drizzle-orm';

import { getMainDb } from '../db/main-db';
import { sqliteRunResult } from '../db/sqlite-run-result';
import { scriptCheckpoints, software } from '../schema/main-schema';

export type UploadedFileMeta = {
	originalName: string;
	path: string;
	size: number;
	relativePath: string;
};

export function getSoftwareTableRevision() {
	const row = getMainDb()
		.select({
			cnt: count(),
			maxId: max(software.id),
			maxUpdated: max(software.updated_at)
		})
		.from(software)
		.get();
	return {
		count: Number(row?.cnt ?? 0),
		maxId: Number(row?.maxId ?? 0),
		maxUpdated: String(row?.maxUpdated ?? '')
	};
}

export function listSoftwareSummaries() {
	return getMainDb()
		.select({
			id: software.id,
			name: software.name,
			version: software.version,
			file_name: software.file_name,
			created_at: software.created_at
		})
		.from(software)
		.orderBy(desc(software.created_at))
		.all();
}

const LIBRARY_SORT_KEYS = new Set([
	'name_asc',
	'name_desc',
	'created_desc',
	'created_asc',
	'version_desc',
	'version_asc'
]);

function escapeLikeFragment(term: string): string {
	return String(term || '')
		.replace(/\\/g, '\\\\')
		.replace(/%/g, '\\%')
		.replace(/_/g, '\\_');
}

/** Freitext über Name, Version, Dateiname und Anlagedatum (wie früher clientseitig). */
function librarySearchWhere(search: string) {
	const t = search.trim().toLowerCase();
	if (!t) return undefined;
	const pat = `%${escapeLikeFragment(t)}%`;
	return or(
		sql`lower(${software.name}) like ${pat} escape '\\'`,
		sql`lower(coalesce(${software.version}, '')) like ${pat} escape '\\'`,
		sql`lower(${software.file_name}) like ${pat} escape '\\'`,
		sql`lower(coalesce(${software.created_at}, '')) like ${pat} escape '\\'`
	);
}

export function countSoftwareSummariesFiltered(search: string): number {
	const where = librarySearchWhere(search);
	const row = where
		? getMainDb().select({ c: count() }).from(software).where(where).get()
		: getMainDb().select({ c: count() }).from(software).get();
	return Number(row?.c ?? 0);
}

export type SoftwareSummaryListRow = {
	id: number;
	name: string;
	version: string | null;
	file_name: string;
	created_at: string | null;
};

export function listSoftwareSummariesPaged(params: {
	search: string;
	sort: string;
	limit: number;
	offset: number;
}): SoftwareSummaryListRow[] {
	const where = librarySearchWhere(params.search);
	const sort = LIBRARY_SORT_KEYS.has(params.sort) ? params.sort : 'name_asc';

	const orderBy =
		sort === 'name_desc'
			? [desc(software.name), desc(software.id)]
			: sort === 'created_desc'
				? [desc(software.created_at), desc(software.id)]
				: sort === 'created_asc'
					? [asc(software.created_at), asc(software.id)]
					: sort === 'version_desc'
						? [desc(software.version), desc(software.id)]
						: sort === 'version_asc'
							? [asc(software.version), asc(software.id)]
							: [asc(software.name), asc(software.id)];

	const sel = {
		id: software.id,
		name: software.name,
		version: software.version,
		file_name: software.file_name,
		created_at: software.created_at
	};

	const base = getMainDb().select(sel).from(software);
	const q = where ? base.where(where) : base;
	return q
		.orderBy(...orderBy)
		.limit(params.limit)
		.offset(params.offset)
		.all();
}

/** Nur die Felder, die `buildPsadtZipResponse` braucht (kein `form_data`). */
export type SoftwarePsadtExportRow = {
	name: string;
	version: string | null;
	file_path: string;
	file_name: string;
	generated_script: string;
	additional_files: string | null;
	support_files: string | null;
};

export function getSoftwareByIdForPsadtExport(id: number): SoftwarePsadtExportRow | undefined {
	return getMainDb()
		.select({
			name: software.name,
			version: software.version,
			file_path: software.file_path,
			file_name: software.file_name,
			generated_script: software.generated_script,
			additional_files: software.additional_files,
			support_files: software.support_files
		})
		.from(software)
		.where(eq(software.id, id))
		.get();
}

/** Nur Dateipfade für `deleteSoftwareFiles` / DELETE-Software. */
export type SoftwareFileDeletionRow = {
	file_path: string;
	additional_files: string | null;
	support_files: string | null;
};

export function getSoftwareByIdForFileDeletion(id: number): SoftwareFileDeletionRow | undefined {
	return getMainDb()
		.select({
			file_path: software.file_path,
			additional_files: software.additional_files,
			support_files: software.support_files
		})
		.from(software)
		.where(eq(software.id, id))
		.get();
}

export function getSoftwareById(id: number) {
	return getMainDb()
		.select({
			id: software.id,
			name: software.name,
			version: software.version,
			file_name: software.file_name,
			file_path: software.file_path,
			installer_sha256: software.installer_sha256,
			file_size: software.file_size,
			form_data: software.form_data,
			generated_script: software.generated_script,
			template_id: software.template_id,
			additional_files: software.additional_files,
			support_files: software.support_files,
			created_at: software.created_at,
			updated_at: software.updated_at
		})
		.from(software)
		.where(eq(software.id, id))
		.get();
}

/** Metadaten ohne Skript, Formular-JSON und Datei-JSON (für `GET …?view=summary`). */
export function getSoftwareByIdSummary(id: number) {
	return getMainDb()
		.select({
			id: software.id,
			name: software.name,
			version: software.version,
			file_name: software.file_name,
			file_path: software.file_path,
			installer_sha256: software.installer_sha256,
			file_size: software.file_size,
			template_id: software.template_id,
			created_at: software.created_at,
			updated_at: software.updated_at
		})
		.from(software)
		.where(eq(software.id, id))
		.get();
}

/** Gleiche Version wie bei `findConflictingSoftwareIdForNewUpload` (leer = coalesced leer). */
function versionMatchesColumn(versionRaw: string) {
	const v = versionRaw.trim();
	return v === '' ? sql`(coalesce(trim(${software.version}), '') = '')` : eq(software.version, v);
}

/**
 * Konflikt, wenn Name + Version schon existieren und derselbe Installer (SHA-256) —
 * oder ein Legacy-Eintrag **ohne** gespeicherten Hash (dann weiterhin nur Name+Version).
 */
export function findConflictingSoftwareIdForNewUpload(
	name: string,
	versionRaw: string,
	installerSha256Hex: string
): number | undefined {
	const n = name.trim();
	const hash = installerSha256Hex.trim().toLowerCase();
	if (!n || !hash) return undefined;
	const row = getMainDb()
		.select({ id: software.id })
		.from(software)
		.where(
			and(
				eq(software.name, n),
				versionMatchesColumn(versionRaw),
				or(eq(software.installer_sha256, hash), sql`coalesce(trim(${software.installer_sha256}), '') = ''`)
			)
		)
		.get();
	return row?.id;
}

export function insertSoftware(
	name: string,
	version: string,
	fileName: string,
	filePath: string,
	installerSha256: string,
	fileSize: number,
	formData: unknown,
	generatedScript: string,
	templateId: number | null,
	additionalFiles: UploadedFileMeta[],
	supportFiles: UploadedFileMeta[]
) {
	const r = sqliteRunResult(
		getMainDb()
			.insert(software)
			.values({
				name,
				version,
				file_name: fileName,
				file_path: filePath,
				installer_sha256: installerSha256,
				file_size: fileSize,
				form_data: typeof formData === 'string' ? formData : JSON.stringify(formData),
				generated_script: generatedScript,
				template_id: templateId,
				additional_files: JSON.stringify(additionalFiles),
				support_files: JSON.stringify(supportFiles)
			})
			.run()
	);
	return Number(r.lastInsertRowid);
}

/** Software-Zeile und ersten Checkpoint in **einer** DB-Transaktion (Rollback bei Fehler). */
export function insertSoftwareWithInitialCheckpoint(
	name: string,
	version: string,
	fileName: string,
	filePath: string,
	installerSha256: string,
	fileSize: number,
	formData: unknown,
	generatedScript: string,
	templateId: number | null,
	additionalFiles: UploadedFileMeta[],
	supportFiles: UploadedFileMeta[]
): number {
	const db = getMainDb();
	return db.transaction((tx) => {
		const r = sqliteRunResult(
			tx
				.insert(software)
				.values({
					name,
					version,
					file_name: fileName,
					file_path: filePath,
					installer_sha256: installerSha256,
					file_size: fileSize,
					form_data: typeof formData === 'string' ? formData : JSON.stringify(formData),
					generated_script: generatedScript,
					template_id: templateId,
					additional_files: JSON.stringify(additionalFiles),
					support_files: JSON.stringify(supportFiles)
				})
				.run()
		);
		const id = Number(r.lastInsertRowid);
		tx.insert(scriptCheckpoints)
			.values({
				software_id: id,
				checkpoint_number: 1,
				name: null,
				generated_script: generatedScript,
				comment: null,
				author: null
			})
			.run();
		return id;
	});
}

export function updateSoftware(
	id: number,
	name: string,
	version: string,
	formData: unknown,
	generatedScript: string
) {
	getMainDb()
		.update(software)
		.set({
			name,
			version,
			form_data: typeof formData === 'string' ? formData : JSON.stringify(formData),
			generated_script: generatedScript
		})
		.where(eq(software.id, id))
		.run();
}

function unlinkQuiet(p: string) {
	if (p && existsSync(p)) unlinkSync(p);
}

export function deleteSoftwareFiles(row: SoftwareFileDeletionRow) {
	unlinkQuiet(row.file_path);
	try {
		const add = row.additional_files ? (JSON.parse(row.additional_files) as UploadedFileMeta[]) : [];
		for (const f of add) unlinkQuiet(f.path);
	} catch {
		/* ignore */
	}
	try {
		const sup = row.support_files ? (JSON.parse(row.support_files) as UploadedFileMeta[]) : [];
		for (const f of sup) unlinkQuiet(f.path);
	} catch {
		/* ignore */
	}
}

export function deleteSoftwareRow(id: number) {
	getMainDb().delete(software).where(eq(software.id, id)).run();
}

export function deleteAllSoftwareRows(): number {
	const r = sqliteRunResult(getMainDb().delete(software).run());
	return r.changes;
}
