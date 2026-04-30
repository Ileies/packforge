import { type AuthenticationResult, type Configuration, PublicClientApplication } from '@azure/msal-browser';

let pca: PublicClientApplication | null = null;

export async function initMsal(cfg: { clientId: string; authority: string; redirectUri: string }) {
	if (pca) return pca;
	const config: Configuration = {
		auth: {
			clientId: cfg.clientId,
			authority: cfg.authority,
			redirectUri: cfg.redirectUri
		},
		cache: { cacheLocation: 'localStorage' }
	};
	pca = new PublicClientApplication(config);
	await pca.initialize();
	return pca;
}

export async function loginPopup(): Promise<AuthenticationResult> {
	if (!pca) throw new Error('MSAL not initialized');
	return pca.loginPopup({ scopes: ['openid', 'profile', 'email'] });
}
