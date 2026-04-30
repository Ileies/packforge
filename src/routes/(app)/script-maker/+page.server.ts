import * as formfieldsRepo from '$lib/server/repo/formfields.repo';
import * as templatesRepo from '$lib/server/repo/templates.repo';
import { initialFormDataObjectFromFormfieldRows } from '$lib/server/software-initial-form-data';
import { maxUploadBytesPerFile } from '$lib/server/upload-limits';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const rows = templatesRepo.listTemplateSummaries();
	const templateSummaries = rows.map(({ id, major_version, minor_version }) => ({
		id,
		major_version,
		minor_version
	}));
	const formRows = formfieldsRepo.listFormfields();
	const initialFormData = initialFormDataObjectFromFormfieldRows(formRows);
	const initialFormDataJson = JSON.stringify(initialFormData, null, 2);
	return {
		maxUploadBytesPerFile: maxUploadBytesPerFile(),
		templateSummaries,
		initialFormDataJson,
		/** Anzahl der Felder im vorbelegten Stammdaten-JSON (ohne Spacer-Felder), für Transparenz in der UI */
		stammdatenKeyCount: Object.keys(initialFormData).length
	};
};
