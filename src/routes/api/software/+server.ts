import { createHash } from 'node:crypto';
import { extname, join } from 'node:path';

import { mkdirRecursive, writeBytesToFile } from '$lib/server/async-write-file';
import { forbiddenWithoutPermission, requireSessionApi } from '$lib/server/auth/api-route-guards';
import {
	assertInstallerSignature,
	assertOptionalUploadedFileSignature,
	FileSignatureError
} from '$lib/server/file-signature';
import { jsonWithConditionalGet, weakEtagFromParts } from '$lib/server/http/conditional-get';
import { badRequest, conflict } from '$lib/server/http/errors';
import { json } from '$lib/server/http/json';
import { looseJsonObjectFromFormEntry } from '$lib/server/http/loose-json-object-from-form-entry';
import { uploadsDir } from '$lib/server/paths';
import * as formfieldsRepo from '$lib/server/repo/formfields.repo';
import type { UploadedFileMeta } from '$lib/server/repo/software.repo';
import * as softwareRepo from '$lib/server/repo/software.repo';
import {
	assertFileSizeWithinLimit,
	maxMultipartRequestBytes,
	maxUploadBytesPerFile,
	UploadTooLargeError
} from '$lib/server/upload-limits';
import { applyVendorSanitizeToFormData } from '$lib/server/vendor-normalize';
import { parseContentLengthHeader } from '$lib/shared/json-limit';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, request, locals }) => {
	const session = await requireSessionApi(request, locals);
	if (!session.ok) return session.response;
	const deniedLib = forbiddenWithoutPermission(
		session.user,
		'VIEW_SOFTWARE_LIBRARY',
		'Keine Berechtigung für die Software-Bibliothek.',
		'PF_SOFTWARE_LIBRARY_FORBIDDEN'
	);
	if (deniedLib) return deniedLib;

	const rev = softwareRepo.getSoftwareTableRevision();
	const limitRaw = url.searchParams.get('limit');
	if (limitRaw === null) {
		const data = softwareRepo.listSoftwareSummaries();
		const etag = weakEtagFromParts('software-summaries-all', [rev.count, rev.maxId, rev.maxUpdated]);
		return jsonWithConditionalGet(request, data, {
			etag,
			cacheControl: 'private, max-age=0, must-revalidate',
			varyCookie: true
		});
	}
	const limit = Math.min(Math.max(Number(limitRaw) || 24, 1), 100);
	const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0);
	const search = url.searchParams.get('search') ?? '';
	const sort = url.searchParams.get('sort') ?? 'name_asc';
	const total = softwareRepo.countSoftwareSummariesFiltered(search);
	const items = softwareRepo.listSoftwareSummariesPaged({ search, sort, limit, offset });
	const etag = weakEtagFromParts('software-summaries-paged', [
		rev.count,
		rev.maxId,
		rev.maxUpdated,
		search,
		sort,
		limit,
		offset,
		total
	]);
	return jsonWithConditionalGet(
		request,
		{ total, items },
		{
			etag,
			cacheControl: 'private, max-age=0, must-revalidate',
			varyCookie: true
		}
	);
};

async function collectFiles(
	fd: FormData,
	key: string,
	subdir: string,
	maxBytes: number
): Promise<UploadedFileMeta[]> {
	const list = fd.getAll(key);
	const out: UploadedFileMeta[] = [];
	for (const item of list) {
		if (!(item instanceof File) || item.size === 0) continue;
		assertFileSizeWithinLimit(item.name, item.size, maxBytes);
		const buf = Buffer.from(await item.arrayBuffer());
		assertOptionalUploadedFileSignature(buf, item.name);
		const safeName = `${Date.now()}-${item.name.replace(/[^\w.\-()+ ]/g, '_')}`;
		const dir = join(uploadsDir(), subdir);
		await mkdirRecursive(dir);
		const dest = join(dir, safeName);
		await writeBytesToFile(dest, buf);
		const rel =
			typeof (item as File & { webkitRelativePath?: string }).webkitRelativePath === 'string' &&
			(item as File & { webkitRelativePath?: string }).webkitRelativePath
				? (item as File & { webkitRelativePath: string }).webkitRelativePath
				: item.name;
		out.push({
			originalName: item.name,
			path: dest,
			size: buf.length,
			relativePath: rel.replace(/\\/g, '/')
		});
	}
	return out;
}

