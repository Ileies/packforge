#!/usr/bin/env node
/**
 * Optional nach `vite build`: größtes Client-Chunk gegen Budget prüfen.
 * Aufruf: `bun run budget` oder MAX_CHUNK_KB=600 bun scripts/check-bundle-budget.mjs (Node: `node …` weiter möglich).
 */
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const chunksDir = join(process.cwd(), '.svelte-kit/output/client/_app/immutable/chunks');
const maxBytes = (Number(process.env.MAX_CHUNK_KB) || 520) * 1024;

try {
	const names = readdirSync(chunksDir).filter((f) => f.endsWith('.js'));
	let largest = { name: '', size: 0 };
	for (const name of names) {
		const size = statSync(join(chunksDir, name)).size;
		if (size > largest.size) largest = { name, size };
	}
	if (!largest.name) {
		console.error(
			'check-bundle-budget: keine Chunks unter .svelte-kit/output/client/_app/immutable/chunks — zuerst `bun run build` ausführen.'
		);
		process.exit(1);
	}
	if (largest.size > maxBytes) {
		console.error(
			`Bundle-Budget überschritten: ${largest.name} = ${Math.round(largest.size / 1024)} KiB (Limit ${Math.round(maxBytes / 1024)} KiB)`
		);
		process.exit(1);
	}
	console.log(
		`Bundle OK: größtes Chunk ${largest.name} = ${Math.round(largest.size / 1024)} KiB (Limit ${Math.round(maxBytes / 1024)} KiB)`
	);
	process.exit(0);
} catch (e) {
	console.error('check-bundle-budget:', e instanceof Error ? e.message : e);
	process.exit(1);
}
