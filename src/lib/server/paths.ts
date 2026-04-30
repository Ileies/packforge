import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { env } from '$env/dynamic/private';

import { pathsFromRoot, resolveDataRoot } from './paths-core';

/** Projekt-Daten unter `<cwd>/data` (überschreibbar mit `DATA_ROOT`). */
export function getDataRoot(): string {
	return resolveDataRoot(process.cwd(), env.DATA_ROOT ?? null);
}

export function mainDbPath(): string {
	return env.MAIN_DB_PATH ?? pathsFromRoot(getDataRoot()).mainDb;
}

export function packagesDbPath(): string {
	return env.PACKAGES_DB_PATH ?? pathsFromRoot(getDataRoot()).packagesDb;
}

export function uploadsDir(): string {
	const dir = env.UPLOADS_DIR ?? pathsFromRoot(getDataRoot()).uploads;
	if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
	return dir;
}

export function psadtTemplateDir(): string {
	return join(getDataRoot(), 'templates', '1.0');
}

export function promptsDir(): string {
	return join(getDataRoot(), 'prompts');
}
