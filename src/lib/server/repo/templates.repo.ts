import { count, desc, eq, max } from 'drizzle-orm';

import { getMainDb } from '../db/main-db';
import { sqliteRunResult } from '../db/sqlite-run-result';
import { templates } from '../schema/main-schema';

export function getTemplateListRevision() {
	const row = getMainDb()
		.select({
			cnt: count(),
			maxId: max(templates.id),
			maxCreated: max(templates.created_at)
		})
		.from(templates)
		.get();
	return {
		count: Number(row?.cnt ?? 0),
		maxId: Number(row?.maxId ?? 0),
		maxCreated: row?.maxCreated ?? ''
	};
}

export function listTemplateSummaries() {
	return getMainDb()
		.select({
			id: templates.id,
			major_version: templates.major_version,
			minor_version: templates.minor_version,
			created_at: templates.created_at
		})
		.from(templates)
		.orderBy(desc(templates.created_at))
		.all();
}

export function getTemplateById(id: number) {
	return getMainDb()
		.select({
			id: templates.id,
			content: templates.content,
			major_version: templates.major_version,
			minor_version: templates.minor_version,
			created_at: templates.created_at
		})
		.from(templates)
		.where(eq(templates.id, id))
		.get();
}

/** Ohne `content` (für `GET …?view=summary`). */
export function getTemplateSummaryById(id: number) {
	return getMainDb()
		.select({
			id: templates.id,
			major_version: templates.major_version,
			minor_version: templates.minor_version,
			created_at: templates.created_at
		})
		.from(templates)
		.where(eq(templates.id, id))
		.get();
}

export function getNextMinorVersion(major: number): number {
	const row = getMainDb()
		.select({ m: max(templates.minor_version) })
		.from(templates)
		.where(eq(templates.major_version, major))
		.get();
	const v = row?.m;
	if (v === null || v === undefined) return 0;
	return v + 1;
}

export function insertTemplate(content: string, major: number, minor: number) {
	const r = sqliteRunResult(
		getMainDb().insert(templates).values({ content, major_version: major, minor_version: minor }).run()
	);
	return Number(r.lastInsertRowid);
}

export function deleteAllTemplates(): number {
	return sqliteRunResult(getMainDb().delete(templates).run()).changes;
}
