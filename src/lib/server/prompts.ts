import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { appLog } from '$lib/server/app-log';

import { promptsDir } from './paths';

const cache: Record<string, string | null> = {};

function loadFile(name: string): string | null {
	const p = join(promptsDir(), name);
	if (!existsSync(p)) {
		appLog.warn(`Prompt fehlt: ${name}`);
		return null;
	}
	try {
		return readFileSync(p, 'utf-8');
	} catch (e) {
		appLog.error(`Prompt lesen fehlgeschlagen ${name}:`, e);
		return null;
	}
}

export function initPrompts(): void {
	cache['script-optimization'] = loadFile('script-optimization.txt');
	cache['script-fix'] = loadFile('script-fix.txt');
	cache['enrichment'] = loadFile('enrichment.txt');
}

export function getPrompt(name: string): string | null {
	return cache[name] ?? null;
}
