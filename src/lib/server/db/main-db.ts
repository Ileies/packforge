import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';

import { mainDbPath } from '../paths';
import * as schema from '../schema/main-schema';
import { applyMainMigrations } from './run-sqlite-migrations';

export type MainDb = ReturnType<typeof drizzle<typeof schema>>;

let _raw: Database | null = null;
let _db: MainDb | null = null;

function ensureDirForDb(path: string) {
	const d = dirname(path);
	if (!existsSync(d)) mkdirSync(d, { recursive: true });
}

/** Öffnet die Haupt-DB und wendet ausstehende SQL-Migrationen an (`drizzle/main`). Optional: `bun run db:push` für schnelles Dev-Sync. */
export function getMainDb(): MainDb {
	if (_db) return _db;
	const path = mainDbPath();
	ensureDirForDb(path);
	_raw = new Database(path);
	_raw.run('PRAGMA foreign_keys = ON');
	_db = drizzle({ client: _raw, schema });
	applyMainMigrations(_db);
	return _db;
}

export function getMainRaw(): Database {
	return getMainDb().$client;
}
