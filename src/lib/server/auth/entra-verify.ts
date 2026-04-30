import { createRemoteJWKSet, jwtVerify } from 'jose';

import { env } from '$env/dynamic/private';
import { appLog } from '$lib/server/app-log';

import type { EntraClaims } from './entra-user';

function tenant(): string {
	return env.AZURE_TENANT_ID || 'common';
}

function clientId(): string {
	return env.AZURE_CLIENT_ID || '';
}

const jwks = () =>
	createRemoteJWKSet(new URL(`https://login.microsoftonline.com/${tenant()}/discovery/v2.0/keys`));

export async function validateEntraToken(token: string): Promise<EntraClaims | null> {
	try {
		const { payload } = await jwtVerify(token, jwks(), {
			audience: clientId() || undefined,
			issuer: [
				`https://login.microsoftonline.com/${env.AZURE_TENANT_ID || 'common'}/v2.0`,
				`https://sts.windows.net/${env.AZURE_TENANT_ID || 'common'}/`,
				'https://login.microsoftonline.com/common/v2.0'
			]
		});
		return payload as EntraClaims;
	} catch (e) {
		appLog.error('Entra jwtVerify:', e);
		return null;
	}
}