async function handleSoftwareMultipartPost(request: Request): Promise<Response> {
	const ct = request.headers.get('content-type') || '';
	if (!ct.includes('multipart/form-data')) {
		return badRequest('Erwartet: multipart/form-data', 'PF_EXPECT_MULTIPART');
	}
	const multipartMax = maxMultipartRequestBytes();
	const cl = parseContentLengthHeader(request.headers.get('content-length'));
	if (cl !== null && cl > multipartMax) {
		return badRequest(
			`Die gesamte Multipart-Anfrage ist zu groß (höchstens etwa ${Math.round(multipartMax / (1024 * 1024))} MiB).`,
			'PF_MULTIPART_BODY_TOO_LARGE'
		);
	}
	const maxBytes = maxUploadBytesPerFile();
	const fd = await request.formData();
	const main = fd.get('file');
	if (!(main instanceof File)) return badRequest('Haupt-Setup-Datei fehlt.', 'PF_MAIN_FILE_REQUIRED');
	const ext = extname(main.name).toLowerCase();
	if (ext !== '.exe' && ext !== '.msi') {
		return badRequest('Setup-Datei: nur .exe und .msi erlaubt.', 'PF_INSTALLER_EXTENSION');
	}
	try {
		assertFileSizeWithinLimit(main.name, main.size, maxBytes);
	} catch (e) {
		if (e instanceof UploadTooLargeError) return badRequest(e.message, 'PF_UPLOAD_TOO_LARGE');
		throw e;
	}

	let buf: Buffer;
	try {
		buf = Buffer.from(await main.arrayBuffer());
		assertInstallerSignature(buf);
	} catch (e) {
		if (e instanceof FileSignatureError) return badRequest(e.message, 'PF_FILE_SIGNATURE');
		throw e;
	}

	const name = String(fd.get('name') || '').trim();
	const generatedScript = String(fd.get('generatedScript') || '');
	if (!name || !generatedScript)
		return badRequest('Name und generiertes Skript sind Pflicht.', 'PF_NAME_SCRIPT_REQUIRED');

	const version = String(fd.get('version') || '').trim();

	const installerSha256 = createHash('sha256').update(buf).digest('hex');
	const existingId = softwareRepo.findConflictingSoftwareIdForNewUpload(name, version, installerSha256);
	if (existingId !== undefined) {
		return conflict(
			'Bereits ein Eintrag mit diesem Namen, dieser Version und derselben Installer-Datei (SHA-256). Bei anderem Setup bitte Version oder Namen anpassen — oder den bestehenden Eintrag im Editor öffnen.',
			{ conflictSoftwareId: existingId }
		);
	}

	const dest = join(uploadsDir(), `${Date.now()}-${main.name}`);
	await writeBytesToFile(dest, buf);
	const templateIdRaw = fd.get('templateId');
	const templateId = templateIdRaw ? Number(templateIdRaw) : null;
	let formData: unknown = looseJsonObjectFromFormEntry(fd.get('formData'));
	formData = applyVendorSanitizeToFormData(formData, formfieldsRepo.listVendorFormfieldLabels());

	let additionalFiles: UploadedFileMeta[];
	let supportFiles: UploadedFileMeta[];
	try {
		additionalFiles = await collectFiles(fd, 'additional', 'additional', maxBytes);
		supportFiles = await collectFiles(fd, 'support', 'support', maxBytes);
	} catch (e) {
		if (e instanceof FileSignatureError) return badRequest(e.message, 'PF_FILE_SIGNATURE');
		if (e instanceof UploadTooLargeError) return badRequest(e.message, 'PF_UPLOAD_TOO_LARGE');
		throw e;
	}

	const id = softwareRepo.insertSoftwareWithInitialCheckpoint(
		name,
		version,
		main.name,
		dest,
		installerSha256,
		buf.length,
		formData,
		generatedScript,
		templateId,
		additionalFiles,
		supportFiles
	);
	return json({ success: true, id });
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await requireSessionApi(request, locals);
	if (!session.ok) return session.response;
	const deniedCreate = forbiddenWithoutPermission(
		session.user,
		'CREATE_SCRIPTS',
		'Keine Berechtigung für das Anlegen von Software oder Skripten.',
		'PF_CREATE_SCRIPTS_FORBIDDEN'
	);
	if (deniedCreate) return deniedCreate;

	return handleSoftwareMultipartPost(request);
};
