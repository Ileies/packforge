import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';

import { packagesDbPath } from '../paths';
import * as schema from '../schema/packages';
import { ensurePackagesSearchFts } from './packages-search-fts';
import { applyPackagesMigrations } from './run-sqlite-migrations';

export type PackagesDb = ReturnType<typeof drizzle<typeof schema>>;

let _raw: Database | null = null;
let _db: PackagesDb | null = null;

function ensureDir(path: string) {
	const d = dirname(path);
	if (!existsSync(d)) mkdirSync(d, { recursive: true });
}

/** Öffnet die Paket-DB, wendet Migrationen an (`drizzle/packages`), dann FTS-Hilfstabellen. */
export function getPackagesDb(): PackagesDb {
	if (_db) return _db;
	const path = packagesDbPath();
	ensureDir(path);
	_raw = new Database(path);
	_raw.run('PRAGMA foreign_keys = ON');
	_db = drizzle({ client: _raw, schema });
	applyPackagesMigrations(_db);
	ensurePackagesSearchFts(_raw);
	return _db;
}

export function getPackagesSqlite(): Database {
	return getPackagesDb().$client;
}
