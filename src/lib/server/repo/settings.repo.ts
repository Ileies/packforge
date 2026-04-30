import { eq, sql } from 'drizzle-orm';

import { getMainDb } from '../db/main-db';
import { systemSettings } from '../schema/main-schema';

export function getSetting(key: string): string | null {
	const row = getMainDb()
		.select({ value: systemSettings.value })
		.from(systemSettings)
		.where(eq(systemSettings.key, key))
		.get();
	return row?.value ?? null;
}

export function setSetting(key: string, value: string) {
	getMainDb()
		.insert(systemSettings)
		.values({ key, value })
		.onConflictDoUpdate({
			target: systemSettings.key,
			set: { value, updated_at: sql`(datetime('now', 'localtime'))` }
		})
		.run();
}
