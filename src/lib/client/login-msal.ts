import { initMsal, loginPopup } from '$lib/client/msal-browser';

export type AzureAuthPublicConfig = {
	clientId: string;
	authority: string;
	redirectUri?: string;
};

/** MSAL-Popup; liefert das Roh-Token für `POST /api/auth/login`. */
export async function acquireMicrosoftIdToken(
	cfg: AzureAuthPublicConfig
): Promise<{ token: string } | { error: string }> {
	if (!cfg.clientId) {
		return { error: 'Entra ist nicht konfiguriert (AZURE_CLIENT_ID).' };
	}
	try {
		await initMsal({
			clientId: cfg.clientId,
			authority: cfg.authority,
			redirectUri: cfg.redirectUri || window.location.origin + '/login'
		});
		const ar = await loginPopup();
		const token = ar.idToken || ar.accessToken;
		if (!token) return { error: 'Kein Token von MSAL.' };
		return { token };
	} catch (e) {
		return { error: e instanceof Error ? e.message : 'Fehler' };
	}
}
