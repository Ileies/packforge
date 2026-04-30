import { and, desc, eq, max } from 'drizzle-orm';

import { getMainDb } from '../db/main-db';
import { sqliteRunResult } from '../db/sqlite-run-result';
import { scriptCheckpoints, software } from '../schema/main-schema';

export function listCheckpoints(softwareId: number) {
	return getMainDb()
		.select({
			id: scriptCheckpoints.id,
			checkpoint_number: scriptCheckpoints.checkpoint_number,
			name: scriptCheckpoints.name,
			comment: scriptCheckpoints.comment,
			author: scriptCheckpoints.author,
			created_at: scriptCheckpoints.created_at
		})
		.from(scriptCheckpoints)
		.where(eq(scriptCheckpoints.software_id, softwareId))
		.orderBy(desc(scriptCheckpoints.checkpoint_number))
		.all();
}

export function getCheckpointByNumber(softwareId: number, num: number) {
	return getMainDb()
		.select({
			id: scriptCheckpoints.id,
			software_id: scriptCheckpoints.software_id,
			checkpoint_number: scriptCheckpoints.checkpoint_number,
			name: scriptCheckpoints.name,
			generated_script: scriptCheckpoints.generated_script,
			comment: scriptCheckpoints.comment,
			author: scriptCheckpoints.author,
			created_at: scriptCheckpoints.created_at
		})
		.from(scriptCheckpoints)
		.where(and(eq(scriptCheckpoints.software_id, softwareId), eq(scriptCheckpoints.checkpoint_number, num)))
		.get();
}

function nextCheckpointNumber(softwareId: number): number {
	const row = getMainDb()
		.select({ m: max(scriptCheckpoints.checkpoint_number) })
		.from(scriptCheckpoints)
		.where(eq(scriptCheckpoints.software_id, softwareId))
		.get();
	const v = row?.m;
	if (v === null || v === undefined) return 1;
	return v + 1;
}

export function saveCheckpoint(
	softwareId: number,
	generatedScript: string,
	name: string | null,
	comment: string | null,
	author: string | null
): { checkpointId: number; checkpointNumber: number } {
	const db = getMainDb();
	const num = nextCheckpointNumber(softwareId);
	const ins = sqliteRunResult(
		db
			.insert(scriptCheckpoints)
			.values({
				software_id: softwareId,
				checkpoint_number: num,
				name,
				generated_script: generatedScript,
				comment,
				author
			})
			.run()
	);
	db.update(software).set({ generated_script: generatedScript }).where(eq(software.id, softwareId)).run();
	return { checkpointId: Number(ins.lastInsertRowid), checkpointNumber: num };
}

export function restoreCheckpoint(softwareId: number, checkpointNumber: number): void {
	const row = getMainDb()
		.select({ generated_script: scriptCheckpoints.generated_script })
		.from(scriptCheckpoints)
		.where(
			and(
				eq(scriptCheckpoints.software_id, softwareId),
				eq(scriptCheckpoints.checkpoint_number, checkpointNumber)
			)
		)
		.get();
	if (!row) throw new Error('Checkpoint nicht gefunden');
	getMainDb()
		.update(software)
		.set({ generated_script: row.generated_script })
		.where(eq(software.id, softwareId))
		.run();
}
