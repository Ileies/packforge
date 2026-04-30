import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let cached: string | null = null;

/** Versionsfeld aus `package.json` (Build-/Runtime-Prozess-CWD). */
export function readAppVersion(): string {
	if (cached !== null) return cached;
	try {
		const p = join(process.cwd(), 'package.json');
		const j = JSON.parse(readFileSync(p, 'utf-8')) as { version?: string };
		cached = j.version ?? '0.0.0';
	} catch {
		cached = '0.0.0';
	}
	return cached;
}
