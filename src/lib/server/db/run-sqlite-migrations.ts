import { existsSync } from 'node:fs';
import { join } from 'node:path';

import type { Database } from 'bun:sqlite';
import type { SQLiteBunDatabase } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { readMigrationFiles } from 'drizzle-orm/migrator';

import * as mainSchema from '../schema/main-schema';
import * as packagesSchema from '../schema/packages';

/** Relativ zu `process.cwd()` (Deploy-Root muss `drizzle/` enthalten). */
export function mainMigrationsFolder(): string {
	return join(process.cwd(), 'drizzle', 'main');
}

export function packagesMigrationsFolder(): string {
	return join(process.cwd(), 'drizzle', 'packages');
}

type InitMigrateConfig = { migrationsFolder: string; init: true };

function migrationJournalRowCount(raw: Database): number {
	const t = raw
		.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = '__drizzle_migrations' LIMIT 1")
		.get() as { 1: number } | undefined;
	if (!t) return 0;
	const r = raw.prepare('SELECT COUNT(*) AS c FROM __drizzle_migrations').get() as { c: number };
	return r.c;
}

/** DB wurde mit `drizzle-kit push` betrieben: App-Tabellen da, aber noch kein Journal-Eintrag. */
function legacyMainPushWithoutJournal(raw: Database): boolean {
	const app = raw
		.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'system_settings' LIMIT 1")
		.get();
	if (!app) return false;
	return migrationJournalRowCount(raw) === 0;
}

function legacyPackagesPushWithoutJournal(raw: Database): boolean {
	const app = raw
		.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'packages' LIMIT 1")
		.get();
	if (!app) return false;
	return migrationJournalRowCount(raw) === 0;
}

function runMigrateOrBaseline(
	db: SQLiteBunDatabase<Record<string, unknown>>,
	folder: string,
	legacyPushWithoutJournal: (raw: Database) => boolean
): void {
	if (!existsSync(folder)) {
		throw new Error(
			`Migrations-Ordner fehlt: ${folder}. Arbeitsverzeichnis muss das Repo- bzw. Deploy-Root mit Unterordner drizzle/ sein.`
		);
	}
	const raw = (db as unknown as { $client: Database }).$client;
	const locals = readMigrationFiles({ migrationsFolder: folder });
	if (legacyPushWithoutJournal(raw)) {
		if (locals.length === 1) {
			const r = migrate(db, { migrationsFolder: folder, init: true } as InitMigrateConfig);
			if (r && typeof r === 'object' && 'exitCode' in r) {
				throw new Error(
					`Migration-Baseline fehlgeschlagen: ${String((r as { exitCode: unknown }).exitCode)}`
				);
			}
			return;
		}
		throw new Error(
			'Datenbank stammt von drizzle push ohne Migrations-Journal; im Repo liegen mehrere Migrationen. ' +
				'Schema mit Administrator abstimmen (manuelles Baseline oder einheitlich Migrationen anwenden).'
		);
	}
	migrate(db, { migrationsFolder: folder });
}

export function applyMainMigrations(db: SQLiteBunDatabase<typeof mainSchema>): void {
	runMigrateOrBaseline(
		db as SQLiteBunDatabase<Record<string, unknown>>,
		mainMigrationsFolder(),
		legacyMainPushWithoutJournal
	);
}

export function applyPackagesMigrations(db: SQLiteBunDatabase<typeof packagesSchema>): void {
	runMigrateOrBaseline(
		db as SQLiteBunDatabase<Record<string, unknown>>,
		packagesMigrationsFolder(),
		legacyPackagesPushWithoutJournal
	);
}
