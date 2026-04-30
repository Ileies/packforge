import z from 'zod';

import { env } from '$env/dynamic/private';

const DEV_JWT_PLACEHOLDER = 'dev-secret-change-in-production';

function allowDevLoginEnvIsExplicitlyOn(raw: string | undefined): boolean {
	const v = raw?.trim().toLowerCase();
	return v === 'true' || v === '1' || v === 'yes';
}

function authEntraOptionalInProduction(raw: string | undefined): boolean {
	const v = raw?.trim().toLowerCase();
	return v === 'true' || v === '1' || v === 'yes';
}

/** Azure App (Client)-ID / Verzeichnis (Tenant)-ID: typischerweise GUID. */
const AZURE_GUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function isLocalHostish(hostname: string): boolean {
	const h = hostname.toLowerCase();
	return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h.endsWith('.localhost');
}

/** Nur für Tests: gleiche Regeln wie `assertValidPrivateEnv`. */
export const privateEnvSchema = z
	.object({
		NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
		JWT_SECRET: z.string().optional(),
		ALLOW_DEV_LOGIN: z.string().optional(),
		DEV_LOGIN_PASSWORD: z.string().optional(),
		COOKIE_INSECURE: z.string().optional(),
		AUTH_ENTRA_OPTIONAL_IN_PRODUCTION: z.string().optional(),
		AZURE_CLIENT_ID: z.string().optional(),
		AZURE_TENANT_ID: z.string().optional(),
		AZURE_REDIRECT_URI: z.string().optional()
	})
	.superRefine((data, ctx) => {
		/** Explizites Dev-Login: in jeder Umgebung nur mit starkem JWT (schützt Staging/Preview mit Internet). */
		if (allowDevLoginEnvIsExplicitlyOn(data.ALLOW_DEV_LOGIN)) {
			const s = data.JWT_SECRET;
			if (!s || s.length < 32 || s === DEV_JWT_PLACEHOLDER) {
				ctx.addIssue({
					code: 'custom',
					message:
						'Mit ALLOW_DEV_LOGIN=true (oder 1/yes) ist JWT_SECRET Pflicht: mindestens 32 Zeichen und nicht der Platzhalter dev-secret-change-in-production. Staging oder Preview mit Zugriff aus dem Internet: nie ohne starkes Secret, VPN/Firewall und sinnvoll gesetztes DEV_LOGIN_PASSWORD betreiben.'
				});
			}
		}

		if (data.NODE_ENV !== 'production') return;

		const secret = data.JWT_SECRET;
		if (!secret || secret.length < 32) {
			ctx.addIssue({
				code: 'custom',
				message:
					'JWT_SECRET muss in Production mindestens 32 Zeichen haben (starke Zufallszeichenkette setzen).'
			});
		} else if (secret === DEV_JWT_PLACEHOLDER) {
			ctx.addIssue({
				code: 'custom',
				message: 'JWT_SECRET darf in production nicht dem Platzhalter-Wert entsprechen.'
			});
		}
		if (data.COOKIE_INSECURE === '1' || data.COOKIE_INSECURE === 'true') {
			ctx.addIssue({
				code: 'custom',
				message: 'COOKIE_INSECURE ist in production nicht erlaubt (Session-Cookies müssen Secure sein).'
			});
		}
		if (allowDevLoginEnvIsExplicitlyOn(data.ALLOW_DEV_LOGIN)) {
			if (!authEntraOptionalInProduction(data.AUTH_ENTRA_OPTIONAL_IN_PRODUCTION)) {
				ctx.addIssue({
					code: 'custom',
					message:
						'ALLOW_DEV_LOGIN in production nur mit AUTH_ENTRA_OPTIONAL_IN_PRODUCTION=true (Betrieb ohne Entra) plus DEV_LOGIN_PASSWORD (mindestens 16 Zeichen).'
				});
			} else {
				const devPw = data.DEV_LOGIN_PASSWORD?.trim() ?? '';
				if (devPw.length < 16) {
					ctx.addIssue({
						code: 'custom',
						message:
							'In production mit Dev-Login: DEV_LOGIN_PASSWORD Pflicht, mindestens 16 Zeichen (Admin-Zugang ohne Microsoft).'
					});
				}
			}
		}

		if (authEntraOptionalInProduction(data.AUTH_ENTRA_OPTIONAL_IN_PRODUCTION)) return;

		const clientId = data.AZURE_CLIENT_ID?.trim() ?? '';
		const tenantId = data.AZURE_TENANT_ID?.trim() ?? '';
		const redirect = data.AZURE_REDIRECT_URI?.trim() ?? '';

		if (!clientId) {
			ctx.addIssue({
				code: 'custom',
				message:
					'In production ist AZURE_CLIENT_ID Pflicht (Microsoft Entra / MSAL), sofern nicht AUTH_ENTRA_OPTIONAL_IN_PRODUCTION=true für eine rein interne Instanz gesetzt ist.'
			});
			return;
		}
		if (!AZURE_GUID_RE.test(clientId)) {
			ctx.addIssue({
				code: 'custom',
				message:
					'AZURE_CLIENT_ID muss eine gültige GUID sein (Azure-Portal → App-Registrierung → Anwendungs-ID).'
			});
			return;
		}
		if (!tenantId) {
			ctx.addIssue({
				code: 'custom',
				message:
					'In production ist AZURE_TENANT_ID Pflicht (Verzeichnis-ID oder z. B. common), sofern nicht AUTH_ENTRA_OPTIONAL_IN_PRODUCTION=true gesetzt ist.'
			});
			return;
		}
		if (!redirect) {
			ctx.addIssue({
				code: 'custom',
				message:
					'In production ist AZURE_REDIRECT_URI Pflicht (öffentliche https-URL der App, in Entra registriert), sofern nicht AUTH_ENTRA_OPTIONAL_IN_PRODUCTION=true gesetzt ist.'
			});
			return;
		}
		let redirectUrl: URL;
		try {
			redirectUrl = new URL(redirect);
		} catch {
			ctx.addIssue({
				code: 'custom',
				message: 'AZURE_REDIRECT_URI muss eine gültige absolute URL sein (http:// oder https://).'
			});
			return;
		}
		if (redirectUrl.protocol !== 'http:' && redirectUrl.protocol !== 'https:') {
			ctx.addIssue({
				code: 'custom',
				message: 'AZURE_REDIRECT_URI muss mit http:// oder https:// beginnen.'
			});
			return;
		}
		if (isLocalHostish(redirectUrl.hostname)) {
			ctx.addIssue({
				code: 'custom',
				message:
					'AZURE_REDIRECT_URI darf in production nicht auf localhost / 127.0.0.1 zeigen — öffentliche Basis-URL setzen. Für lokale oder rein interne Szenarien AUTH_ENTRA_OPTIONAL_IN_PRODUCTION=true (nur bewusst, abgeschirmt) nutzen.'
			});
		}
	});

function snapshotPrivateEnv() {
	return {
		NODE_ENV: env.NODE_ENV,
		JWT_SECRET: env.JWT_SECRET,
		ALLOW_DEV_LOGIN: env.ALLOW_DEV_LOGIN,
		DEV_LOGIN_PASSWORD: env.DEV_LOGIN_PASSWORD,
		COOKIE_INSECURE: env.COOKIE_INSECURE,
		AUTH_ENTRA_OPTIONAL_IN_PRODUCTION: env.AUTH_ENTRA_OPTIONAL_IN_PRODUCTION,
		AZURE_CLIENT_ID: env.AZURE_CLIENT_ID,
		AZURE_TENANT_ID: env.AZURE_TENANT_ID,
		AZURE_REDIRECT_URI: env.AZURE_REDIRECT_URI
	};
}

/** Fail-fast bei ungültiger Konfiguration (v. a. production). */
export function assertValidPrivateEnv(): void {
	const result = privateEnvSchema.safeParse(snapshotPrivateEnv());
	if (!result.success) {
		const detail = result.error.issues.map((i) => i.message).join(' ');
		throw new Error(`Konfiguration: ${detail}`);
	}
}
