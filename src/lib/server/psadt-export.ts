import { existsSync } from 'node:fs';
import { PassThrough } from 'node:stream';
import { Readable } from 'node:stream';

import archiver from 'archiver';

import { psadtTemplateDir } from './paths';
import type { SoftwarePsadtExportRow, UploadedFileMeta } from './repo/software.repo';
import { safeZipArchiveRelativePath } from './zip-entry-safe';

export function buildPsadtZipResponse(software: SoftwarePsadtExportRow): Response {
	const templateDir = psadtTemplateDir();
	if (!existsSync(templateDir)) throw new Error('Vorlagenverzeichnis nicht gefunden');
	if (!existsSync(software.file_path)) throw new Error('Setup-Datei nicht gefunden');

	const additionalFiles: UploadedFileMeta[] = software.additional_files
		? JSON.parse(software.additional_files)
		: [];
	const supportFiles: UploadedFileMeta[] = software.support_files ? JSON.parse(software.support_files) : [];

	const packageName = `${software.name}_${software.version || '1.0'}`.replace(/[^a-zA-Z0-9_-]/g, '_');
	const filename = `${packageName}_PSADT.zip`;

	const pass = new PassThrough();
	const archive = archiver('zip', { zlib: { level: 9 } });
	archive.on('error', (err) => pass.destroy(err));
	archive.pipe(pass);

	archive.glob('**/*', {
		cwd: templateDir,
		ignore: ['Invoke-AppDeployToolkit.ps1', '**/.DS_Store', '**/Thumbs.db']
	});
	archive.append(software.generated_script, { name: 'Invoke-AppDeployToolkit.ps1' });
	archive.file(software.file_path, { name: `Files/${software.file_name}` });
	for (const file of additionalFiles) {
		if (!existsSync(file.path)) continue;
		const inner = safeZipArchiveRelativePath(file.relativePath || file.originalName);
		if (!inner) continue;
		archive.file(file.path, { name: `Files/${inner}` });
	}
	for (const file of supportFiles) {
		if (!existsSync(file.path)) continue;
		const inner = safeZipArchiveRelativePath(file.relativePath || file.originalName);
		if (!inner) continue;
		archive.file(file.path, { name: `SupportFiles/${inner}` });
	}
	void archive.finalize();

	return new Response(Readable.toWeb(pass) as unknown as ReadableStream, {
		headers: {
			'Content-Type': 'application/zip',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
}
