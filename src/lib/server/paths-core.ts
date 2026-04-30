import { join, resolve } from 'node:path';

/** Reiner Pfad-Resolver (ohne Svelte-Env), für Tests und `paths.ts`. */
export function resolveDataRoot(cwd: string, envOverride?: string | null): string {
	if (envOverride) return resolve(envOverride);
	return resolve(cwd, 'data');
}

export function pathsFromRoot(dataRoot: string) {
	return {
		mainDb: join(dataRoot, 'database', 'packforge.db'),
		packagesDb: join(dataRoot, 'database', 'packages.db'),
		uploads: join(dataRoot, 'uploads'),
		psadtTemplate: join(dataRoot, 'templates', '1.0'),
		prompts: join(dataRoot, 'prompts')
	};
}
