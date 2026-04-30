import { mkdir, writeFile } from 'node:fs/promises';

type BunGlobal = { write?: (path: string, data: Buffer | Uint8Array | string) => Promise<number> };

/** Rekursives `mkdir` ohne blockierendes `mkdirSync`. */
export async function mkdirRecursive(dir: string): Promise<void> {
	await mkdir(dir, { recursive: true });
}

/**
 * Dateiinhalt schreiben: unter Bun `Bun.write`, sonst `fs.promises.writeFile`
 * (reiner Node-Adapter, kein blockierendes `*Sync` im Request-Pfad).
 */
export async function writeBytesToFile(dest: string, data: Buffer | Uint8Array): Promise<void> {
	const bun = (globalThis as { Bun?: BunGlobal }).Bun;
	if (typeof bun?.write === 'function') {
		await bun.write(dest, data);
		return;
	}
	await writeFile(dest, data);
}
