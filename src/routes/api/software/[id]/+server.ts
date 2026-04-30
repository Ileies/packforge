import z from 'zod';

import {
	forbiddenUnlessAnyPermission,
	forbiddenWithoutPermission,
	requireSessionApi
} from '$lib/server/auth/api-route-guards';
import { resolveDetailView } from '$lib/server/http/detail-view';
import { notFound } from '$lib/server/http/errors';
import { json } from '$lib/server/http/json';
import { parseRequestJson } from '$lib/server/http/parse-request-json';
import * as formfieldsRepo from '$lib/server/repo/formfields.repo';
import * as softwareRepo from '$lib/server/repo/software.repo';
import { applyVendorSanitizeToFormData } from '$lib/server/vendor-normalize';

import type { RequestHandler } from './$types';

const putBodySchema = z.object({
	name: z.string().min(1, 'Name ist erforderlich.'),
	generatedScript: z.string().min(1, 'Skriptinhalt ist erforderlich.'),
	version: z.union([z.string(), z.number()]).optional(),
	formData: z.unknown().optional()
});

export const GET: RequestHandler = async ({ params, url, request, locals }) => {
	const session = await requireSessionApi(request, locals);
	if (!session.ok) return session.response;
	const deniedLib = forbiddenWithoutPermission(
		session.user,
		'VIEW_SOFTWARE_LIBRARY',
		'Keine Berechtigung für die Software-Bibliothek.',
		'PF_SOFTWARE_LIBRARY_FORBIDDEN'
	);
	if (deniedLib) return deniedLib;

	const parsedView = resolveDetailView(url);
	if (!parsedView.ok) return parsedView.response;
	const id = Number(params.id);
	const row =
		parsedView.view === 'summary'
			? softwareRepo.getSoftwareByIdSummary(id)
			: softwareRepo.getSoftwareById(id);
	if (!row) return notFound('Software nicht gefunden.', 'PF_SOFTWARE_NOT_FOUND');
	return json(row);
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const session = await requireSessionApi(request, locals);
	if (!session.ok) return session.response;
	const deniedEdit = forbiddenUnlessAnyPermission(
		session.user,
		['EDIT_ALL_SCRIPTS', 'EDIT_OWN_SCRIPTS'],
		'Keine Berechtigung für die Bearbeitung von Skripten.',
		'PF_SCRIPT_EDIT_FORBIDDEN'
	);
	if (deniedEdit) return deniedEdit;

	const id = Number(params.id);
	const parsed = await parseRequestJson(request, putBodySchema);
	if (!parsed.ok) return parsed.response;
	const body = parsed.data;
	const { name, generatedScript } = body;
	const formData = applyVendorSanitizeToFormData(body.formData, formfieldsRepo.listVendorFormfieldLabels());
	softwareRepo.updateSoftware(id, name, String(body.version ?? ''), formData, generatedScript);
	return json({ success: true });
};

export const DELETE: RequestHandler = async ({ params, request, locals }) => {
	const session = await requireSessionApi(request, locals);
	if (!session.ok) return session.response;
	const deniedDel = forbiddenWithoutPermission(
		session.user,
		'EDIT_ALL_SCRIPTS',
		'Keine Berechtigung für das Löschen von Software-Einträgen.',
		'PF_SOFTWARE_DELETE_FORBIDDEN'
	);
	if (deniedDel) return deniedDel;

	const id = Number(params.id);
	const row = softwareRepo.getSoftwareByIdForFileDeletion(id);
	if (!row) return notFound('Software nicht gefunden.', 'PF_SOFTWARE_NOT_FOUND');
	softwareRepo.deleteSoftwareFiles(row);
	softwareRepo.deleteSoftwareRow(id);
	return json({ success: true });
};
