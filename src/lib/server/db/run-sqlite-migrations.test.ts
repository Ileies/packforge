import { existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { describe, expect, it } from 'vitest';

import * as mainSchema from '../schema/main-schema';
import * as packagesSchema from '../schema/packages';
import {
	applyMainMigrations,
	applyPackagesMigrations,
	mainMigrationsFolder,
	packagesMigrationsFolder
} from './run-sqlite-migrations';

const folderMain = mainMigrationsFolder();

describe('run-sqlite-migrations (Haupt-DB)', () => {
	it('wendet initiale Migration auf leere SQLite-Datei an', () => {
		const path = join(process.cwd(), 'data', 'database', 'vitest-migrate-empty.db');
		try {
			if (existsSync(path)) unlinkSync(path);
		} catch {
			/* ignore */
		}
		const raw = new Database(path);
		raw.run('PRAGMA foreign_keys = ON');
		const db = drizzle({ client: raw, schema: mainSchema });
		applyMainMigrations(db);
		const row = raw
			.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'system_settings' LIMIT 1")
			.get();
		expect(row).toBeTruthy();
		const m = raw.prepare('SELECT COUNT(*) AS c FROM __drizzle_migrations').get() as { c: number };
		expect(m.c).toBe(1);
		raw.close();
		unlinkSync(path);
	});

	it('baseline: push-DB ohne Journal erhält nur Stempel, zweites migrate ist idempotent', () => {
		const path = join(process.cwd(), 'data', 'database', 'vitest-migrate-baseline.db');
		try {
			if (existsSync(path)) unlinkSync(path);
		} catch {
			/* ignore */
		}
		const raw = new Database(path);
		raw.run('PRAGMA foreign_keys = ON');
		raw.exec(`CREATE TABLE system_settings (
			key text PRIMARY KEY,
			value text NOT NULL,
			updated_at text DEFAULT (datetime('now', 'localtime'))
		);`);
		const db = drizzle({ client: raw, schema: mainSchema });
		applyMainMigrations(db);
		const m = raw.prepare('SELECT COUNT(*) AS c FROM __drizzle_migrations').get() as { c: number };
		expect(m.c).toBe(1);
		migrate(db, { migrationsFolder: folderMain });
		const m2 = raw.prepare('SELECT COUNT(*) AS c FROM __drizzle_migrations').get() as { c: number };
		expect(m2.c).toBe(1);
		raw.close();
		unlinkSync(path);
	});
});

describe('run-sqlite-migrations (Paket-DB)', () => {
	it('wendet initiale Migration auf leere Datei an', () => {
		const path = join(process.cwd(), 'data', 'database', 'vitest-migrate-packages.db');
		try {
			if (existsSync(path)) unlinkSync(path);
		} catch {
			/* ignore */
		}
		const raw = new Database(path);
		raw.run('PRAGMA foreign_keys = ON');
		const db = drizzle({ client: raw, schema: packagesSchema });
		applyPackagesMigrations(db);
		const row = raw
			.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'packages' LIMIT 1")
			.get();
		expect(row).toBeTruthy();
		migrate(db, { migrationsFolder: packagesMigrationsFolder() });
		raw.close();
		unlinkSync(path);
	});
});
