import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { PassThrough, type Readable } from 'node:stream';

import archiver from 'archiver';

import { getDataRoot, mainDbPath, packagesDbPath, promptsDir, psadtTemplateDir, uploadsDir } from './paths';
import { readAppVersion } from './read-app-version';

function readManifestMeta(): { product: string; version: string } {
	try {
		const p = join(process.cwd(), 'package.json');
		const j = JSON.parse(readFileSync(p, 'utf-8')) as { name?: string; version?: string };
		return { product: j.name ?? 'packforge', version: j.version ?? readAppVersion() };
	} catch {
		return { product: 'packforge', version: readAppVersion() };
	}
}

/**
 * ZIP-Stream mit Datenbankdateien, Uploads, PSADT-Vorlagen und Prompts unter dem konfigurierten Datenpfad.
 * Hinweis: Bei laufendem Betrieb können SQLite-Kopien kurz inkonsistent sein — Export idealerweise bei geringer Last.
 */
export function createInstanceExportStream(): Readable {
	const pass = new PassThrough();
	const archive = archiver('zip', { zlib: { level: 6 } });
	archive.on('error', (err: Error) => pass.destroy(err));
	archive.pipe(pass);

	void (async () => {
		try {
			const meta = readManifestMeta();
			const root = getDataRoot();
			const manifest = {
				exportedAt: new Date().toISOString(),
				product: meta.product,
				version: meta.version,
				dataRoot: root,
				warning:
					'SQLite-Dateien sind Kopien zum Zeitpunkt des Exports; bei parallelen Schreibzugriffen kann eine erneute Kopie sinnvoll sein.'
			};
			archive.append(JSON.stringify(manifest, null, 2), { name: 'packforge-export-manifest.json' });

			const main = mainDbPath();
			if (existsSync(main)) {
				archive.append(createReadStream(main), { name: `database/${basename(main)}` });
			}

			const pkgDb = packagesDbPath();
			if (existsSync(pkgDb)) {
				archive.append(createReadStream(pkgDb), { name: `database/${basename(pkgDb)}` });
			}

			const uploads = uploadsDir();
			if (existsSync(uploads)) {
				archive.directory(uploads, 'uploads');
			}

			const tmpl = psadtTemplateDir();
			if (existsSync(tmpl)) {
				archive.directory(tmpl, 'templates/psadt-default');
			}

			const prompts = promptsDir();
			if (existsSync(prompts)) {
				archive.directory(prompts, 'prompts');
			}

			await archive.finalize();
		} catch (e) {
			pass.destroy(e instanceof Error ? e : new Error(String(e)));
		}
	})();

	return pass;
}
