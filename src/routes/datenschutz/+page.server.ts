import { redirect } from '@sveltejs/kit';

import { env } from '$env/dynamic/private';
import { readAppVersion } from '$lib/server/read-app-version';

export const load = async () => {
	const url = env.LEGAL_PRIVACY_URL?.trim();
	if (url) throw redirect(302, url);
	return { appVersion: readAppVersion() };
};
